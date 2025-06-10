import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandCustomArguments/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandCustomArguments Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        inputArguments: '',
        outputArguments: '',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [],
          container: 'mkv',
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
    it('should pass through with no arguments', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([]);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([]);
    });

    it('should add single input argument', () => {
      baseArgs.inputs.inputArguments = '-threads 4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(['-threads', '4']);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([]);
    });

    it('should add single output argument', () => {
      baseArgs.inputs.outputArguments = '-preset medium';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([]);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual(['-preset', 'medium']);
    });

    it('should add both input and output arguments', () => {
      baseArgs.inputs.inputArguments = '-threads 4';
      baseArgs.inputs.outputArguments = '-preset medium';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(['-threads', '4']);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual(['-preset', 'medium']);
    });
  });

  describe('Multiple Arguments', () => {
    it('should handle multiple input arguments', () => {
      baseArgs.inputs.inputArguments = '-threads 4 -hwaccel cuda -hwaccel_output_format cuda';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([
        '-threads', '4', '-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda',
      ]);
    });

    it('should handle multiple output arguments', () => {
      baseArgs.inputs.outputArguments = '-preset medium -crf 23 -pix_fmt yuv420p';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([
        '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
      ]);
    });

    it('should handle complex arguments with quotes and special characters', () => {
      baseArgs.inputs.inputArguments = '-filter_complex "[0:v]scale=1920:1080[v]"';
      baseArgs.inputs.outputArguments = '-map "[v]" -map 0:a';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([
        '-filter_complex', '"[0:v]scale=1920:1080[v]"',
      ]);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([
        '-map', '"[v]"', '-map', '0:a',
      ]);
    });
  });

  describe('Existing Arguments', () => {
    it('should append to existing input arguments', () => {
      baseArgs.variables.ffmpegCommand.overallInputArguments = ['-y', '-nostdin'];
      baseArgs.inputs.inputArguments = '-threads 4';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([
        '-y', '-nostdin', '-threads', '4',
      ]);
    });

    it('should append to existing output arguments', () => {
      baseArgs.variables.ffmpegCommand.overallOuputArguments = ['-c:v', 'libx264'];
      baseArgs.inputs.outputArguments = '-preset medium';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([
        '-c:v', 'libx264', '-preset', 'medium',
      ]);
    });

    it('should append to both existing input and output arguments', () => {
      baseArgs.variables.ffmpegCommand.overallInputArguments = ['-y'];
      baseArgs.variables.ffmpegCommand.overallOuputArguments = ['-c:v', 'libx264'];
      baseArgs.inputs.inputArguments = '-threads 4';
      baseArgs.inputs.outputArguments = '-preset medium';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([
        '-y', '-threads', '4',
      ]);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([
        '-c:v', 'libx264', '-preset', 'medium',
      ]);
    });
  });

  describe('Edge Cases', () => {
    it.each([
      ['empty strings', '', ''],
      ['whitespace only', '   ', '   '],
      ['single space', ' ', ' '],
    ])('should handle %s arguments (treated as empty)', (_, inputArgs, outputArgs) => {
      baseArgs.inputs.inputArguments = inputArgs;
      baseArgs.inputs.outputArguments = outputArgs;

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([]);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([]);
    });

    it('should convert non-string inputs to strings', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.inputs as any).inputArguments = 123;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.inputs as any).outputArguments = true;

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual(['123']);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual(['true']);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when ffmpegCommand is not initialized', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly. Please use the "Begin Command" plugin before using this plugin.',
      );
    });

    it('should throw error when ffmpegCommand is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.variables as any).ffmpegCommand = undefined;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly. Please use the "Begin Command" plugin before using this plugin.',
      );
    });

    it('should throw error when variables is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs as any).variables = undefined;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly. Please use the "Begin Command" plugin before using this plugin.',
      );
    });
  });

  describe('Output Structure', () => {
    it('should return correct output structure and preserve variables', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.variables as any).otherProperty = 'test';
      const originalVariables = baseArgs.variables;

      const result = plugin(baseArgs);

      expect(result).toHaveProperty('outputFileObj');
      expect(result).toHaveProperty('outputNumber');
      expect(result).toHaveProperty('variables');
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(originalVariables);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.variables as any).otherProperty).toBe('test');
    });
  });
});
