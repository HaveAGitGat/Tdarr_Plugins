import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/compareFileSizeRatio/2.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('compareFileSizeRatio Plugin v2.0.0', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        greaterThan: '40',
        lessThan: '110',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Size Ratio Within Range', () => {
    it('should return output 1 when file size ratio is within bounds (50% compression)', () => {
      // Set working file to 50% of original size (within default 40-110% range)
      baseArgs.inputFileObj.file_size = 0.5;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 0.500 MB which is 50% of original file size:  1.000 MB',
      );
    });

    it('should return output 1 when file size is exactly at lower bound', () => {
      // Set working file to exactly 40% of original size
      baseArgs.inputFileObj.file_size = 0.4;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 0.400 MB which is 40% of original file size:  1.000 MB',
      );
    });

    it('should return output 1 when file size is exactly at upper bound', () => {
      // Set working file to exactly 110% of original size
      baseArgs.inputFileObj.file_size = 1.1;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1.100 MB which is 110.00000000000001% of original file size:  1.000 MB',
      );
    });

    it('should return output 1 with same size files (100% ratio)', () => {
      // Both files have the same size
      baseArgs.inputFileObj.file_size = 1.0;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1.000 MB which is 100% of original file size:  1.000 MB',
      );
    });
  });

  describe('Size Ratio Below Lower Bound', () => {
    it('should return output 2 when file size is smaller than lower bound', () => {
      // Set working file to 30% of original size (below default 40% lower bound)
      baseArgs.inputFileObj.file_size = 0.3;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.300 MB which is 30% '
        + 'of original file size:  1.000 MB. lowerBound is 40%',
      );
    });

    it('should return output 2 when file size is significantly smaller', () => {
      // Set working file to 10% of original size
      baseArgs.inputFileObj.file_size = 0.1;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.100 MB which is 10% '
        + 'of original file size:  1.000 MB. lowerBound is 40%',
      );
    });

    it('should return output 2 with custom lower bound', () => {
      // Set custom bounds: 60-120%
      baseArgs.inputs.greaterThan = '60';
      baseArgs.inputs.lessThan = '120';
      baseArgs.inputFileObj.file_size = 0.5; // 50% of original
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.500 MB which is 50% '
        + 'of original file size:  1.000 MB. lowerBound is 60%',
      );
    });
  });

  describe('Size Ratio Above Upper Bound', () => {
    it('should return output 3 when file size is larger than upper bound', () => {
      // Set working file to 150% of original size (above default 110% upper bound)
      baseArgs.inputFileObj.file_size = 1.5;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 1.500 MB which is 150% '
        + 'of original file size:  1.000 MB. upperBound is 110%',
      );
    });

    it('should return output 3 when file size is significantly larger', () => {
      // Set working file to 200% of original size
      baseArgs.inputFileObj.file_size = 2.0;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 2.000 MB which is 200% '
        + 'of original file size:  1.000 MB. upperBound is 110%',
      );
    });

    it('should return output 3 with custom upper bound', () => {
      // Set custom bounds: 30-90%
      baseArgs.inputs.greaterThan = '30';
      baseArgs.inputs.lessThan = '90';
      baseArgs.inputFileObj.file_size = 1.0; // 100% of original
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 1.000 MB which is 100% '
        + 'of original file size:  1.000 MB. upperBound is 90%',
      );
    });
  });

  describe('Custom Bounds Configuration', () => {
    it('should work with very tight bounds (95-105%)', () => {
      baseArgs.inputs.greaterThan = '95';
      baseArgs.inputs.lessThan = '105';
      baseArgs.inputFileObj.file_size = 1.0; // 100% of original
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1.000 MB which is 100% of original file size:  1.000 MB',
      );
    });

    it('should work with very loose bounds (10-500%)', () => {
      baseArgs.inputs.greaterThan = '10';
      baseArgs.inputs.lessThan = '500';
      baseArgs.inputFileObj.file_size = 2.0; // 200% of original
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 2.000 MB which is 200% of original file size:  1.000 MB',
      );
    });

    it('should work with zero as lower bound', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '100';
      baseArgs.inputFileObj.file_size = 0.5; // 50% of original
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 0.500 MB which is 50% of original file size:  1.000 MB',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero original file size gracefully', () => {
      baseArgs.inputFileObj.file_size = 1.0;
      baseArgs.originalLibraryFile.file_size = 0;

      const result = plugin(baseArgs);

      // When dividing by zero, result should be Infinity%
      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 1.000 MB which is Infinity% '
        + 'of original file size:  0.000 MB. upperBound is 110%',
      );
    });

    it('should handle zero working file size', () => {
      baseArgs.inputFileObj.file_size = 0;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.000 MB which is 0% '
        + 'of original file size:  1.000 MB. lowerBound is 40%',
      );
    });

    it('should handle both files being zero size', () => {
      baseArgs.inputFileObj.file_size = 0;
      baseArgs.originalLibraryFile.file_size = 0;

      const result = plugin(baseArgs);

      // 0/0 results in NaN, but NaN comparisons are false, so it defaults to output 1
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 0.000 MB which is NaN% of original file size:  0.000 MB',
      );
    });

    it('should handle negative file sizes', () => {
      baseArgs.inputFileObj.file_size = -0.5;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size -0.500 MB which is -50% '
        + 'of original file size:  1.000 MB. lowerBound is 40%',
      );
    });

    it('should handle very large file sizes', () => {
      baseArgs.inputFileObj.file_size = 1000000000.5;
      baseArgs.originalLibraryFile.file_size = 1000000000.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1000000000.500 MB which is 100.00000005000001% '
        + 'of original file size:  1000000000.000 MB',
      );
    });
  });

  describe('Realistic Scenarios', () => {
    it('should handle typical video compression (60% of original)', () => {
      // Simulate typical H.264 to H.265 compression
      baseArgs.inputFileObj.file_size = 1.2;
      baseArgs.originalLibraryFile.file_size = 2.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1.200 MB which is 60% of original file size:  2.000 MB',
      );
    });

    it('should handle over-compression scenario (20% of original)', () => {
      // Overly aggressive compression that might indicate quality loss
      baseArgs.inputFileObj.file_size = 0.2;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.200 MB which is 20% '
        + 'of original file size:  1.000 MB. lowerBound is 40%',
      );
    });

    it('should handle upscaling scenario (130% of original)', () => {
      // Upscaling or higher quality encoding
      baseArgs.inputFileObj.file_size = 1.3;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 1.300 MB which is 130% '
        + 'of original file size:  1.000 MB. upperBound is 110%',
      );
    });

    it('should handle lossless transcoding (105% of original)', () => {
      // Slight increase due to container change or metadata
      baseArgs.inputFileObj.file_size = 1.05;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1.050 MB which is 105% of original file size:  1.000 MB',
      );
    });
  });

  describe('Boundary Testing', () => {
    it('should handle decimal precision at lower boundary', () => {
      baseArgs.inputFileObj.file_size = 0.39999; // Just below 40%
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.400 MB which is 39.999% '
        + 'of original file size:  1.000 MB. lowerBound is 40%',
      );
    });

    it('should handle decimal precision at upper boundary', () => {
      baseArgs.inputFileObj.file_size = 1.10001; // Just above 110%
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 1.100 MB which is 110.00099999999999% '
        + 'of original file size:  1.000 MB. upperBound is 110%',
      );
    });
  });
});
