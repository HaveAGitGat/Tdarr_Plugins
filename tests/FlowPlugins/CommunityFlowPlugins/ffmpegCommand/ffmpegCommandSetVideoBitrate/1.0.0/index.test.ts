import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVideoBitrate/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandSetVideoBitrate Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        useInputBitrate: 'false',
        targetBitratePercent: '50',
        fallbackBitrate: '4000',
        bitrate: '5000',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:0'],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:1'],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: true,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fixed Bitrate Mode', () => {
    it('should set fixed video bitrate when useInputBitrate is false', () => {
      baseArgs.inputs.useInputBitrate = 'false';
      baseArgs.inputs.bitrate = '8000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('-b:v:{outputTypeIndex}');
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('8000k');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using fixed bitrate. Setting video bitrate as 8000k');
    });

    it('should use default bitrate when not specified', () => {
      baseArgs.inputs.useInputBitrate = 'false';
      delete baseArgs.inputs.bitrate;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('5000k');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using fixed bitrate. Setting video bitrate as 5000k');
    });
  });

  describe('Percentage of Input Bitrate Mode', () => {
    it('should calculate bitrate based on input video bitrate', () => {
      baseArgs.inputs.useInputBitrate = 'true';
      baseArgs.inputs.targetBitratePercent = '75';

      const result = plugin(baseArgs);

      // From sampleH264_1.json, video stream has BitRate: "1205959" which is ~1206k
      // 75% of 1206k = ~904.5k
      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('-b:v:{outputTypeIndex}');
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('904.4692500000001k');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Attempting to use % of input bitrate as output bitrate');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found input bitrate: 1205959');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting video bitrate as 904.4692500000001k');
    });

    it('should use fallback bitrate when input bitrate is not available', () => {
      baseArgs.inputs.useInputBitrate = 'true';
      baseArgs.inputs.fallbackBitrate = '6000';

      // Remove the video track BitRate to simulate missing input bitrate
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const videoTrack = baseArgs.inputFileObj.mediaInfo.track.find((t) => t['@type'] === 'Video');
        if (videoTrack && 'BitRate' in videoTrack) {
          delete (videoTrack as Record<string, unknown>).BitRate;
        }
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('6000k');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Attempting to use % of input bitrate as output bitrate');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Unable to find input bitrate, setting fallback bitrate as 6000k');
    });

    it('should use fallback when mediaInfo track is missing', () => {
      baseArgs.inputs.useInputBitrate = 'true';
      baseArgs.inputs.fallbackBitrate = '7000';

      // Remove mediaInfo entirely
      delete baseArgs.inputFileObj.mediaInfo;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('7000k');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Unable to find input bitrate, setting fallback bitrate as 7000k');
    });

    it('should handle default values for percentage and fallback', () => {
      baseArgs.inputs.useInputBitrate = 'true';
      delete baseArgs.inputs.targetBitratePercent;
      delete baseArgs.inputs.fallbackBitrate;

      const result = plugin(baseArgs);

      // 50% (default) of ~1206k = ~603k
      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('602.9795k');
    });
  });

  describe('Stream Processing', () => {
    it('should only process video streams', () => {
      baseArgs.inputs.useInputBitrate = 'false';
      baseArgs.inputs.bitrate = '2000';

      const result = plugin(baseArgs);

      // Video stream should have bitrate args
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('-b:v:{outputTypeIndex}');
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('2000k');

      // Audio stream should not have any video bitrate args
      expect(result.variables.ffmpegCommand.streams[1].outputArgs).not.toContain('-b:v:{outputTypeIndex}');
    });

    it('should handle multiple video streams', () => {
      // Add another video stream
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'h265',
        codec_type: 'video',
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:2'],
      });

      baseArgs.inputs.useInputBitrate = 'false';
      baseArgs.inputs.bitrate = '3000';

      const result = plugin(baseArgs);

      // Both video streams should have bitrate set
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('3000k');
      expect(result.variables.ffmpegCommand.streams[2].outputArgs).toContain('3000k');
      // Audio stream should remain unchanged
      expect(result.variables.ffmpegCommand.streams[1].outputArgs).toHaveLength(0);
    });

    it('should handle streams with no codec_type', () => {
      // Remove codec_type from video stream
      (baseArgs.variables.ffmpegCommand.streams[0] as Record<string, unknown>).codec_type = undefined;
      baseArgs.inputs.bitrate = '1500';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should not add bitrate args since codec_type is missing
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero percentage', () => {
      baseArgs.inputs.useInputBitrate = 'true';
      baseArgs.inputs.targetBitratePercent = '0';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('0k');
    });

    it('should handle very high percentage', () => {
      baseArgs.inputs.useInputBitrate = 'true';
      baseArgs.inputs.targetBitratePercent = '200';

      const result = plugin(baseArgs);

      // 200% of ~1206k = ~2412k
      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].outputArgs).toContain('2411.918k');
    });

    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });

  describe('Default Values Loading', () => {
    it('should load default values when inputs are not provided', () => {
      baseArgs.inputs = {};

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should use default fixed bitrate mode with 5000k bitrate
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Using fixed bitrate. Setting video bitrate as 5000k');
    });
  });
});
