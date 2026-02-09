import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/goToFlow/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('goToFlow Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        flowId: 'test-flow-123',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it('should return output number 1 for any valid input', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should preserve the input file object unchanged', () => {
      const originalFileObj = JSON.parse(JSON.stringify(baseArgs.inputFileObj));

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toEqual(originalFileObj);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should preserve variables unchanged', () => {
      baseArgs.variables.user = { testVar: 'testValue', anotherVar: '123' };

      const result = plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.user).toEqual({ testVar: 'testValue', anotherVar: '123' });
    });
  });

  describe('Flow ID Input Handling', () => {
    it('should work with different flow ID values', () => {
      const testFlowIds = ['flow-1', 'my-custom-flow', '12345', 'production-flow'];

      testFlowIds.forEach((flowId) => {
        baseArgs.inputs.flowId = flowId;

        const result = plugin(baseArgs);

        expect(result.outputNumber).toBe(1);
        expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      });
    });

    it('should work with empty flow ID', () => {
      baseArgs.inputs.flowId = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should work with undefined flow ID', () => {
      delete baseArgs.inputs.flowId;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal input arguments', () => {
      const minimalArgs = {
        inputs: {},
        variables: baseArgs.variables,
        inputFileObj: baseArgs.inputFileObj,
        jobLog: jest.fn(),
      } as Partial<IpluginInputArgs> as IpluginInputArgs;

      const result = plugin(minimalArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(minimalArgs.inputFileObj);
      expect(result.variables).toBe(minimalArgs.variables);
    });

    it('should maintain reference equality for objects', () => {
      const result = plugin(baseArgs);

      // Should maintain reference equality
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });
  });

  describe('Plugin Behavior Consistency', () => {
    it('should always return consistent results for same input', () => {
      const results = [];

      // Run plugin multiple times with same input
      for (let i = 0; i < 5; i += 1) {
        results.push(plugin(baseArgs));
      }

      // All results should be identical
      results.forEach((result) => {
        expect(result.outputNumber).toBe(1);
        expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
        expect(result.variables).toBe(baseArgs.variables);
      });
    });

    it('should not modify input arguments', () => {
      const originalInputs = JSON.parse(JSON.stringify(baseArgs.inputs));
      const originalVariables = JSON.parse(JSON.stringify(baseArgs.variables));
      const originalFileObj = JSON.parse(JSON.stringify(baseArgs.inputFileObj));

      plugin(baseArgs);

      // Verify inputs weren't modified (structure-wise)
      expect(baseArgs.inputs).toEqual(originalInputs);
      expect(baseArgs.variables).toEqual(originalVariables);
      expect(baseArgs.inputFileObj).toEqual(originalFileObj);
    });
  });
});
