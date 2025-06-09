import { promises as fsp } from 'fs';
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/deleteFile/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock fs.promises methods
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
    readdir: jest.fn(),
    rmdir: jest.fn(),
  },
}));

// Mock the lib module to avoid fs.realpathSync issue while keeping loadDefaultValues functionality
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: require('../../../../../../methods/loadDefaultValues'),
}));

// Mock the fileUtils module
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  getFileAbosluteDir: jest.fn(),
}));

const mockFs = fsp as jest.Mocked<typeof fsp>;
const { getFileAbosluteDir } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');

describe('deleteFile Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default successful mocks
    mockFs.unlink.mockResolvedValue();
    mockFs.readdir.mockResolvedValue([]);
    mockFs.rmdir.mockResolvedValue();

    // Setup default file paths
    const workingFilePath = '/tmp/working/file.mp4';
    const originalFilePath = '/original/file.mp4';

    baseArgs = {
      inputs: {
        fileToDelete: 'workingFile',
        deleteWorkingFileIfOriginal: true,
        deleteParentFolderIfEmpty: false,
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
      inputFileObj: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: workingFilePath,
      } as IFileObject,
      originalLibraryFile: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: originalFilePath,
      } as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Setup mock for getFileAbosluteDir
    getFileAbosluteDir.mockReturnValue('/original');
  });

  describe('Delete Working File', () => {
    it('should delete working file when it is not the original file', async () => {
      const result = await plugin(baseArgs);

      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/working/file.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file is not the original file!');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting working file /tmp/working/file.mp4');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should delete working file when it is the original file and deleteWorkingFileIfOriginal is true', async () => {
      // Make working file same as original file
      baseArgs.inputFileObj._id = baseArgs.originalLibraryFile._id;

      const result = await plugin(baseArgs);

      expect(mockFs.unlink).toHaveBeenCalledWith('/original/file.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file is the original file!');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting working file /original/file.mp4');
      expect(result.outputNumber).toBe(1);
    });

    it('should skip deleting working file when it is the original file and deleteWorkingFileIfOriginal is false',
      async () => {
      // Make working file same as original file
        baseArgs.inputFileObj._id = baseArgs.originalLibraryFile._id;
        baseArgs.inputs.deleteWorkingFileIfOriginal = false;

        const result = await plugin(baseArgs);

        expect(mockFs.unlink).not.toHaveBeenCalled();
        expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file is the original file!');
        expect(baseArgs.jobLog).toHaveBeenCalledWith('Skipping delete of working file because it is the original file');
        expect(result.outputNumber).toBe(1);
      });
  });

  describe('Delete Original File', () => {
    it('should delete original file when fileToDelete is originalFile', async () => {
      baseArgs.inputs.fileToDelete = 'originalFile';

      const result = await plugin(baseArgs);

      expect(mockFs.unlink).toHaveBeenCalledWith('/original/file.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting original file /original/file.mp4');
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Delete Parent Folder', () => {
    it('should delete parent folder when it is empty and deleteParentFolderIfEmpty is true', async () => {
      baseArgs.inputs.deleteParentFolderIfEmpty = true;
      mockFs.readdir.mockResolvedValue([]);

      const result = await plugin(baseArgs);

      expect(getFileAbosluteDir).toHaveBeenCalledWith('/original/file.mp4');
      expect(mockFs.readdir).toHaveBeenCalledWith('/original');
      expect(mockFs.rmdir).toHaveBeenCalledWith('/original');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking if folder /original is empty');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting empty folder /original');
      expect(result.outputNumber).toBe(1);
    });

    it('should not delete parent folder when it is not empty', async () => {
      baseArgs.inputs.deleteParentFolderIfEmpty = true;
      (mockFs.readdir as jest.Mock).mockResolvedValue(['otherFile.txt']);

      const result = await plugin(baseArgs);

      expect(mockFs.readdir).toHaveBeenCalledWith('/original');
      expect(mockFs.rmdir).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking if folder /original is empty');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Folder /original is not empty, skipping delete');
      expect(result.outputNumber).toBe(1);
    });

    it('should skip deleting parent folder when deleteParentFolderIfEmpty is false', async () => {
      baseArgs.inputs.deleteParentFolderIfEmpty = false;

      const result = await plugin(baseArgs);

      expect(mockFs.readdir).not.toHaveBeenCalled();
      expect(mockFs.rmdir).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Skipping delete of parent folder /original');
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle filesystem errors gracefully when deleting files', async () => {
      jest.clearAllMocks();
      const error = new Error('Permission denied');
      mockFs.unlink.mockRejectedValue(error);

      await expect(plugin(baseArgs)).rejects.toThrow('Permission denied');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting working file /tmp/working/file.mp4');
    });

    it('should handle filesystem errors when reading directory', async () => {
      jest.clearAllMocks();
      // Reset successful calls first
      mockFs.unlink.mockResolvedValue();
      baseArgs.inputs.deleteParentFolderIfEmpty = true;
      const error = new Error('Directory not found');
      mockFs.readdir.mockRejectedValue(error);

      await expect(plugin(baseArgs)).rejects.toThrow('Directory not found');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking if folder /original is empty');
    });

    it('should handle filesystem errors when deleting directory', async () => {
      jest.clearAllMocks();
      // Reset successful calls first
      mockFs.unlink.mockResolvedValue();
      baseArgs.inputs.deleteParentFolderIfEmpty = true;
      mockFs.readdir.mockResolvedValue([]);
      const error = new Error('Cannot delete directory');
      mockFs.rmdir.mockRejectedValue(error);

      await expect(plugin(baseArgs)).rejects.toThrow('Cannot delete directory');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting empty folder /original');
    });
  });

  describe('Complex Scenarios', () => {
    it('should delete working file and empty parent folder in one operation', async () => {
      jest.clearAllMocks();
      mockFs.unlink.mockResolvedValue();
      baseArgs.inputs.deleteParentFolderIfEmpty = true;
      mockFs.readdir.mockResolvedValue([]);

      const result = await plugin(baseArgs);

      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/working/file.mp4');
      expect(mockFs.readdir).toHaveBeenCalledWith('/original');
      expect(mockFs.rmdir).toHaveBeenCalledWith('/original');
      expect(result.outputNumber).toBe(1);
    });

    it('should delete original file and check parent folder', async () => {
      jest.clearAllMocks();
      mockFs.unlink.mockResolvedValue();
      baseArgs.inputs.fileToDelete = 'originalFile';
      baseArgs.inputs.deleteParentFolderIfEmpty = true;
      (mockFs.readdir as jest.Mock).mockResolvedValue(['other.mp4']);

      const result = await plugin(baseArgs);

      expect(mockFs.unlink).toHaveBeenCalledWith('/original/file.mp4');
      expect(mockFs.readdir).toHaveBeenCalledWith('/original');
      expect(mockFs.rmdir).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Folder /original is not empty, skipping delete');
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Return Values', () => {
    it('should always return outputNumber 1 and pass through variables', async () => {
      const testVariables = {
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
        user: { testVar: 'testValue' },
      };
      baseArgs.variables = testVariables;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(testVariables);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });
});
