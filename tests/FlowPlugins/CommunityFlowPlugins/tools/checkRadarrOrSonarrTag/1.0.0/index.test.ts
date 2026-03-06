import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/checkRadarrOrSonarrTag/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const mockAxios = jest.fn();
const mockJobLog = jest.fn();

describe('checkRadarrOrSonarrTag Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    mockAxios.mockClear();
    mockJobLog.mockClear();

    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test-api-key-123',
        arr_host: 'http://192.168.1.100:7878',
        tag_name: 'remux',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: mockJobLog,
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    Object.assign(baseArgs, {
      originalLibraryFile: {
        _id: '/movies/Movie.Name.tt1234567.2023.1080p.mkv',
      },
      deps: {
        axios: mockAxios,
      },
    });
  });

  describe('Radarr - Tag found via IMDB lookup', () => {
    it('should return output 1 when tag is present on movie', async () => {
      // IMDB lookup returns movie with tag IDs
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 10, tags: [1, 3, 5] }],
      });

      // Fetch all tags
      mockAxios.mockResolvedValueOnce({
        data: [
          { id: 1, label: 'remux' },
          { id: 2, label: 'upgrade' },
          { id: 3, label: '4k' },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);

      // Verify IMDB lookup call
      expect(mockAxios).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: 'http://192.168.1.100:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        headers: expect.objectContaining({
          'X-Api-Key': 'test-api-key-123',
        }),
      });

      // Verify tags fetch call
      expect(mockAxios).toHaveBeenNthCalledWith(2, {
        method: 'get',
        url: 'http://192.168.1.100:7878/api/v3/tag',
        headers: expect.objectContaining({
          'X-Api-Key': 'test-api-key-123',
        }),
      });
    });

    it('should return output 2 when tag is NOT present on movie', async () => {
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 10, tags: [2, 3] }],
      });

      mockAxios.mockResolvedValueOnce({
        data: [
          { id: 1, label: 'remux' },
          { id: 2, label: 'upgrade' },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Radarr - Fallback to parse endpoint', () => {
    it('should fall back to parse when no IMDB ID in filename', async () => {
      Object.assign(baseArgs, {
        originalLibraryFile: {
          _id: '/movies/Movie.Name.2023.1080p.mkv',
        },
      });

      // Parse endpoint returns movie
      mockAxios.mockResolvedValueOnce({
        data: {
          movie: { id: 20, tags: [1] },
        },
      });

      // Fetch all tags
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 1, label: 'remux' }],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: expect.stringContaining('/api/v3/parse?title='),
      }));
    });

    it('should fall back to parse when IMDB lookup fails', async () => {
      // IMDB lookup fails
      mockAxios.mockRejectedValueOnce(new Error('Not found'));

      // Parse endpoint returns movie
      mockAxios.mockResolvedValueOnce({
        data: {
          movie: { id: 20, tags: [1] },
        },
      });

      // Fetch all tags
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 1, label: 'remux' }],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockJobLog).toHaveBeenCalledWith(expect.stringContaining('Failed to lookup by IMDB ID'));
    });
  });

  describe('Radarr - Fallback to current filename', () => {
    it('should try current filename when original fails', async () => {
      baseArgs.inputFileObj._id = '/work/Movie.Renamed.tt7654321.2023.mkv';

      // IMDB lookup with original filename returns nothing
      mockAxios.mockResolvedValueOnce({ data: [{}] });

      // Parse with original filename returns nothing
      mockAxios.mockResolvedValueOnce({
        data: { movie: { id: -1 } },
      });

      // IMDB lookup with current filename succeeds
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 30, tags: [2] }],
      });

      // Fetch all tags
      mockAxios.mockResolvedValueOnce({
        data: [
          { id: 1, label: 'other' },
          { id: 2, label: 'remux' },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Sonarr Integration', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://192.168.1.100:8989';
      Object.assign(baseArgs, {
        originalLibraryFile: {
          _id: '/tv/Show.Name.S01E01.tt9876543.1080p.mkv',
        },
      });
    });

    it('should return output 1 when tag is present on series', async () => {
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 5, tags: [2] }],
      });

      mockAxios.mockResolvedValueOnce({
        data: [
          { id: 1, label: 'other' },
          { id: 2, label: 'remux' },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: 'http://192.168.1.100:8989/api/v3/series/lookup?term=imdb:tt9876543',
      }));
    });

    it('should use parse endpoint with series response for Sonarr', async () => {
      Object.assign(baseArgs, {
        originalLibraryFile: {
          _id: '/tv/Show.Name.S01E01.1080p.mkv',
        },
      });

      mockAxios.mockResolvedValueOnce({
        data: {
          series: { id: 15, tags: [1] },
        },
      });

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 1, label: 'remux' }],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Input Validation', () => {
    it('should return output 2 when no tag name specified', async () => {
      baseArgs.inputs.tag_name = '';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(mockAxios).not.toHaveBeenCalled();
    });

    it('should match tag name case-insensitively', async () => {
      baseArgs.inputs.tag_name = 'REMUX';

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 10, tags: [1] }],
      });

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 1, label: 'remux' }],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  it('should return output 2 when tag does not exist in arr', async () => {
    baseArgs.inputs.tag_name = 'nonexistent';

    mockAxios.mockResolvedValueOnce({
      data: [{ id: 10, tags: [1] }],
    });

    mockAxios.mockResolvedValueOnce({
      data: [{ id: 1, label: 'remux' }],
    });

    const result = await plugin(baseArgs);

    expect(result.outputNumber).toBe(2);
    expect(mockJobLog).toHaveBeenCalledWith(
      expect.stringContaining("does not exist in radarr"),
    );
  });

  it('should return output 2 when file not found in arr', async () => {
    Object.assign(baseArgs, {
      originalLibraryFile: {
        _id: '/movies/Unknown.Movie.2023.mkv',
      },
    });

    mockAxios.mockResolvedValueOnce({
      data: { movie: {} },
    });

    const result = await plugin(baseArgs);

    expect(result.outputNumber).toBe(2);
    expect(mockJobLog).toHaveBeenCalledWith(
      expect.stringContaining('not found in radarr'),
    );
  });

  describe('Host Configuration', () => {
    it('should handle trailing slash on host', async () => {
      baseArgs.inputs.arr_host = 'http://192.168.1.100:7878/';

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 10, tags: [1] }],
      });

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 1, label: 'remux' }],
      });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: expect.stringContaining('http://192.168.1.100:7878/api/v3/'),
      }));
    });

    it('should handle host with extra whitespace', async () => {
      baseArgs.inputs.arr_host = '  http://192.168.1.100:7878  ';

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 10, tags: [1] }],
      });

      mockAxios.mockResolvedValueOnce({
        data: [{ id: 1, label: 'remux' }],
      });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenNthCalledWith(1, expect.objectContaining({
        url: expect.stringContaining('http://192.168.1.100:7878/api/v3/'),
      }));
    });
  });

  describe('Error Handling', () => {
    it('should return output 2 when tag fetch fails', async () => {
      mockAxios.mockResolvedValueOnce({
        data: [{ id: 10, tags: [1] }],
      });

      // Tag fetch fails
      mockAxios.mockRejectedValueOnce(new Error('Network error'));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(mockJobLog).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch tags'));
    });
  });
});
