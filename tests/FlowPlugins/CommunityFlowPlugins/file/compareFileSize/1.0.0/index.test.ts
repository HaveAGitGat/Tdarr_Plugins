import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/compareFileSize/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('compareFileSize Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('File Size Comparison', () => {
    it('should return output 1 when working file is smaller than original', () => {
      // Set working file to be smaller than original
      baseArgs.inputFileObj.file_size = 0.5;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 0.5 is smaller than original file of size 1',
      );
    });

    it('should return output 2 when working file is same size as original', () => {
      // Set both files to same size
      baseArgs.inputFileObj.file_size = 1.0;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 1 is same size as original file of size 1',
      );
    });

    it('should return output 3 when working file is larger than original', () => {
      // Set working file to be larger than original
      baseArgs.inputFileObj.file_size = 2.0;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 2 is larger than original file of size 1',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero file sizes', () => {
      baseArgs.inputFileObj.file_size = 0;
      baseArgs.originalLibraryFile.file_size = 0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 0 is same size as original file of size 0',
      );
    });

    it('should handle very small decimal differences', () => {
      baseArgs.inputFileObj.file_size = 1.0000001;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 1.0000001 is larger than original file of size 1',
      );
    });

    it('should handle very large file sizes', () => {
      baseArgs.inputFileObj.file_size = 999999999.99;
      baseArgs.originalLibraryFile.file_size = 1000000000.00;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 999999999.99 is smaller than original file of size 1000000000',
      );
    });

    it('should handle negative file sizes (edge case)', () => {
      baseArgs.inputFileObj.file_size = -1;
      baseArgs.originalLibraryFile.file_size = 1;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size -1 is smaller than original file of size 1',
      );
    });
  });

  describe('Realistic File Size Scenarios', () => {
    it('should handle typical compression scenario (reduced size)', () => {
      // Simulate a typical video compression scenario
      baseArgs.inputFileObj.file_size = 0.75; // 25% size reduction
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 0.75 is smaller than original file of size 1',
      );
    });

    it('should handle transcoding that increases file size', () => {
      // Simulate transcoding to higher quality
      baseArgs.inputFileObj.file_size = 1.5;
      baseArgs.originalLibraryFile.file_size = 1.0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Working of size 1.5 is larger than original file of size 1',
      );
    });

    it('should handle copy scenario (same size)', () => {
      // Simulate copying without transcoding
      const originalSize = 1.0075750350952148; // From sample data
      baseArgs.inputFileObj.file_size = originalSize;
      baseArgs.originalLibraryFile.file_size = originalSize;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Working of size ${originalSize} is same size as original file of size ${originalSize}`,
      );
    });
  });
});
