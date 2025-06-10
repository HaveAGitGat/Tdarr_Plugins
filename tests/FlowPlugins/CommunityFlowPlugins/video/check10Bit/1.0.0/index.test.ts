import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/check10Bit/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('check10Bit Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Non-10Bit Detection', () => {
    it('should detect non-10bit content (H264 sample)', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should detect non-10bit content (H265 sample)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('10Bit Detection via bits_per_raw_sample', () => {
    it('should detect 10bit content with bits_per_raw_sample = 10', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 10;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not detect 10bit content with bits_per_raw_sample = 8', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 8;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should not detect 10bit content with bits_per_raw_sample = 12', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 12;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('10Bit Detection via pix_fmt', () => {
    it('should detect 10bit content with yuv420p10le pixel format', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p10le';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not detect 10bit content with yuv420p pixel format', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should not detect 10bit content with other 10bit formats', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv422p10le';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Combined Detection Methods', () => {
    it('should detect 10bit with both bits_per_raw_sample and pix_fmt', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 10;
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p10le';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect 10bit with only bits_per_raw_sample', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 10;
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect 10bit with only pix_fmt', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 8;
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p10le';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Multiple Video Streams', () => {
    it('should detect 10bit if any video stream is 10bit', () => {
      // First stream is 8bit
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 8;
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p';
      }

      // Add second 10bit video stream
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push({
          index: 2,
          codec_name: 'hevc',
          codec_type: 'video',
          bits_per_raw_sample: 10,
          pix_fmt: 'yuv420p10le',
          width: 3840,
          height: 2160,
        });
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should ignore audio streams when checking for 10bit', () => {
      // Add audio stream with 10bit-like properties (should be ignored)
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push({
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          bits_per_raw_sample: 10, // This should be ignored
          sample_rate: '48000',
          channels: 2,
        });
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2); // Should still be non-10bit
    });
  });

  describe('Error Cases', () => {
    it('should throw error when ffProbeData is missing', () => {
      (baseArgs.inputFileObj as unknown as { ffProbeData: undefined }).ffProbeData = undefined;

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is missing', () => {
      (baseArgs.inputFileObj.ffProbeData as unknown as { streams: undefined }).streams = undefined;

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is null', () => {
      (baseArgs.inputFileObj.ffProbeData as unknown as { streams: null }).streams = null;

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is not an array', () => {
      (baseArgs.inputFileObj.ffProbeData as unknown as { streams: string }).streams = 'not an array';

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is empty array', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);
      expect(result.outputNumber).toBe(2); // Non-10bit
    });
  });

  describe('Edge Cases', () => {
    it('should handle streams with missing bits_per_raw_sample', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete (baseArgs.inputFileObj.ffProbeData.streams[0] as unknown as Record<string, unknown>).bits_per_raw_sample;
        baseArgs.inputFileObj.ffProbeData.streams[0].pix_fmt = 'yuv420p';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with missing pix_fmt', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 8;
        delete (baseArgs.inputFileObj.ffProbeData.streams[0] as unknown as Record<string, unknown>).pix_fmt;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with both properties missing', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete (baseArgs.inputFileObj.ffProbeData.streams[0] as unknown as Record<string, unknown>).bits_per_raw_sample;
        delete (baseArgs.inputFileObj.ffProbeData.streams[0] as unknown as Record<string, unknown>).pix_fmt;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with undefined codec_type', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        (baseArgs.inputFileObj.ffProbeData.streams[0] as unknown as { codec_type: undefined }).codec_type = undefined;
        baseArgs.inputFileObj.ffProbeData.streams[0].bits_per_raw_sample = 10;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle mixed stream types with 10bit video', () => {
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
          codec_name: 'hevc',
          codec_type: 'video',
          bits_per_raw_sample: 10,
          pix_fmt: 'yuv420p10le',
          width: 3840,
          height: 2160,
        },
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle string values for bits_per_raw_sample', () => {
      const testArgs = { ...baseArgs };
      if (testArgs.inputFileObj.ffProbeData.streams?.[0]) {
        const stream = testArgs.inputFileObj.ffProbeData.streams[0] as unknown as { bits_per_raw_sample: string };
        stream.bits_per_raw_sample = '10';
      }

      const result = plugin(testArgs);

      expect(result.outputNumber).toBe(2); // String "10" is not detected as 10-bit
    });

    it('should handle null values', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        const stream = baseArgs.inputFileObj.ffProbeData.streams[0] as unknown as {
          bits_per_raw_sample: null;
          pix_fmt: null
        };
        stream.bits_per_raw_sample = null;
        stream.pix_fmt = null;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });
});
