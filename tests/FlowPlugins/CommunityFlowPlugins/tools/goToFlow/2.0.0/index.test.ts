import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/goToFlow/2.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('goToFlow Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        flowId: 'test-flow-id',
        pluginId: 'start',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it('should return the input file object unchanged', () => {
      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should work with custom inputs', () => {
      baseArgs.inputs.flowId = 'custom-flow-123';
      baseArgs.inputs.pluginId = 'custom-plugin-456';

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Input Validation', () => {
    it('should handle various input scenarios', () => {
      // Test empty inputs
      baseArgs.inputs.flowId = '';
      baseArgs.inputs.pluginId = '';

      let result = plugin(baseArgs);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);

      // Test undefined inputs
      baseArgs.inputs = {} as Record<string, unknown>;
      result = plugin(baseArgs);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Variables Handling', () => {
    it('should preserve variables from input', () => {
      const testVariables = {
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
      };
      baseArgs.variables = testVariables;

      const result = plugin(baseArgs);

      expect(result.variables).toBe(testVariables);
    });
  });

  describe('File Object Handling', () => {
    it('should preserve the input file object completely', () => {
      const originalFileObj = baseArgs.inputFileObj;

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(originalFileObj);
      expect(result.outputFileObj._id).toBe(originalFileObj._id);
      // The outputFileObj in the result interface only has _id property
      // but the plugin actually returns the full input file object
      expect((result.outputFileObj as IFileObject).file).toBe(originalFileObj.file);
      expect((result.outputFileObj as IFileObject).container).toBe(originalFileObj.container);
    });
  });

  describe('Plugin Integration', () => {
    it('should load default values and return expected output', () => {
      // The plugin calls lib.loadDefaultValues internally
      // We don't mock this function as per instructions
      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });
  });
});
