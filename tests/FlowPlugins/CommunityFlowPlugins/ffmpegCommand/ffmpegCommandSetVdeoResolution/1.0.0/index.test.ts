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

  describe('Resolution Scaling', () => {
    it.each([
      ['480p', '720p', ['-vf', 'scale=720:-2']],
      ['576p', '720p', ['-vf', 'scale=720:-2']],
      ['720p', '1080p', ['-vf', 'scale=1280:-2']],
      ['1080p', '720p', ['-vf', 'scale=1920:-2']],
      ['1440p', '720p', ['-vf', 'scale=2560:-2']],
      ['4KUHD', '720p', ['-vf', 'scale=3840:-2']],
      ['unknown', '720p', ['-vf', 'scale=1920:-2']],
    ])('should set scale filter for %s resolution', (targetRes, currentRes, expectedArgs) => {
      baseArgs.inputs.targetResolution = targetRes;
      baseArgs.inputFileObj.video_resolution = currentRes;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(expectedArgs);
    });

    it.each([
      ['720p', '720p'],
      ['1080p', '1080p'],
      ['4KUHD', '4KUHD'],
    ])('should not process when target resolution %s matches current resolution %s', (targetRes, currentRes) => {
      baseArgs.inputs.targetResolution = targetRes;
      baseArgs.inputFileObj.video_resolution = currentRes;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual([]);
    });
  });

  describe('Stream Processing', () => {
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

    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing video_resolution property', () => {
      (baseArgs.inputFileObj as Partial<IpluginInputArgs['inputFileObj']>).video_resolution = undefined;
      baseArgs.inputs.targetResolution = '1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should handle null video_resolution', () => {
      (baseArgs.inputFileObj as Partial<IpluginInputArgs['inputFileObj']>).video_resolution = undefined;
      baseArgs.inputs.targetResolution = '1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
    });

    it('should convert targetResolution to string', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.inputs as any).targetResolution = 1080;
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toEqual(['-vf', 'scale=1920:-2']);
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
});
