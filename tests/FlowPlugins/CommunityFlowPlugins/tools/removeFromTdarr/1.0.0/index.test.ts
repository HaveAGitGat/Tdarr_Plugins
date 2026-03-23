import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/removeFromTdarr/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('removeFromTdarr Plugin', () => {
  let baseArgs: IpluginInputArgs;

  const createBaseArgs = (inputFile = sampleH264): IpluginInputArgs => ({
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
      flowFailed: false,
      user: {},
    } as IpluginInputArgs['variables'],
    inputFileObj: JSON.parse(JSON.stringify(inputFile)) as IFileObject,
    jobLog: jest.fn(),
  } as Partial<IpluginInputArgs> as IpluginInputArgs);

  beforeEach(() => {
    baseArgs = createBaseArgs();
  });

  describe('Basic Functionality', () => {
    it('should set removeFromTdarr variable to true and return correct output', () => {
      const result = plugin(baseArgs);

      expect(result.variables.removeFromTdarr).toBe(true);
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should preserve existing variables when setting removeFromTdarr', () => {
      baseArgs.variables.user = { customVar: 'testValue' };
      baseArgs.variables.flowFailed = false;

      const result = plugin(baseArgs);

      expect(result.variables.removeFromTdarr).toBe(true);
      expect(result.variables.user).toEqual({ customVar: 'testValue' });
      expect(result.variables.flowFailed).toBe(false);
    });

    it('should overwrite existing removeFromTdarr variable', () => {
      baseArgs.variables.removeFromTdarr = false;

      const result = plugin(baseArgs);

      expect(result.variables.removeFromTdarr).toBe(true);
    });
  });

  describe('File Type Compatibility', () => {
    it.each([
      ['H264 video file', sampleH264],
      ['MP3 audio file', sampleMP3],
      ['AAC audio file', sampleAAC],
    ])('should work with %s', (_, sampleFile) => {
      const args = createBaseArgs(sampleFile);

      const result = plugin(args);

      expect(result.variables.removeFromTdarr).toBe(true);
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(args.inputFileObj);
    });
  });

  describe('Variable Persistence', () => {
    it('should maintain all existing variables structure', () => {
      const complexVariables = {
        ffmpegCommand: {
          init: true,
          inputFiles: ['/path/to/file.mkv'],
          streams: [],
          container: 'mkv',
          hardwareDecoding: true,
          shouldProcess: true,
          overallInputArguments: ['-hwaccel', 'auto'],
          overallOuputArguments: ['-c:v', 'libx264'],
        },
        flowFailed: false,
        user: {
          setting1: 'value1',
          setting2: 'value2',
        },
        healthCheck: 'Success' as const,
        queueTags: 'high-priority,video',
        liveSizeCompare: {
          enabled: true,
          compareMethod: 'percentage',
          thresholdPerc: 5,
          checkDelaySeconds: 30,
          error: false,
        },
      };

      baseArgs.variables = complexVariables;

      const result = plugin(baseArgs);

      expect(result.variables.removeFromTdarr).toBe(true);
      expect(result.variables.ffmpegCommand).toEqual(complexVariables.ffmpegCommand);
      expect(result.variables.flowFailed).toBe(complexVariables.flowFailed);
      expect(result.variables.user).toEqual(complexVariables.user);
      expect(result.variables.healthCheck).toBe(complexVariables.healthCheck);
      expect(result.variables.queueTags).toBe(complexVariables.queueTags);
      expect(result.variables.liveSizeCompare).toEqual(complexVariables.liveSizeCompare);
    });

    it('should work with additional runtime variables', () => {
      baseArgs.variables.healthCheck = 'Success';
      baseArgs.variables.queueTags = 'test-tag';

      const result = plugin(baseArgs);

      expect(result.variables.removeFromTdarr).toBe(true);
      expect(result.variables.healthCheck).toBe('Success');
      expect(result.variables.queueTags).toBe('test-tag');
    });
  });

  describe('Output Consistency', () => {
    it('should always return output number 1 regardless of input state', () => {
      // Test with default state
      expect(plugin(baseArgs).outputNumber).toBe(1);

      // Test with existing removeFromTdarr = false
      baseArgs.variables.removeFromTdarr = false;
      expect(plugin(baseArgs).outputNumber).toBe(1);

      // Test with different file type
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      expect(plugin(baseArgs).outputNumber).toBe(1);
    });

    it('should return the exact same file object reference', () => {
      const originalRef = baseArgs.inputFileObj;

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(originalRef);
      expect(Object.is(result.outputFileObj, originalRef)).toBe(true);
    });
  });
});
