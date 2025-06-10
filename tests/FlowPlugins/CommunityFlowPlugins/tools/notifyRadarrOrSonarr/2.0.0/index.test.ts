import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/notifyRadarrOrSonarr/2.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock axios function directly
const mockAxios = jest.fn();

// Mock the require for lib
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: jest.fn((inputs) => inputs),
}));

describe('notifyRadarrOrSonarr Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();

    baseArgs = {
      inputs: {
        arr: 'radarr',
        arr_api_key: 'test_api_key_123',
        arr_host: 'http://192.168.1.1:7878',
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

    // Set up default mock responses for successful flow
    mockAxios.mockResolvedValue({ data: [{ id: 123 }] });
  });

  describe('Radarr Integration', () => {
    it('should successfully notify Radarr when movie found by IMDB ID', async () => {
      const result = await plugin(baseArgs);

      // Check that axios was called for IMDB lookup
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test_api_key_123',
          Accept: 'application/json',
        },
      });

      // Check that axios was called for refresh command
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
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '123' found for imdb 'tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("✔ Movie '123' refreshed in radarr.");
    });

    it('should fallback to parse API when IMDB lookup fails', async () => {
      // Mock IMDB lookup to return empty result, then parse API to return movie
      mockAxios
        .mockResolvedValueOnce({ data: [] }) // IMDB lookup fails
        .mockResolvedValueOnce({ data: { movie: { id: 456 } } }) // Parse succeeds
        .mockResolvedValueOnce({}); // Command succeeds

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie not found for imdb 'tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '456' found for 'Test Movie (2023)'");
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
  });

  describe('Sonarr Integration', () => {
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
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Serie '123' found for imdb 'tt7654321'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("✔ Serie '123' refreshed in sonarr.");
    });
  });

  describe('IMDB ID Extraction', () => {
    it('should extract IMDB ID with tt prefix', async () => {
      baseArgs.originalLibraryFile = {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: 'C:/Movies/Movie with tt1234567 ID/movie.mkv',
      } as IFileObject;

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/movie/lookup?term=imdb:tt1234567',
        }),
      );
    });

    it('should handle files without IMDB ID and use parse API', async () => {
      baseArgs.originalLibraryFile = {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: 'C:/Movies/Movie without IMDB/movie.mkv',
      } as IFileObject;

      // Mock parse API to return result
      mockAxios.mockResolvedValueOnce({ data: { movie: { id: 999 } } });

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://192.168.1.1:7878/api/v3/parse?title=movie',
        }),
      );
    });
  });

  describe('Error Cases', () => {
    it('should return output 2 when movie/series not found', async () => {
      // Mock all lookups to fail
      mockAxios
        .mockResolvedValueOnce({ data: [] }) // IMDB lookup fails
        .mockResolvedValueOnce({ data: { movie: null } }); // Parse fails

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie not found for imdb 'tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie not found for 'Test Movie (2023)'");
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.mockRejectedValue(new Error('Network error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Network error');
    });

    it('should handle missing originalLibraryFile', async () => {
      baseArgs.originalLibraryFile = undefined as unknown as IFileObject;

      // Mock parse API to return result
      mockAxios.mockResolvedValueOnce({ data: { movie: { id: 111 } } });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Configuration Validation', () => {
    it('should work with different API key formats', async () => {
      baseArgs.inputs.arr_api_key = 'different-api-key-format-123';

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Api-Key': 'different-api-key-format-123',
          }),
        }),
      );
    });

    it('should handle HTTPS URLs', async () => {
      baseArgs.inputs.arr_host = 'https://radarr.example.com';

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://radarr.example.com/api/v3/movie/lookup?term=imdb:tt1234567',
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

  describe('Logging', () => {
    it('should log all steps of the process', async () => {
      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Going to force scan');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Refreshing radarr...');
      expect(baseArgs.jobLog).toHaveBeenCalledWith("Movie '123' found for imdb 'tt1234567'");
      expect(baseArgs.jobLog).toHaveBeenCalledWith("✔ Movie '123' refreshed in radarr.");
    });
  });

  describe('Response Parsing', () => {
    it('should handle missing movie data in parse response', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: [] }) // IMDB lookup fails
        .mockResolvedValueOnce({ data: {} }); // Parse returns empty data

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle malformed API responses', async () => {
      mockAxios
        .mockResolvedValueOnce({ data: null }) // IMDB lookup returns null
        .mockResolvedValueOnce({ data: { movie: { id: null } } }); // Parse returns null ID

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });
});
