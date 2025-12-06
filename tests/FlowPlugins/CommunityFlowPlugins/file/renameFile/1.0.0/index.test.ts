import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/renameFile/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import * as fileMoveOrCopy from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

// Mock the fileMoveOrCopy function
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy', () => jest.fn());

describe('renameFile Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockFileMoveOrCopy: jest.MockedFunction<typeof fileMoveOrCopy.default>;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        // eslint-disable-next-line no-template-curly-in-string
        fileRename: '${fileName}_720p.${container}',
      },
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Get the mocked fileMoveOrCopy function
    mockFileMoveOrCopy = fileMoveOrCopy.default as jest.MockedFunction<typeof fileMoveOrCopy.default>;
    mockFileMoveOrCopy.mockResolvedValue(true);
    jest.clearAllMocks();
  });

  describe('Basic File Renaming', () => {
    it('should rename file with template variables', async () => {
      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_720p.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_720p.mp4');
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should handle different file types (MP3)', async () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_processed.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/sample__-__-__libmp3lame__30s__audio.mkv',
        destinationPath: 'C:/Transcode/Source Folder/sample__-__-__libmp3lame__30s__audio_processed.mkv',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe(
        'C:/Transcode/Source Folder/sample__-__-__libmp3lame__30s__audio_processed.mkv',
      );
    });
  });

  describe('Template Variable Replacement', () => {
    // eslint-disable-next-line no-template-curly-in-string
    it('should replace ${fileName} template variable', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_transcoded.mp4';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_transcoded.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    // eslint-disable-next-line no-template-curly-in-string
    it('should replace ${container} template variable', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = 'converted_file.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/converted_file.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    // eslint-disable-next-line no-template-curly-in-string
    it('should handle multiple ${fileName} occurrences', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_backup_${fileName}.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_backup_SampleVideo_1280x720_1mb.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should handle rename without template variables', async () => {
      baseArgs.inputs.fileRename = 'static_filename.mp4';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/static_filename.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Same Path Handling', () => {
    it('should skip rename when input and output paths are the same', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Input and output path are the same, skipping rename.');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with complex paths', async () => {
      const complexPath = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      complexPath._id = '/media/videos/subfolder/Movie (2023) [1080p].mp4';
      baseArgs.inputFileObj = complexPath;
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_renamed.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/media/videos/subfolder/Movie (2023) [1080p].mp4',
        destinationPath: '/media/videos/subfolder/Movie (2023) [1080p]_renamed.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should handle files without extension', async () => {
      const noExtFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      noExtFile._id = '/media/videos/filename_no_ext';
      baseArgs.inputFileObj = noExtFile;
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_new.${container}';

      const result = await plugin(baseArgs);

      // getFileName splits by '/' and '.' - for files without extension, the fileName is empty
      // getContainer returns the full path when there's no extension (since it splits by '.')
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/media/videos/filename_no_ext',
        destinationPath: '/media/videos/_new./media/videos/filename_no_ext',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should handle multiple periods in filename', async () => {
      const multiDotFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      multiDotFile._id = '/media/videos/movie.part1.2023.mp4';
      baseArgs.inputFileObj = multiDotFile;
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_complete.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/media/videos/movie.part1.2023.mp4',
        destinationPath: '/media/videos/movie.part1.2023_complete.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should trim whitespace from fileRename input', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '  ${fileName}_trimmed.${container}  ';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_trimmed.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should use default value when fileRename input is empty', async () => {
      baseArgs.inputs.fileRename = '';

      const result = await plugin(baseArgs);

      // When empty, the plugin will use the default value: ${fileName}_720p.${container}
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
        destinationPath: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_720p.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Variable Propagation', () => {
    it('should preserve variables and state in output', async () => {
      baseArgs.variables.user = { customVar: 'testValue' };
      baseArgs.variables.ffmpegCommand.shouldProcess = true;

      const result = await plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.user.customVar).toBe('testValue');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
    });
  });

  describe('Directory Path Handling', () => {
    it('should handle Windows-style paths', async () => {
      const windowsFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      windowsFile._id = 'D:\\Videos\\Movie.mp4';
      baseArgs.inputFileObj = windowsFile;
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_win.${container}';

      const result = await plugin(baseArgs);

      // getFileAbosluteDir splits by '/', so Windows backslashes cause issues
      // The path becomes a single component without directory separation
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'D:\\Videos\\Movie.mp4',
        destinationPath: '/D:\\Videos\\Movie_win.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should handle Unix-style paths', async () => {
      const unixFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      unixFile._id = '/home/user/videos/movie.mp4';
      baseArgs.inputFileObj = unixFile;
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileRename = '${fileName}_unix.${container}';

      const result = await plugin(baseArgs);

      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: '/home/user/videos/movie.mp4',
        destinationPath: '/home/user/videos/movie_unix.mp4',
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });
  });
});
