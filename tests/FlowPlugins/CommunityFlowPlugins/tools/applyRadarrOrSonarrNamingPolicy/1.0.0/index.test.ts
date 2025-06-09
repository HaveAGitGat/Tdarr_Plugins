import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/applyRadarrOrSonarrNamingPolicy/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock file move/copy function before importing the plugin
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

describe('applyRadarrOrSonarrNamingPolicy Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockFileMoveOrCopy: jest.MockedFunction<() => Promise<boolean>>;

  beforeEach(() => {
    // Import the mock after it's been set up
    mockFileMoveOrCopy = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy').default;
    mockFileMoveOrCopy.mockClear();
    mockFileMoveOrCopy.mockResolvedValue(true);

    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test-api-key',
        arr_host: 'http://localhost:7878',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: {
        _id: '/path/to/movie.tt1234567.2021.1080p.BluRay.x264-GROUP.mkv',
      } as IFileObject,
      jobLog: jest.fn(),
      deps: {
        axios: jest.fn(),
        fsextra: {},
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        yargsParser: jest.fn(),
        fs: {},
        path: {},
        os: {},
        nodeModules: {},
        configVars: {},
      },
    } as unknown as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Radarr Integration', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'radarr';
      baseArgs.inputs.arr_host = 'http://localhost:7878';
    });

    it('should successfully rename movie file using IMDB lookup', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [{ id: 123 }],
        })
        .mockResolvedValueOnce({
          data: [{ newPath: '/movies/Movie Title (2021)/Movie Title (2021) - 1080p BluRay.mkv' }],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenCalledTimes(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Movie \'123\' found for imdb \'tt1234567\'');
      expect(mockFileMoveOrCopy).toHaveBeenCalled();
    });

    it('should handle movie not found in Radarr', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [],
        })
        .mockResolvedValueOnce({
          data: {},
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Movie not found for imdb \'tt1234567\'');
    });

    it('should handle no rename necessary', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [{ id: 123 }],
        })
        .mockResolvedValueOnce({
          data: [],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ No rename necessary.');
    });

    it('should handle host URL with trailing slash', async () => {
      baseArgs.inputs.arr_host = 'http://localhost:7878/';

      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [{ id: 123 }],
        })
        .mockResolvedValueOnce({
          data: [{ newPath: '/movies/Movie Title (2021)/Movie Title (2021).mkv' }],
        });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        }),
      );
    });
  });

  describe('Sonarr Integration', () => {
    beforeEach(() => {
      baseArgs.inputs.arr = 'sonarr';
      baseArgs.inputs.arr_host = 'http://localhost:8989';
      baseArgs.originalLibraryFile._id = '/path/to/series.tt7654321.S01E05.Episode.Title.1080p.WEB-DL.x264-GROUP.mkv';
    });

    it('should successfully rename series episode using IMDB lookup', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [{ id: 789 }],
        })
        .mockResolvedValueOnce({
          data: [{
            newPath: '/tv/Series Name/Season 01/Series Name - s01e05 - Episode Title.mkv',
            episodeNumbers: [5],
          }],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Serie \'789\' found for imdb \'tt7654321\'');
    });

    it('should handle series not found in Sonarr', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [],
        })
        .mockResolvedValueOnce({
          data: {},
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Serie not found for imdb \'tt7654321\'');
    });

    it('should handle episode not found in rename response', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [{ id: 789 }],
        })
        .mockResolvedValueOnce({
          data: [{
            newPath: '/tv/Series Name/Season 01/Series Name - s01e01 - Other Episode.mkv',
            episodeNumbers: [1], // Different episode
          }],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('✔ No rename necessary.');
    });

    it('should extract season and episode numbers from filename', async () => {
      baseArgs.originalLibraryFile._id = '/path/to/series.tt1111111.S03E12.Episode.Title.mkv';

      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: [{ id: 555 }],
        })
        .mockResolvedValueOnce({
          data: [{
            newPath: '/tv/Series Name/Season 03/Series Name - s03e12 - Episode Title.mkv',
            episodeNumbers: [12],
          }],
        });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:8989/api/v3/rename?seriesId=555&seasonNumber=3',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle files without IMDB ID and use parse API', async () => {
      baseArgs.originalLibraryFile._id = '/path/to/movie.without.imdb.2021.1080p.BluRay.x264-GROUP.mkv';

      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({
          data: { movie: { id: 123 } },
        })
        .mockResolvedValueOnce({
          data: [{ newPath: '/movies/Movie Without IMDB (2021)/Movie Without IMDB (2021).mkv' }],
        });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://localhost:7878/api/v3/parse?title=movie.without.imdb.2021.1080p.BluRay.x264-GROUP',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key',
          Accept: 'application/json',
        },
      });
    });

    it('should handle empty API responses gracefully', async () => {
      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Input Validation', () => {
    it('should work with different arr types', async () => {
      // Test radarr
      const radarrArgs = { ...baseArgs };
      radarrArgs.inputs.arr = 'radarr';
      const mockAxiosRadarr = radarrArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxiosRadarr.mockClear();
      mockAxiosRadarr
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: {} });

      await plugin(radarrArgs);

      expect(mockAxiosRadarr).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/movie/lookup'),
        }),
      );

      // Test sonarr
      const sonarrArgs = { ...baseArgs };
      sonarrArgs.inputs.arr = 'sonarr';
      const mockAxiosSonarr = sonarrArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxiosSonarr.mockClear();
      mockAxiosSonarr
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: {} });

      await plugin(sonarrArgs);

      expect(mockAxiosSonarr).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v3/series/lookup'),
        }),
      );
    });

    it('should handle whitespace in host URL', async () => {
      baseArgs.inputs.arr_host = '  http://localhost:7878  ';

      const mockAxios = baseArgs.deps.axios as jest.MockedFunction<() => Promise<unknown>>;
      mockAxios
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: {} });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        }),
      );
    });
  });
});
