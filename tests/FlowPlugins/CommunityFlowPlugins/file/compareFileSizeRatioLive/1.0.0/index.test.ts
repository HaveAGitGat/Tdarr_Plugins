import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/compareFileSizeRatioLive/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('compareFileSizeRatioLive Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        enabled: 'true',
        compareMethod: 'estimatedFinalSize',
        thresholdPerc: '60',
        checkDelaySeconds: '20',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it('should set up variables when enabled', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.liveSizeCompare).toEqual({
        enabled: true,
        compareMethod: 'estimatedFinalSize',
        thresholdPerc: 60,
        checkDelaySeconds: 20,
        error: false,
      });
    });

    it('should disable functionality when enabled is false', () => {
      baseArgs.inputs.enabled = 'false';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.liveSizeCompare).toEqual({
        enabled: false,
        compareMethod: 'estimatedFinalSize',
        thresholdPerc: 60,
        checkDelaySeconds: 20,
        error: false,
      });
    });
  });

  describe('Compare Method Settings', () => {
    it('should use estimatedFinalSize method by default', () => {
      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.compareMethod).toBe('estimatedFinalSize');
    });

    it('should use currentSize method when specified', () => {
      baseArgs.inputs.compareMethod = 'currentSize';

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.compareMethod).toBe('currentSize');
    });
  });

  describe('Threshold Configuration', () => {
    it('should use default threshold of 60%', () => {
      delete baseArgs.inputs.thresholdPerc;

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.thresholdPerc).toBe(60);
    });

    it('should handle custom threshold percentage', () => {
      baseArgs.inputs.thresholdPerc = '75';

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.thresholdPerc).toBe(75);
    });

    it('should handle numeric threshold values', () => {
      baseArgs.inputs.thresholdPerc = 80;

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.thresholdPerc).toBe(80);
    });
  });

  describe('Check Delay Configuration', () => {
    it('should use default delay of 20 seconds', () => {
      delete baseArgs.inputs.checkDelaySeconds;

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.checkDelaySeconds).toBe(20);
    });

    it('should handle custom delay seconds', () => {
      baseArgs.inputs.checkDelaySeconds = '30';

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.checkDelaySeconds).toBe(30);
    });

    it('should handle numeric delay values', () => {
      baseArgs.inputs.checkDelaySeconds = 10;

      const result = plugin(baseArgs);

      expect(result.variables.liveSizeCompare?.checkDelaySeconds).toBe(10);
    });
  });

  describe('Different File Types', () => {
    it('should work with video files (H264)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.liveSizeCompare?.error).toBe(false);
    });

    it('should work with audio files (MP3)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.liveSizeCompare?.error).toBe(false);
    });

    it('should work with audio files (AAC)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleAAC)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.liveSizeCompare?.error).toBe(false);
    });
  });

  describe('Variable Passthrough', () => {
    it('should maintain variables reference integrity', () => {
      const result = plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.liveSizeCompare).toBeDefined();
    });
  });

  describe('Input Parameter Validation', () => {
    it('should handle different enabled input types', () => {
      baseArgs.inputs.enabled = true;
      let result = plugin(baseArgs);
      expect(result.variables.liveSizeCompare?.enabled).toBe(true);

      baseArgs.inputs.enabled = 'false';
      result = plugin(baseArgs);
      expect(result.variables.liveSizeCompare?.enabled).toBe(false);
    });

    it('should handle missing inputs gracefully', () => {
      baseArgs.inputs = {};

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.liveSizeCompare).toBeDefined();
    });
  });

  describe('Output Consistency', () => {
    it('should always output to port 1', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should maintain file object integrity', () => {
      const originalFileObj = JSON.parse(JSON.stringify(baseArgs.inputFileObj));

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toEqual(originalFileObj);
    });

    it('should not modify input file object', () => {
      const originalFileObj = JSON.parse(JSON.stringify(baseArgs.inputFileObj));

      plugin(baseArgs);

      expect(baseArgs.inputFileObj).toEqual(originalFileObj);
    });
  });
});
