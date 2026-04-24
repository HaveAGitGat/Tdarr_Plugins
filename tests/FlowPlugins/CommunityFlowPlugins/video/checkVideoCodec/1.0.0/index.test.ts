import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkVideoCodec/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('checkVideoCodec Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        codec: 'h264',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Codec Detection', () => {
    it('should detect matching codec (H264)', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should detect matching codec (HEVC)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265)) as IFileObject;
      baseArgs.inputs.codec = 'hevc';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should reject non-matching codec', () => {
      baseArgs.inputs.codec = 'hevc'; // Looking for HEVC in H264 file

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should ignore audio streams when checking video codecs', () => {
      baseArgs.inputs.codec = 'aac'; // Audio codec, should not match for video

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Multiple Video Codec Types', () => {
    it.each([
      'hevc',
      'av1',
      'vp9',
      'h264',
      'vp8',
      'wmv2',
      'wmv3',
      'mpeg4',
      'mpeg2video',
      'mjpeg',
      'flv',
      'theora',
    ])('should detect %s codec when present', (codec) => {
      // Modify the video stream codec
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_name = codec;
      }
      baseArgs.inputs.codec = codec;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no video streams', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          sample_rate: '48000',
          channels: 2,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle files with multiple video streams', () => {
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

      baseArgs.inputs.codec = 'hevc';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle missing streams array', () => {
      delete baseArgs.inputFileObj.ffProbeData.streams;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle empty streams array', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with missing codec_type', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete (baseArgs.inputFileObj.ffProbeData.streams[0] as Record<string, unknown>).codec_type;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with missing codec_name', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete (baseArgs.inputFileObj.ffProbeData.streams[0] as Record<string, unknown>).codec_name;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Mixed Stream Types', () => {
    it('should find video codec among mixed stream types', () => {
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
          codec_name: 'h264',
          codec_type: 'video',
          width: 1280,
          height: 720,
        },
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
        },
      ];

      baseArgs.inputs.codec = 'h264';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });
});
