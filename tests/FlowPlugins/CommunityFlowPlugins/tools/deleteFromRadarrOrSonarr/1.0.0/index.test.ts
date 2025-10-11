import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/deleteFromRadarrOrSonarr/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const mockAxios = jest.fn();

describe('deleteFromRadarrOrSonarr Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.mockReset();

    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test-api-key',
        arr_host: 'http://localhost:7878',
        deleteFiles: true,
        addToBlocklist: true,
        searchForReplacement: true,
      },
      variables: {
        _id: 'test-id',
      },
      inputFileObj: {
        _id: '/movies/test-movie.mkv',
      },
      originalLibraryFile: {
        _id: '/movies/test-movie.mkv',
      },
      deps: {
        axios: mockAxios,
      },
      jobLog: jest.fn(),
    } as unknown as IpluginInputArgs;
  });

  describe('Radarr Operations', () => {
    it('should successfully delete movie from Radarr with all options enabled', async () => {
      // Mock successful movie lookup
      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        // Mock successful file retrieval
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        // Mock successful history retrieval
        .mockResolvedValueOnce({
          data: {
            records: [
              {
                id: 789,
                movieId: 123,
                movieFileId: 456,
                eventType: 1,
                sourceTitle: 'Test.Movie.2023.1080p.BluRay',
                data: {
                  guid: 'test-guid',
                  indexer: 'TestIndexer',
                  downloadUrl: 'http://example.com/download',
                },
              },
            ],
          },
        })
        // Mock successful blocklist addition
        .mockResolvedValueOnce({})
        // Mock successful file deletion
        .mockResolvedValueOnce({})
        // Mock successful search command
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Movie \'123\' found in radarr');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Found matching file: /movies/test-movie.mkv');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Found download history for Movie \'123\'');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Release added to blocklist');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ File deleted from radarr');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Search for replacement initiated');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ All actions completed successfully');

      // Verify API calls
      expect(mockAxios).toHaveBeenCalledTimes(6);
      expect(mockAxios).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: 'http://localhost:7878/api/v3/parse?title=test-movie',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key',
          Accept: 'application/json',
        },
      });
    });

    it('should handle IMDB ID in filename', async () => {
      baseArgs.originalLibraryFile._id = '/movies/Test Movie (2023) tt1234567.mkv';

      mockAxios
        // Mock successful IMDB lookup
        .mockResolvedValueOnce({
          data: [{ id: 123 }],
        })
        // Mock successful file retrieval
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/Test Movie (2023) tt1234567.mkv',
              relativePath: 'Test Movie (2023) tt1234567.mkv',
            },
          ],
        })
        // Mock successful history retrieval
        .mockResolvedValueOnce({
          data: { records: [] },
        })
        // Mock successful file deletion
        .mockResolvedValueOnce({})
        // Mock successful search command
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://localhost:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        headers: expect.any(Object),
      });
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Movie \'123\' found for IMDB ID \'tt1234567\'');
    });

    it('should handle movie not found in Radarr', async () => {
      mockAxios.mockResolvedValueOnce({
        data: { movie: null },
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✖ Movie not found in radarr');
    });

    it('should handle file not found in Radarr library', async () => {
      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/different-movie.mkv',
              relativePath: 'different-movie.mkv',
            },
          ],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✖ File not found in radarr library');
    });

    it('should skip operations based on configuration flags', async () => {
      // Test skipping all optional operations
      baseArgs.inputs.deleteFiles = false;
      baseArgs.inputs.addToBlocklist = false;
      baseArgs.inputs.searchForReplacement = false;

      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('⚠ File deletion skipped (deleteFiles is false)');

      // Verify no history lookup, blocklist, delete, or search operations were performed
      expect(mockAxios).toHaveBeenCalledTimes(2); // Only parse and file lookup
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/history'),
        }),
      );
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/blocklist'),
        }),
      );
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'delete',
        }),
      );
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/command'),
        }),
      );
    });
  });

  describe('Sonarr Operations', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://localhost:8989';
      baseArgs.originalLibraryFile._id = '/tv/test-show/S01E01.mkv';
      baseArgs.inputFileObj._id = '/tv/test-show/S01E01.mkv';
    });

    it('should successfully delete episode from Sonarr', async () => {
      mockAxios
        .mockResolvedValueOnce({
          data: { series: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              seriesId: 123,
              seasonNumber: 1,
              path: '/tv/test-show/S01E01.mkv',
              relativePath: 'S01E01.mkv',
              episodeIds: [789],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: {
            records: [
              {
                id: 999,
                seriesId: 123,
                episodeFileId: 456,
                eventType: 1,
                sourceTitle: 'Test.Show.S01E01.1080p.WEB-DL',
                data: {
                  guid: 'test-guid',
                  indexer: 'TestIndexer',
                  torrentInfoHash: 'test-hash',
                },
              },
            ],
          },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Series \'123\' found in sonarr');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Found matching file: /tv/test-show/S01E01.mkv');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Found download history for Series \'123\'');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Release added to blocklist');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ File deleted from sonarr');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Search for replacement initiated');

      // Verify Sonarr-specific API calls
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://localhost:8989/api/v3/episodefile?seriesId=123',
        headers: expect.any(Object),
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://localhost:8989/api/v3/command',
        headers: expect.any(Object),
        data: { name: 'SeriesSearch', seriesId: 123 },
      });
    });

    it('should handle torrent protocol in blocklist', async () => {
      mockAxios
        .mockResolvedValueOnce({
          data: { series: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              seriesId: 123,
              path: '/tv/test-show/S01E01.mkv',
              relativePath: 'S01E01.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: {
            records: [
              {
                id: 999,
                seriesId: 123,
                episodeFileId: 456,
                eventType: 1,
                sourceTitle: 'Test.Show.S01E01.Torrent',
                data: {
                  downloadUrl: 'magnet:?xt=urn:btih:test',
                  indexer: 'TorrentIndexer',
                  torrentInfoHash: 'test-hash',
                },
              },
            ],
          },
        })
        .mockResolvedValueOnce({}) // blocklist response
        .mockResolvedValueOnce({}) // delete response
        .mockResolvedValueOnce({}); // search response

      await plugin(baseArgs);

      // The test focuses on blocklist functionality, which is the 4th call
      expect(mockAxios).toHaveBeenNthCalledWith(4, {
        method: 'post',
        url: 'http://localhost:8989/api/v3/blocklist',
        headers: expect.any(Object),
        data: {
          seriesId: 123,
          sourceTitle: 'Test.Show.S01E01.Torrent',
          protocol: 'torrent',
          indexer: 'TorrentIndexer',
          message: 'Blocked by Tdarr due to processing issues',
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when API key is missing', async () => {
      baseArgs.inputs.arr_api_key = '';

      await expect(plugin(baseArgs)).rejects.toThrow('API key is required');
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.mockRejectedValueOnce(new Error('Network error'));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✖ Error finding Movie: Error: Network error');
    });

    it('should handle file deletion failure', async () => {
      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: { records: [] },
        })
        .mockRejectedValueOnce(new Error('Delete failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('Delete failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✖ Failed to delete file: Error: Delete failed');
    });

    it('should continue when non-critical operations fail', async () => {
      // Test continuing after blocklist and search failures
      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: {
            records: [
              {
                id: 789,
                movieId: 123,
                movieFileId: 456,
                eventType: 1,
                sourceTitle: 'Test.Movie',
                data: {
                  guid: 'test-guid',
                  indexer: 'TestIndexer',
                },
              },
            ],
          },
        })
        .mockRejectedValueOnce(new Error('Blocklist failed')) // blocklist fails
        .mockResolvedValueOnce({}) // delete succeeds
        .mockRejectedValueOnce(new Error('Search failed')); // search fails

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('⚠ Failed to add to blocklist: Error: Blocklist failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('⚠ Failed to initiate search: Error: Search failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ All actions completed successfully');
    });
  });

  describe('File Path Matching', () => {
    it('should handle various file path matching scenarios', async () => {
      // Test 1: Normalized paths (Windows vs Unix)
      baseArgs.originalLibraryFile._id = '/movies/Test Movie.mkv';

      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '\\movies\\Test Movie.mkv', // Windows path
              relativePath: 'Test Movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: { records: [] },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      let result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Found matching file: \\movies\\Test Movie.mkv');

      // Reset for Test 2: Match by filename when paths differ
      jest.clearAllMocks();
      mockAxios.mockReset();
      baseArgs.originalLibraryFile._id = '/different/path/test-movie.mkv';

      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: { records: [] },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        '⚠ Found file with matching name but different path: /movies/test-movie.mkv',
      );

      // Reset for Test 3: Use current file path when original lookup fails
      jest.clearAllMocks();
      mockAxios.mockReset();
      baseArgs.originalLibraryFile._id = '/old/path/movie.mkv';
      baseArgs.inputFileObj._id = '/new/path/movie.mkv';

      mockAxios
        .mockResolvedValueOnce({
          data: { movie: null },
        })
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/new/path/movie.mkv',
              relativePath: 'movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: { records: [] },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: 'http://localhost:7878/api/v3/parse?title=movie',
        headers: expect.any(Object),
      });
      expect(mockAxios).toHaveBeenNthCalledWith(2, {
        method: 'get',
        url: 'http://localhost:7878/api/v3/parse?title=movie',
        headers: expect.any(Object),
      });
    });
  });

  describe('Input Validation', () => {
    it('should handle various input formats', async () => {
      // Test string boolean values and URL normalization
      baseArgs.inputs.deleteFiles = 'true';
      baseArgs.inputs.addToBlocklist = 'false';
      baseArgs.inputs.searchForReplacement = 'true';
      baseArgs.inputs.arr_host = 'http://localhost:7878/  '; // trailing slash and spaces

      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Verify URL was trimmed and normalized
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://localhost:7878/api/v3/parse?title=test-movie',
        headers: expect.any(Object),
      });
      // Verify blocklist was skipped (addToBlocklist = 'false')
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/history'),
        }),
      );
    });
  });

  describe('History Edge Cases', () => {
    it('should handle incomplete or missing history data', async () => {
      // Test 1: Empty history records
      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: { records: [] },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      let result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('⚠ No download history found for Movie \'123\'');
      expect(mockAxios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/blocklist'),
        }),
      );

      // Reset for Test 2: History with missing required data fields
      jest.clearAllMocks();
      mockAxios.mockReset();

      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 456,
              movieId: 123,
              path: '/movies/test-movie.mkv',
              relativePath: 'test-movie.mkv',
            },
          ],
        })
        .mockResolvedValueOnce({
          data: {
            records: [
              {
                id: 789,
                movieId: 123,
                movieFileId: 456,
                eventType: 1,
                data: {}, // Missing guid, torrentInfoHash, and downloadId
              },
            ],
          },
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('⚠ No download history found for Movie \'123\'');
    });
  });
});
