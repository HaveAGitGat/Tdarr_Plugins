import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkStreamProperty/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject, Istreams } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264_1 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3_1 = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('checkStreamProperty Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        streamType: 'all',
        propertyToCheck: 'codec_name',
        valuesToMatch: 'aac',
        condition: 'includes',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264_1)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Property Matching', () => {
    it('should match codec_name with includes condition', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" includes "aac"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File routed to output 1 - has matching stream property');
    });

    it('should match video codec with includes condition', () => {
      baseArgs.inputs.valuesToMatch = 'h264';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 0: codec_name "h264" includes "h264"');
    });

    it('should not match when codec not present', () => {
      baseArgs.inputs.valuesToMatch = 'mp3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File routed to output 2 - does not have matching stream property');
    });

    it('should match multiple values with OR logic', () => {
      baseArgs.inputs.valuesToMatch = 'mp3,aac,ac3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" includes "aac"');
    });
  });

  describe('Stream Type Filtering', () => {
    it('should filter by video streams only', () => {
      baseArgs.inputs.streamType = 'video';
      baseArgs.inputs.valuesToMatch = 'h264';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 0: codec_name "h264" includes "h264"');
    });

    it('should filter by audio streams only', () => {
      baseArgs.inputs.streamType = 'audio';
      baseArgs.inputs.valuesToMatch = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" includes "aac"');
    });

    it('should fail when no matching stream type found', () => {
      baseArgs.inputs.streamType = 'subtitle';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No subtitle streams found in file');
    });

    it('should work with audio-only files', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3_1)) as IFileObject;
      baseArgs.inputs.streamType = 'audio';
      baseArgs.inputs.valuesToMatch = 'mp3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Different Conditions', () => {
    it('should work with equals condition', () => {
      baseArgs.inputs.condition = 'equals';
      baseArgs.inputs.valuesToMatch = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" equals "aac"');
    });

    it('should work with not_equals condition', () => {
      baseArgs.inputs.condition = 'not_equals';
      baseArgs.inputs.valuesToMatch = 'mp3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File routed to output 1 - has matching stream property');
    });

    it('should work with not_includes condition', () => {
      baseArgs.inputs.condition = 'not_includes';
      baseArgs.inputs.valuesToMatch = 'mp3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should fail with not_includes when value is present', () => {
      baseArgs.inputs.condition = 'not_includes';
      baseArgs.inputs.valuesToMatch = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" includes "aac" - condition fails');
    });
  });

  describe('Different Properties', () => {
    it('should check width property', () => {
      baseArgs.inputs.propertyToCheck = 'width';
      baseArgs.inputs.valuesToMatch = '1280';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 0: width "1280" equals "1280"');
    });

    it('should check height property', () => {
      baseArgs.inputs.propertyToCheck = 'height';
      baseArgs.inputs.valuesToMatch = '720';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should check audio channels', () => {
      baseArgs.inputs.propertyToCheck = 'channels';
      baseArgs.inputs.valuesToMatch = '6';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: channels "6" equals "6"');
    });

    it('should check codec_type property', () => {
      baseArgs.inputs.propertyToCheck = 'codec_type';
      baseArgs.inputs.valuesToMatch = 'video';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 0: codec_type "video" includes "video"');
    });

    it('should check nested properties (tags.language)', () => {
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToMatch = 'und';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Input Validation', () => {
    it('should handle comma-separated values with whitespace', () => {
      baseArgs.inputs.valuesToMatch = ' aac , mp3 , ac3 ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" includes "aac"');
    });

    it('should handle empty values after comma splitting', () => {
      baseArgs.inputs.valuesToMatch = ' , , ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Error: Values to match cannot be empty');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing streams array', () => {
      delete baseArgs.inputFileObj.ffProbeData.streams;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle missing ffProbeData', () => {
      (baseArgs.inputFileObj as Partial<IFileObject>).ffProbeData = undefined;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle null property values', () => {
      baseArgs.inputs.propertyToCheck = 'nonexistent_property';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle case insensitive matching', () => {
      baseArgs.inputs.valuesToMatch = 'AAC';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" includes "aac"');
    });

    it('should handle numeric properties as strings', () => {
      baseArgs.inputs.propertyToCheck = 'bit_rate';
      baseArgs.inputs.valuesToMatch = '384828';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple audio streams', () => {
      // Add a second audio stream
      const extraStream = {
        index: 2,
        codec_name: 'ac3',
        codec_type: 'audio',
        channels: 2,
        sample_rate: '48000',
      };

      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push(extraStream);
      }

      baseArgs.inputs.valuesToMatch = 'ac3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 2: codec_name "ac3" includes "ac3"');
    });

    it('should work with not_equals for all streams', () => {
      baseArgs.inputs.condition = 'not_equals';
      baseArgs.inputs.valuesToMatch = 'dts';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should fail not_equals when any stream matches', () => {
      baseArgs.inputs.condition = 'not_equals';
      baseArgs.inputs.valuesToMatch = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1: codec_name "aac" equals "aac" - condition fails');
    });

    it('should handle video-only files', () => {
      // Remove audio stream
      if (baseArgs.inputFileObj.ffProbeData?.streams) {
        baseArgs.inputFileObj.ffProbeData.streams = baseArgs.inputFileObj.ffProbeData.streams.filter(
          (stream: Istreams) => stream.codec_type === 'video',
        );
      }

      baseArgs.inputs.streamType = 'audio';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No audio streams found in file');
    });
  });
});
