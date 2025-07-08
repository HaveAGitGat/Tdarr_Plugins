import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkVideoStreamsCount/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('checkVideoStreamsCount Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Single Video Stream', () => {
    it('should detect one video stream in H264 sample', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 1');
    });

    it('should detect one video stream in H265 sample', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 1');
    });
  });

  describe('Multiple Video Streams', () => {
    it('should detect multiple video streams', () => {
      // Add second video stream
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push({
          index: 2,
          codec_name: 'hevc',
          codec_type: 'video',
          width: 1920,
          height: 1080,
        });
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 2');
    });

    it('should handle three video streams', () => {
      // Add two more video streams
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push(
          {
            index: 2,
            codec_name: 'hevc',
            codec_type: 'video',
            width: 1920,
            height: 1080,
          },
          {
            index: 3,
            codec_name: 'vp9',
            codec_type: 'video',
            width: 3840,
            height: 2160,
          },
        );
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 3');
    });
  });

  describe('Mixed Stream Types', () => {
    it('should count only video streams among mixed types', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          width: 1280,
          height: 720,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          sample_rate: '48000',
          channels: 2,
        },
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
        },
        {
          index: 3,
          codec_name: 'hevc',
          codec_type: 'video',
          width: 1920,
          height: 1080,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 2');
    });

    it('should handle file with only audio streams', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          sample_rate: '48000',
          channels: 2,
        },
        {
          index: 1,
          codec_name: 'mp3',
          codec_type: 'audio',
          sample_rate: '44100',
          channels: 2,
        },
      ];

      expect(() => plugin(baseArgs)).toThrow('No video streams found in file.');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when ffProbeData is missing', () => {
      (baseArgs.inputFileObj as Partial<typeof baseArgs.inputFileObj>).ffProbeData = undefined;

      expect(() => plugin(baseArgs)).toThrow('ffProbeData or ffProbeData.streams is not available.');
    });

    it('should throw error when ffProbeData.streams is missing', () => {
      (baseArgs.inputFileObj.ffProbeData as Partial<typeof baseArgs.inputFileObj.ffProbeData>).streams = undefined;

      expect(() => plugin(baseArgs)).toThrow('ffProbeData or ffProbeData.streams is not available.');
    });

    it('should throw error when ffProbeData is null', () => {
      Object.assign(baseArgs.inputFileObj, { ffProbeData: null });

      expect(() => plugin(baseArgs)).toThrow('ffProbeData or ffProbeData.streams is not available.');
    });

    it('should throw error when ffProbeData.streams is null', () => {
      Object.assign(baseArgs.inputFileObj.ffProbeData, { streams: null });

      expect(() => plugin(baseArgs)).toThrow('ffProbeData or ffProbeData.streams is not available.');
    });

    it('should throw error when no video streams found', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [];

      expect(() => plugin(baseArgs)).toThrow('No video streams found in file.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle streams with missing codec_type', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          width: 1280,
          height: 720,
        } as Partial<Istreams> as Istreams,
        {
          index: 1,
          codec_name: 'h264',
          codec_type: 'video',
          width: 1280,
          height: 720,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 1');
    });

    it('should handle streams with undefined codec_type', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: undefined,
          width: 1280,
          height: 720,
        } as Partial<Istreams> as Istreams,
        {
          index: 1,
          codec_name: 'h264',
          codec_type: 'video',
          width: 1280,
          height: 720,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 1');
    });

    it('should handle case-sensitive codec_type', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'VIDEO', // Uppercase
          width: 1280,
          height: 720,
        },
        {
          index: 1,
          codec_name: 'h264',
          codec_type: 'video', // Lowercase
          width: 1280,
          height: 720,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1); // Only lowercase 'video' should match
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Number of video streams: 1');
    });
  });
});
