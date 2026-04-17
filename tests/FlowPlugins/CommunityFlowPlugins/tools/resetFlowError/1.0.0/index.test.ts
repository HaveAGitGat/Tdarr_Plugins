import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/resetFlowError/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('resetFlowError Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
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
        flowFailed: true, // Start with flow failed state
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Core Functionality', () => {
    it('should reset flowFailed from true to false and return correct output', () => {
      expect(baseArgs.variables.flowFailed).toBe(true);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.flowFailed).toBe(false);
    });

    it('should keep flowFailed as false when already false', () => {
      baseArgs.variables.flowFailed = false;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.flowFailed).toBe(false);
    });

    it('should preserve other variables while resetting flowFailed', () => {
      const originalUser = { customVar: 'test' };
      baseArgs.variables.user = originalUser;
      baseArgs.variables.flowFailed = true;

      const result = plugin(baseArgs);

      expect(result.variables.flowFailed).toBe(false);
      expect(result.variables.user).toBe(originalUser);
      expect(result.variables.ffmpegCommand).toBe(baseArgs.variables.ffmpegCommand);
    });
  });

  describe('Edge Cases and Input Handling', () => {
    it('should handle missing variables object gracefully', () => {
      delete (baseArgs as Partial<IpluginInputArgs>).variables;

      expect(() => plugin(baseArgs)).toThrow();
    });

    it('should work with different file types and preserve variable references', () => {
      const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      // Add custom properties to test they're preserved
      const extendedVariables = baseArgs.variables as typeof baseArgs.variables & {
        customProp: string;
      };
      extendedVariables.customProp = 'test';
      extendedVariables.flowFailed = true;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.flowFailed).toBe(false);
      expect((result.variables as typeof extendedVariables).customProp).toBe('test');
    });
  });
});
