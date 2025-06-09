import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/compareFileSizeRatio/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('compareFileSizeRatio Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockOriginalFile: IFileObject;

  beforeEach(() => {
    // Create a mock original file with known size (100 MB)
    mockOriginalFile = {
      ...JSON.parse(JSON.stringify(sampleH264)),
      file_size: 100.0,
    } as IFileObject;

    baseArgs = {
      inputs: {
        greaterThan: '40',
        lessThan: '110',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: mockOriginalFile,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Set default working file size (50 MB = 50% of original)
    baseArgs.inputFileObj.file_size = 50.0;
  });

  describe('Basic Size Ratio Validation', () => {
    it('should pass when file size is within default range (50% of original)', () => {
      // Working file is 50MB, original is 100MB = 50%
      // Should pass as it's between 40% and 110%
      baseArgs.inputFileObj.file_size = 50.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 50.000 MB which is 50% of original file size:  100.000 MB',
      );
    });

    it('should pass when file size is at lower bound (40% of original)', () => {
      // Working file is 40MB, original is 100MB = 40%
      baseArgs.inputFileObj.file_size = 40.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 40.000 MB which is 40% of original file size:  100.000 MB',
      );
    });

    it('should pass when file size is at upper bound (110% of original)', () => {
      // Working file is 110MB, original is 100MB = 110%
      baseArgs.inputFileObj.file_size = 110.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('New file has size 110.000 MB which is 110'),
      );
    });

    it('should fail when file size is below lower bound (30% of original)', () => {
      // Working file is 30MB, original is 100MB = 30%
      baseArgs.inputFileObj.file_size = 30.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 30.000 MB '
        + 'which is 30% of original file size:  100.000 MB. lowerBound is 40%',
      );
    });

    it('should fail when file size is above upper bound (120% of original)', () => {
      // Working file is 120MB, original is 100MB = 120%
      baseArgs.inputFileObj.file_size = 120.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 120.000 MB '
        + 'which is 120% of original file size:  100.000 MB. upperBound is 110%',
      );
    });
  });

  describe('Custom Range Validation', () => {
    it('should respect custom lower bound (60%)', () => {
      baseArgs.inputs.greaterThan = '60';
      baseArgs.inputs.lessThan = '150';
      // Working file is 50MB, original is 100MB = 50%
      baseArgs.inputFileObj.file_size = 50.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 50.000 MB '
        + 'which is 50% of original file size:  100.000 MB. lowerBound is 60%',
      );
    });

    it('should respect custom upper bound (80%)', () => {
      baseArgs.inputs.greaterThan = '20';
      baseArgs.inputs.lessThan = '80';
      // Working file is 90MB, original is 100MB = 90%
      baseArgs.inputFileObj.file_size = 90.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 90.000 MB '
        + 'which is 90% of original file size:  100.000 MB. upperBound is 80%',
      );
    });

    it('should pass with custom tight range (50-60%)', () => {
      baseArgs.inputs.greaterThan = '50';
      baseArgs.inputs.lessThan = '60';
      // Working file is 55MB, original is 100MB = 55%
      baseArgs.inputFileObj.file_size = 55.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('New file has size 55.000 MB which is 55'),
      );
    });

    it('should handle very permissive range (1-200%)', () => {
      baseArgs.inputs.greaterThan = '1';
      baseArgs.inputs.lessThan = '200';
      // Working file is 150MB, original is 100MB = 150%
      baseArgs.inputFileObj.file_size = 150.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 150.000 MB which is 150% of original file size:  100.000 MB',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small original file size', () => {
      baseArgs.originalLibraryFile.file_size = 0.001; // 1KB
      baseArgs.inputFileObj.file_size = 0.0005; // 0.5KB = 50%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 0.001 MB which is 50% of original file size:  0.001 MB',
      );
    });

    it('should handle very large file sizes', () => {
      baseArgs.originalLibraryFile.file_size = 10000.0; // 10GB
      baseArgs.inputFileObj.file_size = 5000.0; // 5GB = 50%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 5000.000 MB which is 50% of original file size:  10000.000 MB',
      );
    });

    it('should handle identical file sizes (100%)', () => {
      baseArgs.originalLibraryFile.file_size = 75.5;
      baseArgs.inputFileObj.file_size = 75.5;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 75.500 MB which is 100% of original file size:  75.500 MB',
      );
    });

    it('should handle zero-sized working file', () => {
      baseArgs.inputFileObj.file_size = 0.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file size not within limits. New file has size 0.000 MB '
        + 'which is 0% of original file size:  100.000 MB. lowerBound is 40%',
      );
    });

    it('should handle different media types (MP3)', () => {
      const mockOriginalMP3 = {
        ...JSON.parse(JSON.stringify(sampleMP3)),
        file_size: 5.0, // 5MB
      } as IFileObject;

      baseArgs.originalLibraryFile = mockOriginalMP3;
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.inputFileObj.file_size = 2.5; // 2.5MB = 50%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 2.500 MB which is 50% of original file size:  5.000 MB',
      );
    });
  });

  describe('Precision and Rounding', () => {
    it('should handle decimal percentages correctly', () => {
      baseArgs.originalLibraryFile.file_size = 33.333;
      baseArgs.inputFileObj.file_size = 16.6665; // ~50.0005%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('New file has size 16.666 MB which is 50% of original file size:  33.333 MB'),
      );
    });

    it('should handle boundary conditions with floating point precision', () => {
      baseArgs.inputs.greaterThan = '50';
      baseArgs.originalLibraryFile.file_size = 3.0;
      baseArgs.inputFileObj.file_size = 1.5; // Exactly 50%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 1.500 MB which is 50% of original file size:  3.000 MB',
      );
    });
  });

  describe('String Input Handling', () => {
    it('should handle string inputs for bounds', () => {
      baseArgs.inputs.greaterThan = '25';
      baseArgs.inputs.lessThan = '75';
      baseArgs.inputFileObj.file_size = 50.0; // 50%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 50.000 MB which is 50% of original file size:  100.000 MB',
      );
    });

    it('should handle decimal string inputs', () => {
      baseArgs.inputs.greaterThan = '33.5';
      baseArgs.inputs.lessThan = '66.5';
      baseArgs.inputFileObj.file_size = 50.0; // 50%

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has size 50.000 MB which is 50% of original file size:  100.000 MB',
      );
    });
  });
});
