import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/webRequest/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('webRequest Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockAxios: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;

  beforeEach(() => {
    // Create mock axios function
    mockAxios = jest.fn();

    baseArgs = {
      inputs: {
        method: 'post',
        requestUrl: 'http://example.com',
        requestHeaders: '{"Content-Type": "application/json"}',
        requestBody: '{"test": "test"}',
        logResponseBody: 'false',
      },
      variables: {
        ffmpegCommand: {
          init: false,
          inputFiles: [],
          streams: [],
          container: '',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)) as IFileObject,
      jobLog: jest.fn(),
      deps: {
        axios: mockAxios,
        fsextra: jest.fn(),
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        flowUtils: jest.fn(),
        archiver: jest.fn(),
        unrar: jest.fn(),
        sevenBin: jest.fn(),
        nodeDiskInfo: jest.fn(),
        configVars: {},
      },
    } as unknown as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Requests', () => {
    it('should handle successful POST request', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'test' },
      });
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request succeeded: Status Code: 200');
    });

    it('should handle successful GET request', async () => {
      baseArgs.inputs.method = 'get';
      const mockResponse = {
        status: 200,
        data: { result: 'success' },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'test' },
      });
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request succeeded: Status Code: 200');
    });

    it('should handle successful PUT request', async () => {
      baseArgs.inputs.method = 'put';
      const mockResponse = {
        status: 201,
        data: { updated: true },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'put',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'test' },
      });
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request succeeded: Status Code: 201');
    });

    it('should handle successful DELETE request', async () => {
      baseArgs.inputs.method = 'delete';
      const mockResponse = {
        status: 204,
        data: null,
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'delete',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'test' },
      });
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request succeeded: Status Code: 204');
    });
  });

  describe('Response Logging', () => {
    it('should log response body when logResponseBody is true', async () => {
      baseArgs.inputs.logResponseBody = 'true';
      const mockResponse = {
        status: 200,
        data: { message: 'Hello World', id: 123 },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request succeeded: Status Code: 200');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Response Body: {"message":"Hello World","id":123}');
    });

    it('should not log response body when logResponseBody is false', async () => {
      baseArgs.inputs.logResponseBody = 'false';
      const mockResponse = {
        status: 200,
        data: { secret: 'sensitive data' },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request succeeded: Status Code: 200');
      expect(baseArgs.jobLog).not.toHaveBeenCalledWith(expect.stringContaining('Response Body:'));
    });
  });

  describe('Different URLs and Headers', () => {
    it('should handle different URLs', async () => {
      baseArgs.inputs.requestUrl = 'https://api.example.com/webhook';
      const mockResponse = {
        status: 200,
        data: {},
      };
      mockAxios.mockResolvedValue(mockResponse);

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://api.example.com/webhook',
        headers: { 'Content-Type': 'application/json' },
        data: { test: 'test' },
      });
    });

    it('should handle custom headers', async () => {
      baseArgs.inputs.requestHeaders = '{"Authorization": "Bearer token123", "X-Custom": "value"}';
      const mockResponse = {
        status: 200,
        data: {},
      };
      mockAxios.mockResolvedValue(mockResponse);

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://example.com',
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom': 'value',
        },
        data: { test: 'test' },
      });
    });

    it('should handle complex request body', async () => {
      baseArgs.inputs.requestBody = '{"user": {"name": "John", "age": 30}, "items": [1, 2, 3]}';
      const mockResponse = {
        status: 200,
        data: {},
      };
      mockAxios.mockResolvedValue(mockResponse);

      await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' },
        data: {
          user: { name: 'John', age: 30 },
          items: [1, 2, 3],
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxios.mockRejectedValue(networkError);

      await expect(plugin(baseArgs)).rejects.toThrow('Web Request Failed');

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web Request Failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(networkError));
    });

    it('should handle HTTP error responses', async () => {
      const httpError = {
        response: {
          status: 404,
          data: { error: 'Not Found' },
        },
        message: 'Request failed with status code 404',
      };
      mockAxios.mockRejectedValue(httpError);

      await expect(plugin(baseArgs)).rejects.toThrow('Web Request Failed');

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web Request Failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(httpError));
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };
      mockAxios.mockRejectedValue(timeoutError);

      await expect(plugin(baseArgs)).rejects.toThrow('Web Request Failed');

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web Request Failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(timeoutError));
    });
  });

  describe('Input Validation and Edge Cases', () => {
    it('should handle empty request body', async () => {
      baseArgs.inputs.requestBody = '{}';
      const mockResponse = {
        status: 200,
        data: {},
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' },
        data: {},
      });
      expect(result.outputNumber).toBe(1);
    });

    it('should handle empty headers', async () => {
      baseArgs.inputs.requestHeaders = '{}';
      const mockResponse = {
        status: 200,
        data: {},
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://example.com',
        headers: {},
        data: { test: 'test' },
      });
      expect(result.outputNumber).toBe(1);
    });

    it('should preserve variables and pass through input file object', async () => {
      baseArgs.variables.user.customVar = 'testValue';
      const mockResponse = {
        status: 200,
        data: {},
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.variables.user.customVar).toBe('testValue');
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });

  describe('Status Code Variations', () => {
    it.each([
      [200, 'OK'],
      [201, 'Created'],
      [202, 'Accepted'],
      [204, 'No Content'],
      [300, 'Multiple Choices'],
    ])('should handle status code %d', async (statusCode, statusText) => {
      const mockResponse = {
        status: statusCode,
        data: { status: statusText },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Web request succeeded: Status Code: ${statusCode}`);
    });
  });
});
