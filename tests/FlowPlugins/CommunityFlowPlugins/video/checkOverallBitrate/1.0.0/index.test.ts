import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/checkOverallBitrate/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

describe('checkOverallBitrate Plugin', () => {
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
      // H264 sample has ~1591 kbps overall bitrate
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '1500';
      baseArgs.inputs.lessThan = '1700';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is 1591143 bps');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Checking if bitrate is within range 1500000 bps and 1700000 bps',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is within range');
    });

    it('should pass when bitrate is within range (bps)', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1500000';
      baseArgs.inputs.lessThan = '1700000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Checking if bitrate is within range 1500000 bps and 1700000 bps',
      );
    });

    it('should pass when bitrate is within range (mbps)', () => {
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '1';
      baseArgs.inputs.lessThan = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Checking if bitrate is within range 1000000 bps and 2000000 bps',
      );
    });

    it('should fail when bitrate is below range', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '2000';
      baseArgs.inputs.lessThan = '3000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is not within range');
    });

    it('should fail when bitrate is above range', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '500';
      baseArgs.inputs.lessThan = '1000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is not within range');
    });
  });

  describe('Different Video Files', () => {
    it('should work with H265 sample', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265));
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '3';
      baseArgs.inputs.lessThan = '4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is 3207441 bps');
    });
  });

  describe('Boundary Conditions', () => {
    it('should pass when bitrate equals lower bound', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1591143'; // Exact bitrate
      baseArgs.inputs.lessThan = '2000000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when bitrate equals upper bound', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1000000';
      baseArgs.inputs.lessThan = '1591143'; // Exact bitrate

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should pass when bitrate equals both bounds', () => {
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1591143'; // Exact bitrate
      baseArgs.inputs.lessThan = '1591143'; // Exact bitrate

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

  describe('Input Validation', () => {
    it('should handle string inputs for bounds', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '1500.5';
      baseArgs.inputs.lessThan = '1700.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle negative lower bound', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '-1000';
      baseArgs.inputs.lessThan = '2000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle very large bounds', () => {
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '1000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases with File Properties', () => {
    it('should handle missing bit_rate property', () => {
      (baseArgs.inputFileObj as {bit_rate?: number | undefined}).bit_rate = undefined;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is undefined bps');
    });

    it('should handle null bit_rate property', () => {
      (baseArgs.inputFileObj as {bit_rate?: number | null}).bit_rate = null;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is null bps');
    });

    it('should handle undefined bit_rate property', () => {
      (baseArgs.inputFileObj as {bit_rate?: number | undefined}).bit_rate = undefined;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is undefined bps');
    });

    it('should handle zero bit_rate', () => {
      baseArgs.inputFileObj.bit_rate = 0;
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '1000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File bitrate is 0 bps');
    });

    it('should handle string bit_rate value', () => {
      (baseArgs.inputFileObj as {bit_rate?: string | number}).bit_rate = '1591143';
      baseArgs.inputs.unit = 'bps';
      baseArgs.inputs.greaterThan = '1500000';
      baseArgs.inputs.lessThan = '1700000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle very high bit_rate', () => {
      baseArgs.inputFileObj.bit_rate = 100000000; // 100 Mbps
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '50';
      baseArgs.inputs.lessThan = '150';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Unit Conversion Edge Cases', () => {
    it('should handle decimal values in kbps conversion', () => {
      baseArgs.inputs.unit = 'kbps';
      baseArgs.inputs.greaterThan = '1591.143';
      baseArgs.inputs.lessThan = '1591.144';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle decimal values in mbps conversion', () => {
      baseArgs.inputs.unit = 'mbps';
      baseArgs.inputs.greaterThan = '1.591143';
      baseArgs.inputs.lessThan = '1.591144';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle unknown unit (defaults to bps)', () => {
      baseArgs.inputs.unit = 'gbps';
      baseArgs.inputs.greaterThan = '1500000';
      baseArgs.inputs.lessThan = '1700000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });
});
