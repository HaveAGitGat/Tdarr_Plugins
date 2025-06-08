import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVdeoResolution/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandSetVdeoResolution Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        targetResolution: '1080p',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              width: 1280,
              height: 720,
              outputArgs: [],
              inputArgs: [],
              removed: false,
              forceEncoding: false,
              mapArgs: ['-map', '0:0'],
            },
          ],
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

    // Set the video resolution to 720p for testing
    baseArgs.inputFileObj.video_resolution = '720p';
  });

  describe('Basic Resolution Scaling', () => {
    it('should set scale filter for 1080p when current resolution is 720p', () => {
      baseArgs.inputs.targetResolution = '1080p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should set scale filter for 720p when current resolution is 1080p', () => {
      baseArgs.inputs.targetResolution = '720p';
      baseArgs.inputFileObj.video_resolution = '1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1280:-2']);
    });

    it('should set scale filter for 480p', () => {
      baseArgs.inputs.targetResolution = '480p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=720:-2']);
    });

    it('should set scale filter for 1440p', () => {
      baseArgs.inputs.targetResolution = '1440p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=2560:-2']);
    });

    it('should set scale filter for 4KUHD', () => {
      baseArgs.inputs.targetResolution = '4KUHD';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=3840:-2']);
    });

    it('should use default 1080p scale for unknown resolution', () => {
      baseArgs.inputs.targetResolution = 'unknown';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });
  });

  describe('No Processing Cases', () => {
    it('should not process when target resolution matches current resolution', () => {
      baseArgs.inputs.targetResolution = '720p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
    });

    it('should not process when target resolution is 1080p and current is 1080p', () => {
      baseArgs.inputs.targetResolution = '1080p';
      baseArgs.inputFileObj.video_resolution = '1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
    });
  });

  describe('Multiple Streams', () => {
    it('should process only video streams', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_type: 'video',
          codec_name: 'h264',
          width: 1280,
          height: 720,
          outputArgs: [],
          inputArgs: [],
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:0'],
        },
        {
          index: 1,
          codec_type: 'audio',
          codec_name: 'aac',
          outputArgs: [],
          inputArgs: [],
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:1'],
        },
        {
          index: 2,
          codec_type: 'video',
          codec_name: 'h264',
          width: 1280,
          height: 720,
          outputArgs: [],
          inputArgs: [],
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
        },
      ];
      baseArgs.inputs.targetResolution = '1080p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toEqual([]);
      expect(result.variables.ffmpegCommand.streams[2].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should append to existing outputArgs', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', 'libx264'];
      baseArgs.inputs.targetResolution = '1080p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([
        '-c:v', 'libx264', '-vf', 'scale=1920:-2',
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });

    it('should handle missing video_resolution property', () => {
      (baseArgs.inputFileObj as any).video_resolution = undefined;
      baseArgs.inputs.targetResolution = '1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should handle null video_resolution', () => {
      (baseArgs.inputFileObj as any).video_resolution = null;
      baseArgs.inputs.targetResolution = '1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should handle 576p resolution (same as 480p)', () => {
      baseArgs.inputs.targetResolution = '576p';
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=720:-2']);
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

  describe('Type Conversion', () => {
    it('should convert targetResolution to string', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.inputs as any).targetResolution = 1080;
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should handle boolean targetResolution', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.inputs as any).targetResolution = true;
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      // Boolean true converts to 'true', which is not a valid resolution, so defaults to 1080p
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });
  });
});
