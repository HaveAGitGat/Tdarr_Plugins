import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/notifyRadarrOrSonarr/3.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const mockAxios = jest.fn();

// Make setTimeout resolve instantly so polling doesn't actually wait
const originalSetTimeout = global.setTimeout;
beforeAll(() => {
  global.setTimeout = ((fn: () => void) => originalSetTimeout(fn, 0)) as unknown as typeof setTimeout;
});
afterAll(() => {
  global.setTimeout = originalSetTimeout;
});

const headers = {
  'Content-Type': 'application/json',
  'X-Api-Key': 'test_api_key_123',
  Accept: 'application/json',
};

// Queue the lookup/parse responses, then a refresh command that completes on the first poll
const mockRefresh = (...lookupResponses: unknown[]) => {
  lookupResponses.forEach((res) => mockAxios.mockResolvedValueOnce(res));
  return mockAxios
    .mockResolvedValueOnce({ data: { id: 50, status: 'queued' } })
    .mockResolvedValueOnce({ data: { id: 50, status: 'completed' } });
};

const lookupUrlCalled = () => mockAxios.mock.calls.some(([req]) => req.url.includes('/lookup'));

describe('notifyRadarrOrSonarr 3.0.0 Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.resetAllMocks();
    // Default: arr knows nothing
    mockAxios.mockResolvedValue({ data: {} });

    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test_api_key_123',
        arr_host: 'http://192.168.1.1:7878',
        unmonitor_after_refresh: 'false',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: 'C:/Movies/Test Movie (2023) [tt1234567]/Test Movie (2023).mkv',
      } as IFileObject,
      jobLog: jest.fn(),
      deps: {
        axios: mockAxios,
      },
    } as unknown as IpluginInputArgs;
  });

  describe('Radarr refresh', () => {
    it('should notify Radarr and wait for the scan when movie found by IMDB ID', async () => {
      mockRefresh({ data: [{ id: 123 }] });

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        headers,
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://192.168.1.1:7878/api/v3/command',
        headers,
        data: JSON.stringify({ name: 'RefreshMovie', movieIds: [123] }),
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:7878/api/v3/command/50',
        headers,
      });
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '123' found for 'imdb:tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("✔ Movie '123' scan completed in radarr.");
    });

    it('should fallback to parse API when IMDB lookup fails', async () => {
      mockRefresh({ data: [] }, { data: { movie: { id: 456 } } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie not found for 'imdb:tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '456' found for 'Test Movie (2023)'");
    });

    it('should return output 2 when movie not found', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should return output 2 when the scan does not complete', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 123 }] })
        .mockResolvedValueOnce({ data: { id: 50, status: 'queued' } })
        .mockResolvedValueOnce({ data: { id: 50, status: 'failed' } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("⚠ Movie '123' scan did not complete within timeout.");
    });

    it('should handle trailing slash and whitespace in host URL', async () => {
      baseArgs.inputs.arr_host = '  http://192.168.1.1:7878/  ';
      mockRefresh({ data: [{ id: 123 }] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        }),
      );
    });

    it('looks up by tmdb id from Plex-style {tmdb-} tag', async () => {
      baseArgs.originalLibraryFile._id = 'C:/Movies/Test Movie (2023) {tmdb-603}/Test Movie (2023).mkv';
      mockRefresh({ data: [{ id: 123 }] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=tmdb:603',
        }),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '123' found for 'tmdb:603'");
    });

    it('finds {tmdb-} tag even when another tag comes first', async () => {
      baseArgs.originalLibraryFile._id = 'C:/Movies/Test Movie {tvdb-1234} {tmdb-603}/Test Movie.mkv';
      mockRefresh({ data: [{ id: 123 }] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=tmdb:603',
        }),
      );
    });

    it('looks up by imdb id from Plex-style {imdb-} tag', async () => {
      baseArgs.originalLibraryFile._id = 'C:/Movies/Test Movie {imdb-tt7777777}/Test Movie.mkv';
      mockRefresh({ data: [{ id: 123 }] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt7777777',
        }),
      );
    });

    it('ignores {tvdb-} tag for radarr and falls back to parse API', async () => {
      baseArgs.originalLibraryFile._id = 'C:/Movies/Test Movie (2023) {tvdb-1234}/Test Movie (2023).mkv';
      baseArgs.inputFileObj._id = baseArgs.originalLibraryFile._id;
      mockRefresh({ data: { movie: { id: 456 } } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(lookupUrlCalled()).toBe(false);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/parse?title='),
        }),
      );
    });
  });

  describe('Sonarr refresh', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://192.168.1.1:8989';
      baseArgs.originalLibraryFile = {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: 'C:/TV Shows/Test Series (2023) [tt7654321]/Season 01/Test Series S01E01.mkv',
      } as IFileObject;
    });

    it('should notify Sonarr when series found by IMDB ID', async () => {
      mockRefresh({ data: [{ id: 123 }] });

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:8989/api/v3/series/lookup?term=imdb:tt7654321',
        headers,
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://192.168.1.1:8989/api/v3/command',
        headers,
        data: JSON.stringify({ name: 'RefreshSeries', seriesId: 123 }),
      });
      expect(result.outputNumber).toBe(1);
    });

    it('looks up by tvdb id from Plex-style {tvdb-} tag', async () => {
      baseArgs.originalLibraryFile._id = 'C:/TV Shows/Test Series {tvdb-123456}/Season 01/Test Series S01E01.mkv';
      mockRefresh({ data: [{ id: 123 }] });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:8989/api/v3/series/lookup?term=tvdb:123456',
        }),
      );
    });
  });

  describe('Radarr unmonitor', () => {
    beforeEach(() => {
      baseArgs.inputs.unmonitor_after_refresh = 'true';
    });

    it('unmonitors movie after refresh via PUT /movie/editor', async () => {
      mockRefresh({ data: [{ id: 123 }] }).mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'put',
        url: 'http://192.168.1.1:7878/api/v3/movie/editor',
        headers,
        data: JSON.stringify({ movieIds: [123], monitored: false }),
      });
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Radarr: movie id=123 unmonitored');
    });

    it('does not unmonitor when flag is false', async () => {
      baseArgs.inputs.unmonitor_after_refresh = 'false';
      mockRefresh({ data: [{ id: 123 }] });

      await plugin(baseArgs);

      // lookup + command + poll only
      expect(mockAxios).toHaveBeenCalledTimes(3);
      expect(baseArgs.jobLog).not.toHaveBeenCalledWith(expect.stringContaining('unmonitored'));
    });

    it('does not unmonitor when id not found', async () => {
      baseArgs.inputFileObj._id = baseArgs.originalLibraryFile._id;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      // lookup + parse only
      expect(mockAxios).toHaveBeenCalledTimes(2);
    });

    it('does not unmonitor when the scan does not complete', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 123 }] })
        .mockResolvedValueOnce({ data: { id: 50, status: 'queued' } })
        .mockResolvedValueOnce({ data: { id: 50, status: 'failed' } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(mockAxios).toHaveBeenCalledTimes(3);
    });

    it('unmonitor errors are non-fatal and still return output 1', async () => {
      mockRefresh({ data: [{ id: 123 }] }).mockRejectedValueOnce(new Error('PUT movie/editor failed'));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Unmonitor error (non-fatal): PUT movie/editor failed');
    });
  });

  describe('Sonarr unmonitor', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://192.168.1.1:8989';
      baseArgs.inputs.unmonitor_after_refresh = 'true';
      baseArgs.originalLibraryFile = {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: 'C:/TV Shows/Test Series [tt7654321]/Season 01/Test Series S01E05.mkv',
      } as IFileObject;
    });

    it('unmonitors episode via PUT /episode/monitor', async () => {
      mockRefresh({ data: [{ id: 42 }] })
        .mockResolvedValueOnce({ data: [{ id: 99, seasonNumber: 1, episodeNumber: 5 }] })
        .mockResolvedValueOnce({});

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:8989/api/v3/episode',
        headers,
        params: { seriesId: 42 },
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'put',
        url: 'http://192.168.1.1:8989/api/v3/episode/monitor',
        headers,
        data: JSON.stringify({ monitored: false, episodeIds: [99] }),
      });
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Sonarr: unmonitored S1E5 (episodeId=99)');
    });

    it('logs and skips unmonitor when SxxEyy not found in filename', async () => {
      baseArgs.originalLibraryFile._id = 'C:/TV Shows/Test Series [tt7654321]/Test Series.mkv';
      mockRefresh({ data: [{ id: 42 }] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('SxxEyy not detected'));
      // lookup + command + poll only
      expect(mockAxios).toHaveBeenCalledTimes(3);
    });

    it('logs and skips unmonitor when episode not found in series', async () => {
      mockRefresh({ data: [{ id: 42 }] }).mockResolvedValueOnce({ data: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Sonarr: episode S1E5 not found in seriesId 42');
    });
  });

  describe('misc', () => {
    it('uses currentFileName as fallback when originalFileName lookup fails', async () => {
      baseArgs.originalLibraryFile._id = 'C:/old/path/movie.mkv'; // no IMDB ID, so parse only
      baseArgs.inputFileObj._id = 'C:/new/path/movie.tt9999999.mkv';
      mockRefresh({ data: { movie: null } }, { data: [{ id: 777 }] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '777' found for 'imdb:tt9999999'");
    });

    it('handles API errors by throwing', async () => {
      mockAxios.mockRejectedValue(new Error('Network error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Network error');
    });
  });
});
