// Mock functions
import { promises as fsp } from 'fs';
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/copyMoveFolderContent/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import fileMoveOrCopy from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy';

const mockEnsureDirSync = jest.fn();
const mockLoadDefaultValues = jest.fn();

// Get the mocked function
const mockFileMoveOrCopy = jest.mocked(fileMoveOrCopy);

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
  },
  realpathSync: jest.fn().mockImplementation((path) => path),
}));

// Mock fileMoveOrCopy
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the lib function
jest.mock('../../../../../../methods/lib', () => jest.fn(() => ({
  loadDefaultValues: mockLoadDefaultValues,
})));

// Mock normJoinPath
jest.mock(
  '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/normJoinPath',
  () => jest.fn(({ paths }: { paths: string[] }) => paths.join('/').replace(/\/+/g, '/')),
);

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Note: fileUtils functions are not mocked as per requirements

describe('copyMoveFolderContent Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    (fsp.readdir as jest.Mock).mockResolvedValue([]);
    mockEnsureDirSync.mockReturnValue(undefined);
    mockFileMoveOrCopy.mockResolvedValue(true);
    mockLoadDefaultValues.mockImplementation((inputs) => inputs);

    baseArgs = {
      inputs: {
        sourceDirectory: 'originalDirectory',
        copyOrMove: 'copy',
        outputDirectory: '/output/folder',
        keepRelativePath: true,
        allFiles: false,
        fileExtensions: 'srt,ass',
      },
      variables: {},
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      librarySettings: {
        folder: '/library',
      },
      jobLog: jest.fn(),
      deps: {
        fsextra: {
          ensureDirSync: mockEnsureDirSync,
        },
        upath: {
          join: (...paths: string[]) => paths.join('/'),
          joinSafe: (...paths: string[]) => paths.join('/'),
          normalize: (path: string) => path,
        },
      },
    } as unknown as IpluginInputArgs;

    // Mock the working file to be different from original
    baseArgs.inputFileObj._id = '/working/folder/workingFile.mp4';
  });

  describe('Copy Operation - Basic Functionality', () => {
    it('should copy subtitle files from original directory', async () => {
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt', 'movie.ass', 'movie.mp4', 'cover.jpg']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(fsp.readdir).toHaveBeenCalledWith('C:/Transcode/Source Folder');
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(2);
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'copy',
        sourcePath: 'C:/Transcode/Source Folder/movie.srt',
        destinationPath: '/output/folder/code/Source Folder/movie.srt',
        args: baseArgs,
      });
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'copy',
        sourcePath: 'C:/Transcode/Source Folder/movie.ass',
        destinationPath: '/output/folder/code/Source Folder/movie.ass',
        args: baseArgs,
      });
    });

    it('should copy all files when allFiles is true', async () => {
      baseArgs.inputs.allFiles = true;
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt', 'movie.ass', 'cover.jpg', 'thumbnail.png']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(4);
    });

    it('should exclude original and working files from copy operation', async () => {
      (fsp.readdir as jest.Mock).mockResolvedValue([
        'SampleVideo_1280x720_1mb.mp4', // Original file (should be excluded)
        'workingFile.mp4', // Working file (should be excluded)
        'movie.srt',
        'movie.ass',
      ]);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(2); // Only subtitle files
    });
  });

  describe('Move Operation', () => {
    it('should move files instead of copy when copyOrMove is set to move', async () => {
      baseArgs.inputs.copyOrMove = 'move';
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt', 'movie.ass']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(2);
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'move',
        }),
      );
    });
  });

  describe('Source Directory Options', () => {
    it('should use working directory when sourceDirectory is workingDirectory', async () => {
      baseArgs.inputs.sourceDirectory = 'workingDirectory';
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(fsp.readdir).toHaveBeenCalledWith('/working/folder');
    });
  });

  describe('Path Configuration', () => {
    it('should respect keepRelativePath setting', async () => {
      baseArgs.inputs.keepRelativePath = false;
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationPath: '/output/folder/movie.srt', // No relative path
        }),
      );
    });

    it('should create proper relative paths when keepRelativePath is true', async () => {
      baseArgs.inputs.keepRelativePath = true;
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationPath: expect.stringContaining('/output/folder/'),
        }),
      );
    });
  });

  describe('File Extension Filtering', () => {
    it('should filter files by specified extensions', async () => {
      baseArgs.inputs.fileExtensions = 'srt,vtt,sub';
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt', 'movie.vtt', 'movie.sub', 'movie.ass', 'cover.jpg']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(3);
    });

    it('should handle file extensions with spaces in input', async () => {
      baseArgs.inputs.fileExtensions = 'srt, ass , vtt';
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt', 'movie.ass', 'movie.vtt']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty directory', async () => {
      (fsp.readdir as jest.Mock).mockResolvedValue([]);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).not.toHaveBeenCalled();
    });

    it('should handle directory with only original and working files', async () => {
      (fsp.readdir as jest.Mock).mockResolvedValue(['SampleVideo_1280x720_1mb.mp4', 'workingFile.mp4']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).not.toHaveBeenCalled();
    });

    it('should handle no matching file extensions', async () => {
      baseArgs.inputs.fileExtensions = 'xyz,abc';
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt', 'movie.ass', 'cover.jpg']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).not.toHaveBeenCalled();
    });

    it('should ensure directory creation is called', async () => {
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockEnsureDirSync).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle readdir failure gracefully', async () => {
      const error = new Error('Permission denied');
      (fsp.readdir as jest.Mock).mockRejectedValue(error);

      await expect(plugin(baseArgs)).rejects.toThrow('Permission denied');
    });

    it('should handle file operation failure gracefully', async () => {
      const error = new Error('File operation failed');
      (fsp.readdir as jest.Mock).mockResolvedValue(['movie.srt']);
      mockFileMoveOrCopy.mockRejectedValue(error);

      await expect(plugin(baseArgs)).rejects.toThrow('File operation failed');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full copy workflow successfully', async () => {
      (fsp.readdir as jest.Mock).mockResolvedValue(['subtitle.srt', 'subtitle.ass', 'cover.jpg']);
      baseArgs.inputs.allFiles = true;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(fsp.readdir).toHaveBeenCalledTimes(1);
      expect(mockEnsureDirSync).toHaveBeenCalled();
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(3);
    });

    it('should complete full move workflow successfully', async () => {
      baseArgs.inputs.copyOrMove = 'move';
      baseArgs.inputs.keepRelativePath = false;
      (fsp.readdir as jest.Mock).mockResolvedValue(['subtitle.srt']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: 'C:/Transcode/Source Folder/subtitle.srt',
        destinationPath: '/output/folder/subtitle.srt',
        args: baseArgs,
      });
    });
  });
});
