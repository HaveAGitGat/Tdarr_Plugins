import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkVideoResolution/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('checkVideoResolution Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Standard Resolution Detection', () => {
    it('should detect 720p resolution', () => {
      // H264 sample is 720p
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should detect 1080p resolution', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265)) as IFileObject;
      // H265 sample is 1080p
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(4);
    });

    it('should detect 480p resolution', () => {
      baseArgs.inputFileObj.video_resolution = '480p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should detect 576p resolution', () => {
      baseArgs.inputFileObj.video_resolution = '576p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should detect 1440p resolution', () => {
      baseArgs.inputFileObj.video_resolution = '1440p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(5);
    });

    it('should detect 4KUHD resolution', () => {
      baseArgs.inputFileObj.video_resolution = '4KUHD';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(6);
    });

    it('should detect DCI4K resolution', () => {
      baseArgs.inputFileObj.video_resolution = 'DCI4K';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(7);
    });

    it('should detect 8KUHD resolution', () => {
      baseArgs.inputFileObj.video_resolution = '8KUHD';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(8);
    });
  });

  describe('Unknown Resolution Handling', () => {
    it('should return Other for unknown resolution', () => {
      baseArgs.inputFileObj.video_resolution = '360p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should return Other for custom resolution', () => {
      baseArgs.inputFileObj.video_resolution = '2160p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should return Other for missing resolution', () => {
      (baseArgs.inputFileObj as Record<string, unknown>).video_resolution = undefined;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should return Other for null resolution', () => {
      (baseArgs.inputFileObj as Record<string, unknown>).video_resolution = null;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should return Other for undefined resolution', () => {
      (baseArgs.inputFileObj as Record<string, unknown>).video_resolution = undefined;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should return Other for empty string resolution', () => {
      baseArgs.inputFileObj.video_resolution = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle exact case matching for 720p', () => {
      baseArgs.inputFileObj.video_resolution = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
    });

    it('should not match different case for 720P', () => {
      baseArgs.inputFileObj.video_resolution = '720P';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should not match different case for 1080P', () => {
      baseArgs.inputFileObj.video_resolution = '1080P';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });
  });

  describe('All Resolution Types', () => {
    const resolutionTests = [
      { resolution: '480p', expectedOutput: 1 },
      { resolution: '576p', expectedOutput: 2 },
      { resolution: '720p', expectedOutput: 3 },
      { resolution: '1080p', expectedOutput: 4 },
      { resolution: '1440p', expectedOutput: 5 },
      { resolution: '4KUHD', expectedOutput: 6 },
      { resolution: 'DCI4K', expectedOutput: 7 },
      { resolution: '8KUHD', expectedOutput: 8 },
    ];

    it.each(resolutionTests)(
      'should return output $expectedOutput for resolution $resolution',
      ({ resolution, expectedOutput }) => {
        baseArgs.inputFileObj.video_resolution = resolution;

        const result = plugin(baseArgs);

        expect(result.outputNumber).toBe(expectedOutput);
      },
    );
  });

  describe('Edge Cases with Different Data Types', () => {
    it('should handle numeric resolution values', () => {
      (baseArgs.inputFileObj as Record<string, unknown>).video_resolution = 720;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should handle boolean resolution values', () => {
      (baseArgs.inputFileObj as Record<string, unknown>).video_resolution = true;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });

    it('should handle object resolution values', () => {
      (baseArgs.inputFileObj as Record<string, unknown>).video_resolution = { width: 1280, height: 720 };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(9);
    });
  });
});
