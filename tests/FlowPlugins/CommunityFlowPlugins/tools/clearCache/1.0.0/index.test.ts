import { promises as fsp } from 'fs';
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/clearCache/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
  },
  realpathSync: jest.fn().mockImplementation((path) => path),
}));

// Mock the lib module to avoid fs.realpathSync issue
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: jest.fn((inputs) => ({
    cacheToClear: inputs.cacheToClear || 'jobCache',
    ...inputs,
  })),
}));

const mockFsp = fsp as jest.Mocked<typeof fsp>;

describe('clearCache Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();

    baseArgs = {
      inputs: {
        cacheToClear: 'jobCache',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)),
      jobLog: jest.fn(),
      workDir: '/path/to/job/cache',
      librarySettings: {
        cache: '/path/to/library/cache',
      },
      deps: {
        upath: {
          join: (...paths: string[]) => paths.join('/'),
          joinSafe: (...paths: string[]) => paths.join('/'),
        },
        fsextra: {},
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        gracefulfs: {},
        mvdir: {},
        ncp: {},
        axios: {},
        crudTransDBN: jest.fn(),
        configVars: {
          config: {
            serverIP: 'localhost',
            serverPort: '8265',
          },
        },
      },
    } as unknown as IpluginInputArgs;

    // Mock successful file operations by default
    mockFsp.readdir.mockResolvedValue([]);
    mockFsp.stat.mockResolvedValue({ isDirectory: () => false } as never);
    mockFsp.unlink.mockResolvedValue(undefined);
  });

  describe('Job Cache Clearing', () => {
    it('should clear job cache and keep current file', async () => {
      const currentFileId = baseArgs.inputFileObj._id;
      const cacheFiles = [
        'file1-tdarr-workDir2.mkv',
        'file2-tdarr-workDir2.mp4',
        currentFileId, // This should not be deleted
      ];

      mockFsp.readdir.mockResolvedValue(cacheFiles as never);
      mockFsp.stat.mockImplementation(() => Promise.resolve({ isDirectory: () => false } as never));

      baseArgs.inputs.cacheToClear = 'jobCache';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Clearing jobCache folder: "/path/to/job/cache"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Keeping current file: "${currentFileId}"`);

      // Should delete tdarr cache files but not the current file
      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/job/cache/file1-tdarr-workDir2.mkv');
      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/job/cache/file2-tdarr-workDir2.mp4');
      expect(mockFsp.unlink).not.toHaveBeenCalledWith(currentFileId);
    });

    it('should not delete non-tdarr files', async () => {
      const cacheFiles = [
        'regular-file.txt',
        'other-file.log',
        'tdarr-workDir2-file.mkv',
      ];

      mockFsp.readdir.mockResolvedValue(cacheFiles as never);
      mockFsp.stat.mockImplementation(() => Promise.resolve({ isDirectory: () => false } as never));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Should only delete the tdarr cache file
      expect(mockFsp.unlink).toHaveBeenCalledTimes(1);
      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/job/cache/tdarr-workDir2-file.mkv');
      expect(mockFsp.unlink).not.toHaveBeenCalledWith('/path/to/job/cache/regular-file.txt');
      expect(mockFsp.unlink).not.toHaveBeenCalledWith('/path/to/job/cache/other-file.log');
    });
  });

  describe('Library Cache Clearing', () => {
    it('should clear library cache', async () => {
      const cacheFiles = [
        'lib-file1-tdarr-workDir2.mkv',
        'lib-file2-tdarr-workDir2.mp4',
      ];

      mockFsp.readdir.mockResolvedValue(cacheFiles as never);
      mockFsp.stat.mockImplementation(() => Promise.resolve({ isDirectory: () => false } as never));

      baseArgs.inputs.cacheToClear = 'libraryCache';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Clearing libraryCache folder: "/path/to/library/cache"');

      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/library/cache/lib-file1-tdarr-workDir2.mkv');
      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/library/cache/lib-file2-tdarr-workDir2.mp4');
    });
  });

  describe('Directory Traversal', () => {
    it('should traverse subdirectories recursively', async () => {
      // Main directory contains a subdirectory
      mockFsp.readdir
        .mockResolvedValueOnce(['subdir', 'file1-tdarr-workDir2.mkv'] as never)
        .mockResolvedValueOnce(['nested-file-tdarr-workDir2.mp4'] as never);

      mockFsp.stat
        .mockResolvedValueOnce({ isDirectory: () => true } as never) // subdir
        .mockResolvedValueOnce({ isDirectory: () => false } as never) // file1
        .mockResolvedValueOnce({ isDirectory: () => false } as never); // nested-file

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFsp.readdir).toHaveBeenCalledTimes(2);
      expect(mockFsp.readdir).toHaveBeenCalledWith('/path/to/job/cache');
      expect(mockFsp.readdir).toHaveBeenCalledWith('/path/to/job/cache/subdir');

      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/job/cache/file1-tdarr-workDir2.mkv');
      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/job/cache/subdir/nested-file-tdarr-workDir2.mp4');
    });

    it('should handle empty directories', async () => {
      mockFsp.readdir.mockResolvedValue([]);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFsp.unlink).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Clearing jobCache folder: "/path/to/job/cache"');
    });
  });

  describe('Error Handling', () => {
    it('should handle file deletion errors gracefully', async () => {
      const cacheFiles = ['error-file-tdarr-workDir2.mkv'];
      const deleteError = new Error('Permission denied');

      mockFsp.readdir.mockResolvedValue(cacheFiles as never);
      mockFsp.stat.mockResolvedValue({ isDirectory: () => false } as never);
      mockFsp.unlink.mockRejectedValue(deleteError);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting "/path/to/job/cache/error-file-tdarr-workDir2.mkv"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`File delete error: ${JSON.stringify(deleteError)}`);
    });

    it('should handle readdir errors', async () => {
      const readdirError = new Error('Directory not found');
      mockFsp.readdir.mockRejectedValue(readdirError);

      await expect(plugin(baseArgs)).rejects.toThrow('Directory not found');
    });

    it('should handle stat errors', async () => {
      const statError = new Error('File not accessible');
      mockFsp.readdir.mockResolvedValue(['test-file'] as never);
      mockFsp.stat.mockRejectedValue(statError);

      await expect(plugin(baseArgs)).rejects.toThrow('File not accessible');
    });
  });

  describe('File Filtering Logic', () => {
    it('should preserve current file even if it matches tdarr pattern', async () => {
      const currentFileWithPattern = '/path/to/job/cache/custom-tdarr-workDir2-current.mkv';
      baseArgs.inputFileObj._id = currentFileWithPattern;

      const cacheFiles = [
        'other-tdarr-workDir2.mkv',
        'custom-tdarr-workDir2-current.mkv', // Same as current file (filename only)
      ];

      mockFsp.readdir.mockResolvedValue(cacheFiles as never);
      mockFsp.stat.mockResolvedValue({ isDirectory: () => false } as never);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockFsp.unlink).toHaveBeenCalledTimes(1);
      expect(mockFsp.unlink).toHaveBeenCalledWith('/path/to/job/cache/other-tdarr-workDir2.mkv');
      expect(mockFsp.unlink).not.toHaveBeenCalledWith('/path/to/job/cache/custom-tdarr-workDir2-current.mkv');
    });

    it('should log files being deleted', async () => {
      const cacheFiles = ['delete-me-tdarr-workDir2.mkv'];

      mockFsp.readdir.mockResolvedValue(cacheFiles as never);
      mockFsp.stat.mockResolvedValue({ isDirectory: () => false } as never);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Deleting "/path/to/job/cache/delete-me-tdarr-workDir2.mkv"');
    });
  });

  describe('Input Validation', () => {
    it('should handle unknown cache type gracefully', async () => {
      baseArgs.inputs.cacheToClear = 'unknownCache';

      mockFsp.readdir.mockResolvedValue([]);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should clear empty string path (folderToClear would be empty)
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Clearing unknownCache folder: ""');
    });
  });

  describe('Default Values Loading', () => {
    it('should use default values when not provided', async () => {
      baseArgs.inputs = {}; // No inputs provided

      mockFsp.readdir.mockResolvedValue([]);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should use default 'jobCache' value
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Clearing jobCache folder: "/path/to/job/cache"');
    });
  });
});
