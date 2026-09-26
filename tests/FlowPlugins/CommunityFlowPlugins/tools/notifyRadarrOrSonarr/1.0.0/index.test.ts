import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/notifyRadarrOrSonarr/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock axios to avoid actual HTTP calls
const mockAxios = jest.fn();
const mockJobLog = jest.fn();

describe('notifyRadarrOrSonarr Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    // Reset mocks
    mockAxios.mockClear();
    mockJobLog.mockClear();

    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test-api-key-123',
        arr_host: 'http://192.168.1.100:7878',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: mockJobLog,
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Set up the required props for the plugin
    Object.assign(baseArgs, {
      originalLibraryFile: {
        meta: {
          FileName: 'SampleMovie_2023.mp4',
        },
      },
      deps: {
        axios: mockAxios,
      },
    });
  });

  describe('Radarr Integration', () => {
    it('should successfully refresh movie in Radarr', async () => {
      // Mock the parse API response
      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });

      // Mock the command API response
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await plugin(baseArgs);

      // Verify outputs
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);

      // Verify API calls
      expect(mockAxios).toHaveBeenCalledTimes(2);

      // First call - parse API
      expect(mockAxios).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: 'http://192.168.1.100:7878/api/v3/parse?title=SampleMovie_2023.mp4',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key-123',
          Accept: 'application/json',
        },
      });

      // Second call - command API
      expect(mockAxios).toHaveBeenNthCalledWith(2, {
        method: 'post',
        url: 'http://192.168.1.100:7878/api/v3/command',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key-123',
          Accept: 'application/json',
        },
        data: JSON.stringify({
          name: 'RefreshMovie',
          movieIds: [123],
        }),
      });

      // Verify log messages
      expect(mockJobLog).toHaveBeenCalledWith('Going to force scan');
      expect(mockJobLog).toHaveBeenCalledWith('Refreshing Radarr...');
      expect(mockJobLog).toHaveBeenCalledWith('✔ Refreshed movie 123 in Radarr.');
    });

    it('should handle Radarr host with trailing slash', async () => {
      baseArgs.inputs.arr_host = 'http://192.168.1.100:7878/';

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 456,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      // Verify trailing slash was removed
      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'http://192.168.1.100:7878/api/v3/parse?title=SampleMovie_2023.mp4',
      }));
    });

    it('should handle encoded file names properly', async () => {
      if (baseArgs.originalLibraryFile?.meta) {
        baseArgs.originalLibraryFile.meta.FileName = 'Movie With Spaces & Special (2023).mp4';
      }

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 789,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'http://192.168.1.100:7878/api/v3/parse?title=Movie%20With%20Spaces%20%26%20Special%20(2023).mp4',
      }));
    });
  });

  describe('Sonarr Integration', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://192.168.1.100:8989';
      if (baseArgs.originalLibraryFile?.meta) {
        baseArgs.originalLibraryFile.meta.FileName = 'TV.Show.S01E01.Episode.Title.mp4';
      }
    });

    it('should successfully refresh series in Sonarr', async () => {
      // Mock the parse API response
      mockAxios.mockResolvedValueOnce({
        data: {
          series: {
            id: 42,
          },
        },
      });

      // Mock the command API response
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await plugin(baseArgs);

      // Verify outputs
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);

      // Verify API calls
      expect(mockAxios).toHaveBeenCalledTimes(2);

      // First call - parse API
      expect(mockAxios).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: 'http://192.168.1.100:8989/api/v3/parse?title=TV.Show.S01E01.Episode.Title.mp4',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key-123',
          Accept: 'application/json',
        },
      });

      // Second call - command API
      expect(mockAxios).toHaveBeenNthCalledWith(2, {
        method: 'post',
        url: 'http://192.168.1.100:8989/api/v3/command',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key-123',
          Accept: 'application/json',
        },
        data: JSON.stringify({
          name: 'RefreshSeries',
          seriesId: 42,
        }),
      });

      // Verify log messages
      expect(mockJobLog).toHaveBeenCalledWith('Going to force scan');
      expect(mockJobLog).toHaveBeenCalledWith('Refreshing Sonarr...');
      expect(mockJobLog).toHaveBeenCalledWith('✔ Refreshed series 42 in Sonarr.');
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid arr type', async () => {
      baseArgs.inputs.arr = 'invalid';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).not.toHaveBeenCalled();
      expect(mockJobLog).toHaveBeenCalledWith('Going to force scan');
      expect(mockJobLog).toHaveBeenCalledWith('No arr specified in plugin inputs.');
    });

    it('should handle missing API key', async () => {
      baseArgs.inputs.arr_api_key = '';

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      // Should still make the call with empty API key
      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        headers: expect.objectContaining({
          'X-Api-Key': '',
        }),
      }));
    });

    it('should handle missing filename', async () => {
      Object.assign(baseArgs, { originalLibraryFile: undefined });

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      // Should make the call with empty filename
      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'http://192.168.1.100:7878/api/v3/parse?title=',
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during parse request', async () => {
      mockAxios.mockRejectedValueOnce(new Error('Network error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Network error');
      expect(mockAxios).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors during command request', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockRejectedValueOnce(new Error('Command failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('Command failed');
      expect(mockAxios).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed parse response', async () => {
      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {}, // Missing movieFile
        },
      });

      await expect(plugin(baseArgs)).rejects.toThrow();
    });
  });

  describe('Host Configuration', () => {
    it('should work with HTTPS URLs', async () => {
      baseArgs.inputs.arr_host = 'https://radarr.example.com';

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'https://radarr.example.com/api/v3/parse?title=SampleMovie_2023.mp4',
      }));
    });

    it('should work with custom ports', async () => {
      baseArgs.inputs.arr_host = 'http://localhost:9999';

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'http://localhost:9999/api/v3/parse?title=SampleMovie_2023.mp4',
      }));
    });

    it('should handle host URLs with extra whitespace', async () => {
      baseArgs.inputs.arr_host = '  http://192.168.1.100:7878  ';

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'http://192.168.1.100:7878/api/v3/parse?title=SampleMovie_2023.mp4',
      }));
    });
  });

  describe('Different File Types', () => {
    it.each([
      'Movie.Title.2023.1080p.BluRay.x264.mp4',
      'TV.Show.S01E01.1080p.WEB-DL.x265.mkv',
      'Documentary.Name.2023.4K.HDR.mov',
      'Animation.Movie.2023.720p.WEB.avi',
    ])('should handle file: %s', async (fileName) => {
      if (baseArgs.originalLibraryFile?.meta) {
        baseArgs.originalLibraryFile.meta.FileName = fileName;
      }

      mockAxios.mockResolvedValueOnce({
        data: {
          movie: {
            movieFile: {
              movieId: 123,
            },
          },
        },
      });
      mockAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: expect.stringContaining(encodeURIComponent(fileName)),
      }));
    });
  });

  describe('Unmonitor After Refresh', () => {
    it('should not unmonitor by default', async () => {
      mockAxios.mockResolvedValueOnce({ data: { movie: { movieFile: { movieId: 123 } } } });
      mockAxios.mockResolvedValueOnce({ data: {} });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledTimes(2);
    });

    it('should unmonitor the movie in Radarr', async () => {
      baseArgs.inputs.unmonitor = true;
      mockAxios.mockResolvedValueOnce({ data: { movie: { movieFile: { movieId: 123 } } } });
      mockAxios.mockResolvedValueOnce({ data: {} });
      mockAxios.mockResolvedValueOnce({ data: [] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledTimes(3);
      expect(mockAxios).toHaveBeenNthCalledWith(3, {
        method: 'put',
        url: 'http://192.168.1.100:7878/api/v3/movie/editor',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key-123',
          Accept: 'application/json',
        },
        data: JSON.stringify({ movieIds: [123], monitored: false }),
      });
      expect(mockJobLog).toHaveBeenCalledWith('✔ Unmonitored movie 123 in Radarr.');
    });

    it('should unmonitor only the file\'s episodes in Sonarr', async () => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://192.168.1.100:8989';
      baseArgs.inputs.unmonitor = true;
      mockAxios.mockResolvedValueOnce({ data: { series: { id: 42 }, episodes: [{ id: 7 }, { id: 8 }] } });
      mockAxios.mockResolvedValueOnce({ data: {} });
      mockAxios.mockResolvedValueOnce({ data: [] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledTimes(3);
      expect(mockAxios).toHaveBeenNthCalledWith(3, expect.objectContaining({
        method: 'put',
        url: 'http://192.168.1.100:8989/api/v3/episode/monitor',
        data: JSON.stringify({ episodeIds: [7, 8], monitored: false }),
      }));
      expect(mockJobLog).toHaveBeenCalledWith('✔ Unmonitored episode(s) 7, 8 in Sonarr.');
    });

    it('should skip the Sonarr unmonitor when no episodes matched', async () => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.unmonitor = true;
      mockAxios.mockResolvedValueOnce({ data: { series: { id: 42 }, episodes: [] } });
      mockAxios.mockResolvedValueOnce({ data: {} });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledTimes(2);
      expect(mockJobLog).toHaveBeenCalledWith('No episodes matched this file, nothing to unmonitor in Sonarr.');
    });

    it('should log and continue when the Radarr unmonitor fails', async () => {
      baseArgs.inputs.unmonitor = true;
      mockAxios.mockResolvedValueOnce({ data: { movie: { movieFile: { movieId: 123 } } } });
      mockAxios.mockResolvedValueOnce({ data: {} });
      mockAxios.mockRejectedValueOnce(new Error('Request failed with status code 500'));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockJobLog).toHaveBeenCalledWith(
        'Failed to unmonitor movie 123 in Radarr: Request failed with status code 500',
      );
    });

    it('should log and continue when the Sonarr unmonitor fails', async () => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.unmonitor = true;
      mockAxios.mockResolvedValueOnce({ data: { series: { id: 42 }, episodes: [{ id: 7 }] } });
      mockAxios.mockResolvedValueOnce({ data: {} });
      mockAxios.mockRejectedValueOnce(new Error('timeout'));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockJobLog).toHaveBeenCalledWith('Failed to unmonitor episode(s) 7 in Sonarr: timeout');
    });
  });
});
