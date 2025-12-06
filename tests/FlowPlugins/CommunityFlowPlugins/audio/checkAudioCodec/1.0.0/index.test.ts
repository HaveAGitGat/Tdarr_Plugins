import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/audio/checkAudioCodec/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('checkAudioCodec Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        codec: 'aac',
        checkBitrate: 'false',
        greaterThan: '50000',
        lessThan: '1000000',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Codec Detection', () => {
    it('should detect matching codec (AAC)', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has codec: aac');
    });

    it('should detect matching codec (MP3)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.inputs.codec = 'mp3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has codec: mp3');
    });

    it('should reject non-matching codec', () => {
      baseArgs.inputs.codec = 'mp3'; // Looking for MP3 in AAC file

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File does not have codec: mp3 ');
    });

    it('should work with video files containing audio', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      baseArgs.inputs.codec = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has codec: aac');
    });

    it('should ignore video streams when checking audio codecs', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      baseArgs.inputs.codec = 'h264'; // Video codec, should not match for audio

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File does not have codec: h264 ');
    });
  });

  describe('Bitrate Validation', () => {
    it('should pass when bitrate is within range (MP3 128kbps)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.inputs.codec = 'mp3';
      baseArgs.inputs.checkBitrate = 'true';
      baseArgs.inputs.greaterThan = '100000';
      baseArgs.inputs.lessThan = '200000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File has codec: mp3 with bitrate 128000 between 100000 and 200000',
      );
    });

    it('should pass when bitrate is within range (AAC 384kbps)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      baseArgs.inputs.codec = 'aac';
      baseArgs.inputs.checkBitrate = 'true';
      baseArgs.inputs.greaterThan = '300000';
      baseArgs.inputs.lessThan = '400000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File has codec: aac with bitrate 384828 between 300000 and 400000',
      );
    });

    it('should fail when bitrate is outside range', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.inputs.codec = 'mp3';
      baseArgs.inputs.checkBitrate = 'true';
      baseArgs.inputs.greaterThan = '200000';
      baseArgs.inputs.lessThan = '300000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File does not have codec: mp3 with bitrate between 200000 and 300000',
      );
    });

    it('should fallback to mediaInfo when ffProbe bitrate is missing', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.inputs.codec = 'mp3';
      baseArgs.inputs.checkBitrate = 'true';
      baseArgs.inputs.greaterThan = '100000';
      baseArgs.inputs.lessThan = '200000';

      // Remove ffProbe bitrate but keep mediaInfo bitrate
      if (baseArgs.inputFileObj.ffProbeData.streams?.[0]) {
        delete baseArgs.inputFileObj.ffProbeData.streams[0].bit_rate;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'File has codec: mp3 with bitrate 128000 between 100000 and 200000',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no audio streams', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'hevc',
          codec_type: 'video',
          width: 1920,
          height: 1080,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File does not have codec: aac ');
    });

    it('should handle files with multiple audio streams', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      // Add AC3 stream to existing video + AAC
      if (baseArgs.inputFileObj.ffProbeData.streams) {
        baseArgs.inputFileObj.ffProbeData.streams.push({
          index: 2,
          codec_name: 'ac3',
          codec_type: 'audio',
          bit_rate: 192000,
          channels: 6,
          sample_rate: '48000',
        });
      }

      baseArgs.inputs.codec = 'ac3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has codec: ac3');
    });

    it('should handle missing streams array', () => {
      delete baseArgs.inputFileObj.ffProbeData.streams;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File does not have codec: aac ');
    });
  });

  describe('Multiple Codec Types', () => {
    it.each([
      'aac',
      'ac3',
      'eac3',
      'dts',
      'flac',
      'mp3',
      'opus',
    ])('should detect %s codec', (codec) => {
      // Use AAC sample as base and modify the audio stream codec
      baseArgs.inputs.codec = codec;
      if (baseArgs.inputFileObj.ffProbeData.streams?.[1]) {
        baseArgs.inputFileObj.ffProbeData.streams[1].codec_name = codec;
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`File has codec: ${codec}`);
    });
  });
});
