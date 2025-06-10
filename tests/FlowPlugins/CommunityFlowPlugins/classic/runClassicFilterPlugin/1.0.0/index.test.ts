import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/classic/runClassicFilterPlugin/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the classic plugin runner
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/classicPlugins', () => ({
  runClassicPlugin: jest.fn(),
}));

describe('runClassicFilterPlugin 1.0.0', () => {
  let baseArgs: IpluginInputArgs;
  let mockRunClassicPlugin: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRunClassicPlugin = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/classicPlugins').runClassicPlugin;

    baseArgs = {
      inputs: {
        pluginSourceId: 'Community:Tdarr_Plugin_00td_filter_by_codec',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      deps: {
        parseArgsStringToArgv: jest.fn(),
        fsextra: {},
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        axios: {},
        os: {},
        configVars: {},
      },
    } as unknown as IpluginInputArgs;
  });

  describe('Filter Processing', () => {
    it.each([
      {
        scenario: 'conditions met (processFile true)',
        mockResult: { processFile: true, infoLog: 'File meets filter conditions' },
        expectedOutput: 1,
      },
      {
        scenario: 'conditions not met (processFile false)',
        mockResult: { processFile: false, infoLog: 'File does not meet filter conditions' },
        expectedOutput: 2,
      },
      {
        scenario: 'processFile undefined',
        mockResult: { infoLog: 'No processFile property' },
        expectedOutput: 2,
      },
      {
        scenario: 'processFile null',
        mockResult: { processFile: null, infoLog: 'processFile is null' },
        expectedOutput: 2,
      },
      {
        scenario: 'truthy string value',
        mockResult: { processFile: 'true', infoLog: 'processFile is a string' },
        expectedOutput: 1,
      },
      {
        scenario: 'falsy number value',
        mockResult: { processFile: 0, infoLog: 'processFile is zero' },
        expectedOutput: 2,
      },
    ])('should return output $expectedOutput when $scenario', async ({ mockResult, expectedOutput }) => {
      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
      });

      const result = await plugin(baseArgs);

      expect(mockRunClassicPlugin).toHaveBeenCalledWith(baseArgs, 'filter');
      expect(result.outputNumber).toBe(expectedOutput);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
    });
  });

  describe('Different Filter Plugin Types', () => {
    it.each([
      {
        pluginId: 'Community:Tdarr_Plugin_00td_filter_by_codec',
        result: { processFile: true, infoLog: 'File has target codec' },
        expectedOutput: 1,
      },
      {
        pluginId: 'Community:Tdarr_Plugin_00td_filter_by_resolution',
        result: { processFile: false, infoLog: 'File resolution does not match filter' },
        expectedOutput: 2,
      },
      {
        pluginId: 'Community:Tdarr_Plugin_00td_filter_by_size',
        result: { processFile: true, infoLog: 'File size meets filter criteria' },
        expectedOutput: 1,
      },
    ])('should handle $pluginId', async ({ pluginId, result, expectedOutput }) => {
      baseArgs.inputs.pluginSourceId = pluginId;

      mockRunClassicPlugin.mockResolvedValue({ result });

      const pluginResult = await plugin(baseArgs);

      expect(pluginResult.outputNumber).toBe(expectedOutput);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it.each([
      {
        scenario: 'null result from classic plugin',
        mockResult: null,
        expectedOutput: 2,
        expectedLogCall: 'null',
      },
      {
        scenario: 'undefined result from classic plugin',
        mockResult: undefined,
        expectedOutput: 2,
        expectedLogCall: undefined,
      },
      {
        scenario: 'empty result object',
        mockResult: {},
        expectedOutput: 2,
        expectedLogCall: JSON.stringify({}, null, 2),
      },
    ])('should handle $scenario', async ({ mockResult, expectedOutput, expectedLogCall }) => {
      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(expectedOutput);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);

      if (expectedLogCall !== undefined) {
        expect(baseArgs.jobLog).toHaveBeenCalledWith(expectedLogCall);
      }
    });

    it('should handle complex filter with multiple criteria and error information', async () => {
      const complexMockResult = {
        processFile: false,
        infoLog: 'Filter failed due to missing metadata',
        error: 'Unable to determine file codec',
        details: {
          codec: 'unknown',
          resolution: 'unknown',
          size: 'unknown',
        },
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: complexMockResult,
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(complexMockResult, null, 2));
    });

    it('should verify classic plugin integration is called correctly', async () => {
      const mockResult = { processFile: true };

      mockRunClassicPlugin.mockResolvedValue({ result: mockResult });

      await plugin(baseArgs);

      // Verify the classic plugin integration works correctly
      expect(mockRunClassicPlugin).toHaveBeenCalledWith(baseArgs, 'filter');
    });
  });
});
