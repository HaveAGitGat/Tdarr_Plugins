import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/setOriginalFile/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('setOriginalFile Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleMP3)), // Current working file
      originalLibraryFile: JSON.parse(JSON.stringify(sampleAAC)), // Original file
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Set distinct IDs to simulate flow processing scenario
    baseArgs.inputFileObj._id = '/working/converted_file.mp4'; // Current working file after processing
    baseArgs.originalLibraryFile._id = '/original/source_file.mkv'; // Original source file
  });

  describe('Flow Reset Functionality', () => {
    it('should reset working file to original file', () => {
      const result = plugin(baseArgs);

      // The output should be the original file, not the current working file
      expect(result.outputFileObj._id).toBe('/original/source_file.mkv');
      expect(result.outputFileObj._id).not.toBe('/working/converted_file.mp4');
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should work in a typical flow scenario where working file has changed', () => {
      // Simulate a flow where the working file has been processed and changed
      baseArgs.inputFileObj._id = '/tmp/transcoded_h264.mp4';
      baseArgs.inputFileObj.container = 'mp4';
      baseArgs.originalLibraryFile._id = '/library/movie.mkv';
      baseArgs.originalLibraryFile.container = 'mkv';

      const result = plugin(baseArgs);

      // Should reset back to the original library file
      expect(result.outputFileObj._id).toBe('/library/movie.mkv');
      expect(result.outputNumber).toBe(1);
    });

    it('should preserve variables through the reset', () => {
      baseArgs.variables.user = { customProperty: 'testValue' };

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/original/source_file.mkv');
      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.user.customProperty).toBe('testValue');
    });
  });

  describe('Edge Cases', () => {
    it('should handle when original and working files are the same', () => {
      const sameFileId = '/library/unchanged_file.mp4';
      baseArgs.inputFileObj._id = sameFileId;
      baseArgs.originalLibraryFile._id = sameFileId;

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe(sameFileId);
      expect(result.outputNumber).toBe(1);
    });

    it('should handle missing originalLibraryFile _id', () => {
      baseArgs.originalLibraryFile._id = undefined as unknown as string;

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBeUndefined();
      expect(result.outputNumber).toBe(1);
    });

    it('should handle empty originalLibraryFile object', () => {
      baseArgs.originalLibraryFile = {} as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBeUndefined();
      expect(result.outputNumber).toBe(1);
    });

    it('should not modify input objects during processing', () => {
      const originalFileObjCopy = JSON.parse(JSON.stringify(baseArgs.originalLibraryFile));
      const inputFileObjCopy = JSON.parse(JSON.stringify(baseArgs.inputFileObj));

      plugin(baseArgs);

      expect(baseArgs.originalLibraryFile).toEqual(originalFileObjCopy);
      expect(baseArgs.inputFileObj).toEqual(inputFileObjCopy);
    });
  });

  describe('Flow Integration', () => {
    it('should work as a reset point in a complex flow', () => {
      // Simulate a flow where multiple transformations have occurred
      baseArgs.inputFileObj._id = '/temp/processed_multiple_times.mp4';
      baseArgs.inputFileObj.container = 'mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';

      baseArgs.originalLibraryFile._id = '/media/original_movie.mkv';
      baseArgs.originalLibraryFile.container = 'mkv';
      baseArgs.originalLibraryFile.video_codec_name = 'hevc';

      const result = plugin(baseArgs);

      // Should completely reset to original file
      expect(result.outputFileObj._id).toBe('/media/original_movie.mkv');
      expect(result.outputFileObj._id).not.toBe('/temp/processed_multiple_times.mp4');
      expect(result.outputNumber).toBe(1);
    });

    it('should always return output number 1 (continue flow)', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });
});
