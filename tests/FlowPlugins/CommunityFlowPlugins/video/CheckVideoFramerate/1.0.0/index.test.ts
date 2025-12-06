import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/CheckVideoFramerate/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('CheckVideoFramerate Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        greaterThan: '20',
        lessThan: '30',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Framerate Validation', () => {
    it('should pass when framerate is within range (25fps)', () => {
      // H264 sample has 25fps
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 25 is within range of 20 and 30',
      );
    });

    it('should pass when framerate is within range (H265 sample)', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265));
      // H265 sample also has 25fps
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 25 is within range of 20 and 30',
      );
    });

    it('should fail when framerate is below range', () => {
      baseArgs.inputs.greaterThan = '30';
      baseArgs.inputs.lessThan = '60';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 25 is not within range of 30 and 60',
      );
    });

    it('should fail when framerate is above range', () => {
      baseArgs.inputs.greaterThan = '10';
      baseArgs.inputs.lessThan = '20';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 25 is not within range of 10 and 20',
      );
    });
  });

  describe('Boundary Conditions', () => {
    it('should pass when framerate equals lower bound', () => {
      baseArgs.inputs.greaterThan = '25';
      baseArgs.inputs.lessThan = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when framerate equals upper bound', () => {
      baseArgs.inputs.greaterThan = '20';
      baseArgs.inputs.lessThan = '25';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when framerate equals both bounds', () => {
      baseArgs.inputs.greaterThan = '25';
      baseArgs.inputs.lessThan = '25';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Different Framerate Values', () => {
    it('should handle high framerate (60fps)', () => {
      if (baseArgs.inputFileObj.meta) {
        baseArgs.inputFileObj.meta.VideoFrameRate = 60;
      }
      baseArgs.inputs.greaterThan = '50';
      baseArgs.inputs.lessThan = '70';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 60 is within range of 50 and 70',
      );
    });

    it('should handle low framerate (15fps)', () => {
      if (baseArgs.inputFileObj.meta) {
        baseArgs.inputFileObj.meta.VideoFrameRate = 15;
      }
      baseArgs.inputs.greaterThan = '10';
      baseArgs.inputs.lessThan = '20';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 15 is within range of 10 and 20',
      );
    });

    it('should handle decimal framerate (23.976fps)', () => {
      if (baseArgs.inputFileObj.meta) {
        baseArgs.inputFileObj.meta.VideoFrameRate = 23.976;
      }
      baseArgs.inputs.greaterThan = '23';
      baseArgs.inputs.lessThan = '24';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of 23.976 is within range of 23 and 24',
      );
    });

    it('should handle zero framerate', () => {
      const testArgs = { ...baseArgs };
      testArgs.inputFileObj.meta = { VideoFrameRate: 0 };

      expect(() => plugin(testArgs)).toThrow('Video framerate not found');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when VideoFrameRate is missing', () => {
      if (baseArgs.inputFileObj.meta) {
        const meta = baseArgs.inputFileObj.meta as Partial<typeof baseArgs.inputFileObj.meta>;
        delete meta.VideoFrameRate;
      }

      expect(() => plugin(baseArgs)).toThrow('Video framerate not found');
    });

    it('should throw error when meta is missing', () => {
      (baseArgs.inputFileObj as Partial<IFileObject>).meta = undefined;

      expect(() => plugin(baseArgs)).toThrow('Video framerate not found');
    });

    it('should throw error when VideoFrameRate is null', () => {
      if (baseArgs.inputFileObj.meta) {
        const meta = baseArgs.inputFileObj.meta as Partial<typeof baseArgs.inputFileObj.meta>;
        meta.VideoFrameRate = null as unknown as number;
      }

      expect(() => plugin(baseArgs)).toThrow('Video framerate not found');
    });

    it('should throw error when VideoFrameRate is undefined', () => {
      if (baseArgs.inputFileObj.meta) {
        const meta = baseArgs.inputFileObj.meta as Partial<typeof baseArgs.inputFileObj.meta>;
        meta.VideoFrameRate = undefined;
      }

      expect(() => plugin(baseArgs)).toThrow('Video framerate not found');
    });
  });

  describe('Input Validation', () => {
    it('should handle string inputs for bounds', () => {
      baseArgs.inputs.greaterThan = '20.5';
      baseArgs.inputs.lessThan = '30.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle zero bounds', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '100';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle negative lower bound', () => {
      baseArgs.inputs.greaterThan = '-10';
      baseArgs.inputs.lessThan = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle very large bounds', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '1000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases with Invalid Data', () => {
    it('should handle negative framerate', () => {
      if (baseArgs.inputFileObj.meta) {
        baseArgs.inputFileObj.meta.VideoFrameRate = -5;
      }
      baseArgs.inputs.greaterThan = '-10';
      baseArgs.inputs.lessThan = '0';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Video framerate of -5 is within range of -10 and 0',
      );
    });

    it('should handle very high framerate', () => {
      if (baseArgs.inputFileObj.meta) {
        baseArgs.inputFileObj.meta.VideoFrameRate = 240;
      }
      baseArgs.inputs.greaterThan = '200';
      baseArgs.inputs.lessThan = '300';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle string framerate value', () => {
      if (baseArgs.inputFileObj.meta) {
        const meta = baseArgs.inputFileObj.meta as Partial<typeof baseArgs.inputFileObj.meta>;
        meta.VideoFrameRate = '25' as unknown as number;
      }
      baseArgs.inputs.greaterThan = '20';
      baseArgs.inputs.lessThan = '30';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });
});
