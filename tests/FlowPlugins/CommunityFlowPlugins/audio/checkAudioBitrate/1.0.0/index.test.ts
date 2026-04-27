import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/audio/checkAudioBitrate/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('checkAudioBitrate Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        unit: 'kbps',
        greaterThan: '100',
        lessThan: '500',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Bitrate Validation with Different Units', () => {
    it('should pass when bitrate is within range (kbps)', () => {
      // H264 sample has 384 kbps audio bitrate (384000 bps)
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '300';
      baseArgs.inputs.lessThan = '500';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found audio bitrate: 384000');
    });

    it('should pass when bitrate is within range (bps)', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '300000';
      baseArgs.inputs.lessThan = '500000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when bitrate is within range (mbps)', () => {
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '1';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should fail when bitrate is below range', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '500';
      baseArgs.inputs.lessThan = '1000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should fail when bitrate is above range', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '100';
      baseArgs.inputs.lessThan = '200';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Different Audio Files', () => {
    it('should work with MP3 sample', () => {
      // MP3 sample has 128 kbps audio bitrate (128000 bps)
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3));
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '100';
      baseArgs.inputs.lessThan = '200';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found audio bitrate: 128000');
    });

    it('should throw when audio file has no BitRate field', () => {
      // sampleAAC_1 has an audio track but no BitRate
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleAAC));

      expect(() => plugin(baseArgs)).toThrow('Audio bitrate not found');
    });
  });

  describe('Edge Cases', () => {
    it('should throw error when no audio track found', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const mediaInfo = baseArgs.inputFileObj.mediaInfo as Record<string, unknown>;
        mediaInfo.track = baseArgs.inputFileObj.mediaInfo.track.filter(
          (track) => track['@type'].toLowerCase() !== 'audio',
        );
      }

      expect(() => plugin(baseArgs)).toThrow('Audio bitrate not found');
    });

    it('should throw error when mediaInfo is missing', () => {
      delete baseArgs.inputFileObj.mediaInfo;

      expect(() => plugin(baseArgs)).toThrow('Audio bitrate not found');
    });

    it('should throw error when mediaInfo.track is missing', () => {
      if (baseArgs.inputFileObj.mediaInfo) {
        delete baseArgs.inputFileObj.mediaInfo.track;
      }

      expect(() => plugin(baseArgs)).toThrow('Audio bitrate not found');
    });

    it('should throw error when audio track has no BitRate', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const audioTrack = baseArgs.inputFileObj.mediaInfo.track.find(
          (track) => track['@type'].toLowerCase() === 'audio',
        );
        if (audioTrack) {
          delete (audioTrack as Record<string, unknown>).BitRate;
        }
      }

      expect(() => plugin(baseArgs)).toThrow('Audio bitrate not found');
    });

    it('should handle multiple audio tracks and use first one with bitrate', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const tracks = baseArgs.inputFileObj.mediaInfo.track as Array<Record<string, unknown>>;
        tracks.push({
          '@type': 'Audio',
          BitRate: 128000,
          StreamOrder: '2',
          Format: 'MP3',
          UniqueID: '3',
        });
      }

      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '300';
      baseArgs.inputs.lessThan = '500';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle case-insensitive audio track type', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const audioTrack = baseArgs.inputFileObj.mediaInfo.track.find(
          (track) => track['@type'].toLowerCase() === 'audio',
        );
        if (audioTrack) {
          audioTrack['@type'] = 'AUDIO';
        }
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Boundary Conditions', () => {
    it('should pass when bitrate equals lower bound', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '384000';
      baseArgs.inputs.lessThan = '500000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when bitrate equals upper bound', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '300000';
      baseArgs.inputs.lessThan = '384000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle zero bounds', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '10000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });
});
