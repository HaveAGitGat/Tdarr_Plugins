import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkVideoBitrate/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('checkVideoBitrate Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        unit: 'kbps',
        greaterThan: '1000',
        lessThan: '2000',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Bitrate Validation with Different Units', () => {
    it('should pass when bitrate is within range (kbps)', () => {
      // H264 sample has ~1206 kbps video bitrate
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '1000';
      baseArgs.inputs.lessThan = '1500';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found video bitrate: 1205959');
    });

    it('should pass when bitrate is within range (bps)', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1000000';
      baseArgs.inputs.lessThan = '1500000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when bitrate is within range (mbps)', () => {
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '1';
      baseArgs.inputs.lessThan = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should fail when bitrate is below range', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '2000';
      baseArgs.inputs.lessThan = '3000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should fail when bitrate is above range', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '500';
      baseArgs.inputs.lessThan = '800';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Different Video Files', () => {
    it('should work with H265 sample', () => {
      const testArgs = { ...baseArgs };
      testArgs.inputFileObj = sampleH265;
      testArgs.inputs.greaterThan = '1000';
      testArgs.inputs.lessThan = '5000';
      testArgs.inputs.unit = 'kbps';

      expect(() => plugin(testArgs)).toThrow('Video bitrate not found');
    });
  });

  describe('Edge Cases', () => {
    it('should throw error when no video bitrate found', () => {
      // Remove video track from mediaInfo
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const mediaInfo = baseArgs.inputFileObj.mediaInfo as Record<string, unknown>;
        mediaInfo.track = baseArgs.inputFileObj.mediaInfo.track.filter(
          (track) => track['@type'].toLowerCase() !== 'video',
        );
      }

      expect(() => plugin(baseArgs)).toThrow('Video bitrate not found');
    });

    it('should throw error when mediaInfo is missing', () => {
      delete baseArgs.inputFileObj.mediaInfo;

      expect(() => plugin(baseArgs)).toThrow('Video bitrate not found');
    });

    it('should throw error when mediaInfo.track is missing', () => {
      if (baseArgs.inputFileObj.mediaInfo) {
        delete baseArgs.inputFileObj.mediaInfo.track;
      }

      expect(() => plugin(baseArgs)).toThrow('Video bitrate not found');
    });

    it('should throw error when video track has no BitRate', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const videoTrack = baseArgs.inputFileObj.mediaInfo.track.find(
          (track) => track['@type'].toLowerCase() === 'video',
        );
        if (videoTrack) {
          delete (videoTrack as Record<string, unknown>).BitRate;
        }
      }

      expect(() => plugin(baseArgs)).toThrow('Video bitrate not found');
    });

    it('should handle multiple video tracks and use first one with bitrate', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        // Add another video track
        const tracks = baseArgs.inputFileObj.mediaInfo.track as Array<Record<string, unknown>>;
        tracks.push({
          '@type': 'Video',
          BitRate: 500000,
          StreamOrder: '1',
          Format: 'HEVC',
          UniqueID: '2',
        });
      }

      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '1000';
      baseArgs.inputs.lessThan = '1500';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle case-insensitive video track type', () => {
      if (baseArgs.inputFileObj.mediaInfo?.track) {
        const videoTrack = baseArgs.inputFileObj.mediaInfo.track.find(
          (track) => track['@type'].toLowerCase() === 'video',
        );
        if (videoTrack) {
          videoTrack['@type'] = 'VIDEO'; // Uppercase
        }
      }

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Boundary Conditions', () => {
    it('should pass when bitrate equals lower bound', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1205959'; // Exact bitrate
      baseArgs.inputs.lessThan = '2000000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when bitrate equals upper bound', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1000000';
      baseArgs.inputs.lessThan = '1205959'; // Exact bitrate

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
