/* eslint-disable @typescript-eslint/no-explicit-any */
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkHdr/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('checkHdr Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Non-HDR Detection', () => {
    it('should detect non-HDR content (H264 sample)', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should detect non-HDR content (H265 sample)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('HDR Detection via Color Properties', () => {
    it('should detect HDR with smpte2084 transfer and bt2020 primaries', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].color_transfer = 'smpte2084';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_primaries = 'bt2020';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_range = 'tv';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not detect HDR with only smpte2084 transfer', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].color_transfer = 'smpte2084';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_primaries = 'bt709';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_range = 'tv';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should not detect HDR with only bt2020 primaries', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].color_transfer = 'bt709';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_primaries = 'bt2020';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_range = 'tv';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should not detect HDR without tv color range', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].color_transfer = 'smpte2084';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_primaries = 'bt2020';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_range = 'pc';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('HDR Detection via Codec Tags', () => {
    it('should detect HDR with dvhe codec tag', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string = 'dvhe';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect HDR with dvav codec tag', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string = 'dvav';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect HDR with dav1 codec tag', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string = 'dav1';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect HDR with dvh11 codec tag', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string = 'dvh11';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect HDR with partial codec tag match (contains dvhe)', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string = 'some_dvhe_tag';
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Multiple Video Streams', () => {
    it('should detect HDR if any video stream is HDR', () => {
      // First stream is non-HDR
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].color_transfer = 'bt709';
        baseArgs.inputFileObj.ffProbeData.streams[0].color_primaries = 'bt709';
      }

      // Add second HDR video stream
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push({
          index: 2,
          codec_name: 'hevc',
          codec_type: 'video',
          color_transfer: 'smpte2084',
          color_primaries: 'bt2020',
          color_range: 'tv',
          width: 3840,
          height: 2160,
        });
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should ignore audio streams when checking for HDR', () => {
      // Add audio stream with HDR-like properties (should be ignored)
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push({
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          codec_tag_string: 'dvhe', // This should be ignored
          sample_rate: '48000',
          channels: 2,
        });
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2); // Should still be non-HDR
    });
  });

  describe('Error Cases', () => {
    it('should throw error when ffProbeData is missing', () => {
      // @ts-expect-error - Testing error condition
      baseArgs.inputFileObj.ffProbeData = undefined;

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is missing', () => {
      baseArgs.inputFileObj.ffProbeData.streams = undefined;

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is null', () => {
      // @ts-expect-error - Testing error condition
      baseArgs.inputFileObj.ffProbeData.streams = null;

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is not an array', () => {
      // @ts-expect-error - Testing error condition
      baseArgs.inputFileObj.ffProbeData.streams = 'not an array';

      expect(() => plugin(baseArgs)).toThrow('File has not stream data');
    });

    it('should throw error when ffProbeData.streams is empty array', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);
      expect(result.outputNumber).toBe(2); // Non-HDR
    });
  });

  describe('Edge Cases', () => {
    it('should handle streams with missing color properties', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete baseArgs.inputFileObj.ffProbeData.streams[0].color_transfer;
        delete baseArgs.inputFileObj.ffProbeData.streams[0].color_primaries;
        delete baseArgs.inputFileObj.ffProbeData.streams[0].color_range;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with missing codec_tag_string', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with undefined codec_type', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        // @ts-expect-error - Testing edge case
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_type = undefined;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle mixed stream types with HDR video', () => {
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
          color_transfer: 'smpte2084',
          color_primaries: 'bt2020',
          color_range: 'tv',
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

    it('should handle case sensitivity in codec_tag_string', () => {
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        baseArgs.inputFileObj.ffProbeData.streams[0].codec_tag_string = 'DVHE'; // Uppercase
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2); // Should not match uppercase
    });
  });
});
