import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/notifyRadarrOrSonarr/3.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const mockAxios = jest.fn();

jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: jest.fn((inputs) => inputs),
}));

describe('notifyRadarrOrSonarr 3.0.0 Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockAxios.mockResolvedValue({ data: [{ id: 123 }] });
  });

  // ─── Refresh (inherited from 2.0.0) ───────────────────────────────────────

  describe('Radarr refresh', () => {
    it('should successfully notify Radarr when movie found by IMDB ID', async () => {
      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test_api_key_123',
          Accept: 'application/json',
        },
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://192.168.1.1:7878/api/v3/command',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test_api_key_123',
          Accept: 'application/json',
        },
        data: JSON.stringify({ name: 'RefreshMovie', movieIds: [123] }),
      });
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '123' found for imdb 'tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("✔ Movie '123' refreshed in radarr.");
    });

    it('should fallback to parse API when IMDB lookup fails', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { movie: { id: 456 } } })
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie not found for imdb 'tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '456' found for 'Test Movie (2023)'");
    });

    it('should return output 2 when movie not found', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { movie: null } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle trailing slash in host URL', async () => {
      baseArgs.inputs.arr_host = 'http://192.168.1.1:7878/';

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        }),
      );
    });

    it('should trim whitespace from host URL', async () => {
      baseArgs.inputs.arr_host = '  http://192.168.1.1:7878  ';

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
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

    it('should successfully notify Sonarr when series found by IMDB ID', async () => {
      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:8989/api/v3/series/lookup?term=imdb:tt7654321',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test_api_key_123',
          Accept: 'application/json',
        },
      });
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://192.168.1.1:8989/api/v3/command',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test_api_key_123',
          Accept: 'application/json',
        },
        data: JSON.stringify({ name: 'RefreshSeries', seriesId: 123 }),
      });
      expect(result.outputNumber).toBe(1);
    });
  });

  // ─── Radarr unmonitor ──────────────────────────────────────────────────────

  describe('Radarr unmonitor', () => {
    beforeEach(() => {
      baseArgs.inputs.unmonitor_after_refresh = 'true';
    });

    it('unmonitors movie after refresh via GET then PUT', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 123 }] }) // IMDB lookup
        .mockResolvedValueOnce({}) // RefreshMovie command
        .mockResolvedValueOnce({ data: { id: 123, monitored: true, title: 'Test Movie' } }) // GET movie
        .mockResolvedValueOnce({}); // PUT movie

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: 'http://192.168.1.1:7878/api/v3/movie/123',
        }),
      );
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: 'http://192.168.1.1:7878/api/v3/movie/123',
          data: expect.stringContaining('"monitored":false'),
        }),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ Radarr: movie id=123 unmonitored');
    });

    it('does not unmonitor when flag is false', async () => {
      baseArgs.inputs.unmonitor_after_refresh = 'false';

      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 123 }] })
        .mockResolvedValueOnce({});

      await plugin(baseArgs);

      // Only 2 calls: lookup + command. No GET/PUT for unmonitor.
      expect(mockAxios).toHaveBeenCalledTimes(2);
      expect(baseArgs.jobLog).not.toHaveBeenCalledWith(expect.stringContaining('unmonitored'));
    });

    it('does not unmonitor when refresh fails (id not found)', async () => {
      // Ensure no currentFileName fallback by making both paths the same
      baseArgs.inputFileObj._id = baseArgs.originalLibraryFile._id;

      mockAxios
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { movie: null } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(mockAxios).toHaveBeenCalledTimes(2);
    });

    it('unmonitor errors are non-fatal — still returns output 1', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 123 }] })
        .mockResolvedValueOnce({}) // command
        .mockRejectedValueOnce(new Error('GET movie failed')); // unmonitor GET fails

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Unmonitor error (non-fatal): GET movie failed'),
      );
    });
  });

  // ─── Sonarr unmonitor ──────────────────────────────────────────────────────

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
      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 42 }] }) // series lookup
        .mockResolvedValueOnce({}) // RefreshSeries command
        .mockResolvedValueOnce({ // GET /episode
          data: [{ id: 99, seasonNumber: 1, episodeNumber: 5 }],
        })
        .mockResolvedValueOnce({}); // PUT /episode/monitor

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: 'http://192.168.1.1:8989/api/v3/episode/monitor',
          data: JSON.stringify({ monitored: false, episodeIds: [99] }),
        }),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('unmonitored S1E5 (episodeId=99) via PUT /episode/monitor'),
      );
    });

    it('falls back to PUT /episode when /episode/monitor returns 405', async () => {
      const err405 = Object.assign(new Error('Method Not Allowed'), { response: { status: 405 } });

      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 42 }] }) // series lookup
        .mockResolvedValueOnce({}) // command
        .mockResolvedValueOnce({ data: [{ id: 99, seasonNumber: 1, episodeNumber: 5 }] }) // GET /episode
        .mockRejectedValueOnce(err405) // PUT /episode/monitor → 405
        .mockResolvedValueOnce({ data: { id: 99, monitored: true } }) // GET /episode/{id}
        .mockResolvedValueOnce({}); // PUT /episode

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('falling back to PUT /episode'),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('via PUT /episode'),
      );
    });

    it('logs and skips unmonitor when SxxEyy not found in filename', async () => {
      baseArgs.originalLibraryFile._id = 'C:/TV Shows/Test Series [tt7654321]/Test Series.mkv';

      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 42 }] })
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('SxxEyy not detected'),
      );
      // No episode unmonitor calls
      expect(mockAxios).toHaveBeenCalledTimes(2);
    });

    it('logs and skips unmonitor when episode not found in series', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [{ id: 42 }] })
        .mockResolvedValueOnce({}) // command
        .mockResolvedValueOnce({ data: [] }); // GET /episode → empty

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('not found in seriesId 42'),
      );
    });
  });

  // ─── Misc ──────────────────────────────────────────────────────────────────

  describe('misc', () => {
    it('uses currentFileName as fallback when originalFileName lookup fails', async () => {
      baseArgs.originalLibraryFile._id = 'C:/old/path/movie.mkv'; // no IMDB ID
      baseArgs.inputFileObj._id = 'C:/new/path/movie.tt9999999.mkv';

      mockAxios
        .mockResolvedValueOnce({ data: { movie: null } }) // original: parse not found (no IMDB so no lookup)
        .mockResolvedValueOnce({ data: [{ id: 777 }] }) // current: IMDB lookup found
        .mockResolvedValueOnce({}); // command

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '777' found for imdb 'tt9999999'");
    });

    it('handles API errors by throwing', async () => {
      mockAxios.mockRejectedValue(new Error('Network error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Network error');
    });
  });
});
