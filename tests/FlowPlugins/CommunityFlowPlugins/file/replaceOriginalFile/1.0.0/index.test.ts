/* eslint-disable import/first */
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

// Mock fileMoveOrCopy
const mockFileMoveOrCopy = jest.fn();

// Mock fs promises
const mockFsPromises = {
  unlink: jest.fn(),
};

// Mock fileExists
const mockFileExists = jest.fn();

// Mock lib
const mockLib = {
  loadDefaultValues: jest.fn((inputs) => inputs),
};

jest.mock('fs', () => ({
  promises: mockFsPromises,
}));

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy', () => ({
  __esModule: true,
  default: mockFileMoveOrCopy,
}));

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  ...jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils'),
  fileExists: mockFileExists,
}));

jest.mock('../../../../../../methods/lib', () => () => mockLib);

import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/replaceOriginalFile/1.0.0/index';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('replaceOriginalFile Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let originalFileObj: IFileObject;
  let inputFileObj: IFileObject;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFileMoveOrCopy.mockResolvedValue(true);
    mockFileExists.mockResolvedValue(true);
    mockFsPromises.unlink.mockResolvedValue(undefined);

    // Create base file objects
    originalFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
    originalFileObj._id = '/original/path/video.mp4';
    originalFileObj.file_size = 100;

    inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
    inputFileObj._id = '/working/path/video_transcoded.mkv';
    inputFileObj.file_size = 80;

    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj,
      originalLibraryFile: originalFileObj,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Mock setTimeout to resolve immediately
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: () => void) => {
      callback();
      return {} as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('File Unchanged Cases', () => {
    it('should skip replacement when file ID and size are unchanged', async () => {
      // Same file ID and size
      baseArgs.inputFileObj._id = originalFileObj._id;
      baseArgs.inputFileObj.file_size = originalFileObj.file_size;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has not changed, no need to replace file');
      expect(mockFileMoveOrCopy).not.toHaveBeenCalled();
      expect(mockFsPromises.unlink).not.toHaveBeenCalled();
    });

    it('should proceed with replacement when file ID is same but size changed', async () => {
      baseArgs.inputFileObj._id = originalFileObj._id;
      baseArgs.inputFileObj.file_size = 50; // Different size

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has changed, replacing original file');
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(2);
    });

    it('should proceed with replacement when file size is same but ID changed', async () => {
      baseArgs.inputFileObj._id = '/different/path/video.mp4';
      baseArgs.inputFileObj.file_size = originalFileObj.file_size; // Same size

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has changed, replacing original file');
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(2);
    });
  });

  describe('File Replacement Process', () => {
    it('should replace original file with working file', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has changed, replacing original file');

      // Should log the paths
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching(/currentPath.*newPath.*newPathTmp/),
      );

      // Should move to temporary location first
      expect(mockFileMoveOrCopy).toHaveBeenNthCalledWith(1, {
        operation: 'move',
        sourcePath: '/working/path/video_transcoded.mkv',
        destinationPath: '/original/path/video_transcoded.mkv.tmp',
        args: baseArgs,
      });

      // Should move from temporary to final location
      expect(mockFileMoveOrCopy).toHaveBeenNthCalledWith(2, {
        operation: 'move',
        sourcePath: '/original/path/video_transcoded.mkv.tmp',
        destinationPath: '/original/path/video_transcoded.mkv',
        args: baseArgs,
      });

      expect(result.outputFileObj._id).toBe('/original/path/video_transcoded.mkv');
    });

    it('should delete original file when it exists and is different from current file', async () => {
      mockFileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(mockFsPromises.unlink).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting original file:/original/path/video.mp4');
      expect(result.outputNumber).toBe(1);
    });

    it('should not delete original file when it does not exist', async () => {
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(mockFsPromises.unlink).not.toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
    });

    it('should not delete original file when current file is the same as original', async () => {
      baseArgs.inputFileObj._id = originalFileObj._id;
      baseArgs.inputFileObj.file_size = 50; // Different size to trigger replacement
      mockFileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(mockFsPromises.unlink).not.toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Path and Container Handling', () => {
    it('should handle different file containers correctly', async () => {
      baseArgs.inputFileObj._id = '/working/path/video_transcoded.avi';
      originalFileObj._id = '/original/folder/original.mp4';

      const result = await plugin(baseArgs);

      // Should use the input file's name and container in the original directory
      expect(mockFileMoveOrCopy).toHaveBeenNthCalledWith(2, {
        operation: 'move',
        sourcePath: '/original/folder/video_transcoded.avi.tmp',
        destinationPath: '/original/folder/video_transcoded.avi',
        args: baseArgs,
      });

      expect(result.outputFileObj._id).toBe('/original/folder/video_transcoded.avi');
    });

    it('should handle complex file paths with multiple dots', async () => {
      baseArgs.inputFileObj._id = '/working/path/video.file.name.mkv';
      originalFileObj._id = '/original/folder/old.video.mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/original/folder/video.file.name.mkv');
    });

    it('should handle Windows-style paths', async () => {
      baseArgs.inputFileObj._id = 'C:\\working\\path\\video.mkv';
      originalFileObj._id = 'C:\\original\\folder\\old.mp4';

      const result = await plugin(baseArgs);

      // Note: The plugin's path utilities don't handle Windows paths correctly
      // They split on '/' only, so Windows paths get mangled
      expect(result.outputFileObj._id).toBe('/C:\\working\\path\\video.mkv');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no extension', async () => {
      baseArgs.inputFileObj._id = '/working/path/videofile';
      originalFileObj._id = '/original/folder/original.mp4';

      const result = await plugin(baseArgs);

      // Files with no extension result in empty filename and the full path as container
      expect(result.outputFileObj._id).toBe('/original/folder/./working/path/videofile');
    });

    it('should wait for delays as implemented in the plugin', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      await plugin(baseArgs);

      // Should have two setTimeout calls with 2000ms delay
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    });

    it('should preserve variables in the output', async () => {
      const testVariables = {
        ...baseArgs.variables,
        user: { customProperty: 'testValue' },
      };
      baseArgs.variables = testVariables;

      const result = await plugin(baseArgs);

      expect(result.variables).toBe(testVariables);
    });
  });

  describe('Logging', () => {
    it('should log file operation details', async () => {
      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has changed, replacing original file');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching(/currentPath.*newPath.*newPathTmp/),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching(/originalFileExists.*currentFileIsNotOriginal/),
      );
    });

    it('should log original file deletion when applicable', async () => {
      mockFileExists.mockResolvedValue(true);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting original file:/original/path/video.mp4');
    });
  });
});
