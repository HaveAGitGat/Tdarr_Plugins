import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/webRequest/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import getConfigVars from '../../../../configVars';

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
        output2StatusCodes: '',
        output2OnNetworkError: 'false',
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
        configVars: getConfigVars(),
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

    it('should throw on unconfigured non-2xx responses', async () => {
      const mockResponse = {
        status: 429,
        data: { error: 'Rate limited' },
      };
      mockAxios.mockResolvedValue(mockResponse);

      await expect(plugin(baseArgs)).rejects.toThrow('Web Request Failed');

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request failed: Status Code: 429');
    });
  });

  describe('Output 2 Routing', () => {
    it('should route configured status codes to output 2', async () => {
      baseArgs.inputs.output2StatusCodes = '404,429';
      const mockResponse = {
        status: 429,
        data: { error: 'Rate limited' },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request failed: Status Code: 429');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Routing status code 429 to output 2');
    });

    it('should route configured status code ranges to output 2', async () => {
      baseArgs.inputs.output2StatusCodes = '400-499, 500-599';
      const mockResponse = {
        status: 503,
        data: { error: 'Unavailable' },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Web request failed: Status Code: 503');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Routing status code 503 to output 2');
    });

    it('should ignore blank status code entries', async () => {
      baseArgs.inputs.output2StatusCodes = '404, ,429,';
      const mockResponse = {
        status: 404,
        data: { error: 'Not Found' },
      };
      mockAxios.mockResolvedValue(mockResponse);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Routing status code 404 to output 2');
    });

    it('should route configured HTTP error responses to output 2', async () => {
      baseArgs.inputs.output2StatusCodes = '404';
      const httpError = {
        response: {
          status: 404,
          data: { error: 'Not Found' },
        },
        message: 'Request failed with status code 404',
      };
      mockAxios.mockRejectedValue(httpError);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Routing status code 404 to output 2');
    });

    it('should route network errors to output 2 when enabled', async () => {
      baseArgs.inputs.output2OnNetworkError = 'true';
      const networkError = new Error('Network Error');
      mockAxios.mockRejectedValue(networkError);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Routing network error to output 2');
    });

    it('should not route unconfigured HTTP responses through the network error switch', async () => {
      baseArgs.inputs.output2OnNetworkError = 'true';
      const httpError = {
        response: {
          status: 500,
          data: { error: 'Server Error' },
        },
        message: 'Request failed with status code 500',
      };
      mockAxios.mockRejectedValue(httpError);

      await expect(plugin(baseArgs)).rejects.toThrow('Web Request Failed');

      expect(baseArgs.jobLog).not.toHaveBeenCalledWith('Routing network error to output 2');
    });

    it('should not route response processing errors through the network error switch', async () => {
      baseArgs.inputs.logResponseBody = 'true';
      baseArgs.inputs.output2OnNetworkError = 'true';
      const circularResponseData: Record<string, unknown> = {};
      circularResponseData.self = circularResponseData;
      const mockResponse = {
        status: 200,
        data: circularResponseData,
      };
      mockAxios.mockResolvedValue(mockResponse);

      await expect(plugin(baseArgs)).rejects.toThrow('Converting circular structure to JSON');

      expect(baseArgs.jobLog).not.toHaveBeenCalledWith('Routing network error to output 2');
    });

    it('should reject invalid output 2 status code configuration', async () => {
      baseArgs.inputs.output2StatusCodes = '404,abc';

      await expect(plugin(baseArgs)).rejects.toThrow('Invalid Output 2 Status Codes value: abc');

      expect(mockAxios).not.toHaveBeenCalled();
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
      [299, 'Custom Success'],
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
