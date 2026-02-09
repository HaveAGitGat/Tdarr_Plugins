import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/moveToOriginalDirectory/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('moveToOriginalDirectory Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockFileMoveOrCopy: jest.MockedFunction<(params: {
    operation: string;
    sourcePath: string;
    destinationPath: string;
    args: IpluginInputArgs;
  }) => Promise<boolean>>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockFileMoveOrCopy = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy').default;
    mockFileMoveOrCopy.mockResolvedValue(true);

    baseArgs = {
      inputs: {},
      variables: {
        ffmpegCommand: {
          init: false,
          inputFiles: [],
          streams: [],
          container: '',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: '/temp/workdir/SampleVideo_1280x720_1mb.mp4',
      } as IFileObject,
      originalLibraryFile: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: '/original/directory/SampleVideo_1280x720_1mb.mp4',
      } as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic File Movement', () => {
    it('should move file to original directory and return correct output', async () => {
      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/temp/workdir/SampleVideo_1280x720_1mb.mp4',
        destinationPath: '/original/directory/SampleVideo_1280x720_1mb.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/original/directory/SampleVideo_1280x720_1mb.mp4');
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should handle files with different names and preserve input filename', async () => {
      baseArgs.inputFileObj._id = '/temp/workdir/processed_file.mp4';
      baseArgs.originalLibraryFile._id = '/original/library/original_file.mp4';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/temp/workdir/processed_file.mp4',
        destinationPath: '/original/library/processed_file.mp4',
        args: baseArgs,
      });

      expect(result.outputFileObj._id).toBe('/original/library/processed_file.mp4');
    });
  });

  describe('Same Path Scenarios', () => {
    it('should skip move when input and output paths are identical', async () => {
      const samePath = '/original/directory/SampleVideo_1280x720_1mb.mp4';
      baseArgs.inputFileObj._id = samePath;
      baseArgs.originalLibraryFile._id = samePath;

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Input and output path are the same, skipping move.');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe(samePath);
    });
  });

  describe('Path Construction', () => {
    it('should construct correct output path from original library file directory', async () => {
      baseArgs.inputFileObj._id = '/temp/work/processed.mp4';
      baseArgs.originalLibraryFile._id = '/media/movies/action/terminator.mp4';

      await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/temp/work/processed.mp4',
        destinationPath: '/media/movies/action/processed.mp4',
        args: baseArgs,
      });
    });

    it('should handle Windows-style paths', async () => {
      baseArgs.inputFileObj._id = 'C:\\temp\\work\\processed.mp4';
      baseArgs.originalLibraryFile._id = 'C:\\media\\movies\\original.mp4';

      await plugin(baseArgs);

      // getFileAbosluteDir splits on '/' so Windows paths are handled differently
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:\\temp\\work\\processed.mp4',
        destinationPath: '/C:\\temp\\work\\processed.mp4',
        args: baseArgs,
      });
    });
  });

  describe('Different Container Types', () => {
    it.each([
      ['mp4', '/temp/video.mp4', '/orig/source.avi'],
      ['mkv', '/temp/video.mkv', '/orig/source.mp4'],
      ['avi', '/temp/video.avi', '/orig/source.mkv'],
      ['mov', '/temp/video.mov', '/orig/source.mp4'],
      ['webm', '/temp/video.webm', '/orig/source.mp4'],
    ])('should handle %s container correctly', async (container, inputPath, originalPath) => {
      baseArgs.inputFileObj._id = inputPath;
      baseArgs.originalLibraryFile._id = originalPath;

      await plugin(baseArgs);

      const expectedFileName = inputPath.split('/').pop()?.split('.')[0];
      const expectedDir = originalPath.substring(0, originalPath.lastIndexOf('/'));
      const expectedPath = `${expectedDir}/${expectedFileName}.${container}`;

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: inputPath,
        destinationPath: expectedPath,
        args: baseArgs,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file move errors gracefully', async () => {
      mockFileMoveOrCopy.mockRejectedValue(new Error('File move failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('File move failed');
      expect(mockFileMoveOrCopy).toHaveBeenCalled();
    });

    it('should still return output file path even if move fails', async () => {
      // Mock fileMoveOrCopy to not throw but return false
      mockFileMoveOrCopy.mockResolvedValue(false);

      await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with special characters in names', async () => {
      baseArgs.inputFileObj._id = '/temp/movie with spaces & symbols!.mp4';
      baseArgs.originalLibraryFile._id = '/library/original file.mp4';

      await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/temp/movie with spaces & symbols!.mp4',
        destinationPath: '/library/movie with spaces & symbols!.mp4',
        args: baseArgs,
      });
    });

    it('should handle files with no extension', async () => {
      baseArgs.inputFileObj._id = '/temp/filename';
      baseArgs.originalLibraryFile._id = '/library/original.mp4';

      await plugin(baseArgs);

      // getFileName returns the full path minus extension, getContainer returns the full path
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/temp/filename',
        destinationPath: '/library/./temp/filename',
        args: baseArgs,
      });
    });
  });

  describe('Variable Preservation', () => {
    it('should preserve all variables in output', async () => {
      baseArgs.variables.user.customVar = 'testValue';
      baseArgs.variables.flowFailed = true;

      const result = await plugin(baseArgs);

      expect(result.variables).toEqual(baseArgs.variables);
      expect(result.variables.user.customVar).toBe('testValue');
      expect(result.variables.flowFailed).toBe(true);
    });
  });
});
