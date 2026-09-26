/* eslint-disable import/first */
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

// Mock fileMoveOrCopy
const mockFileMoveOrCopy = jest.fn();

// Mock fs promises
const mockFsPromises = {
  unlink: jest.fn(),
  rename: jest.fn(),
  stat: jest.fn(),
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
    // Default: the original file exists, the .old sentinel does not.
    // Individual tests that need different behavior override this.
    mockFileExists.mockImplementation(
      (p: string) => Promise.resolve(p === '/original/path/video.mp4'),
    );
    mockFsPromises.unlink.mockResolvedValue(undefined);
    mockFsPromises.rename.mockResolvedValue(undefined);

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
      expect(mockFsPromises.rename).not.toHaveBeenCalled();
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
    it('should replace original file with working file using safe swap order', async () => {
      const callOrder: string[] = [];
      mockFileMoveOrCopy.mockImplementation(({ sourcePath, destinationPath }) => {
        callOrder.push(`move:${sourcePath}->${destinationPath}`);
        return Promise.resolve(true);
      });
      mockFsPromises.rename.mockImplementation((from: string, to: string) => {
        callOrder.push(`rename:${from}->${to}`);
        return Promise.resolve();
      });
      mockFsPromises.unlink.mockImplementation((target: string) => {
        callOrder.push(`unlink:${target}`);
        return Promise.resolve();
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has changed, replacing original file');

      // Should log the paths (including originalPathOld)
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching(/currentPath.*newPath.*newPathTmp.*originalPathOld/),
      );

      // Should move working file into origin folder as .tmp first
      expect(mockFileMoveOrCopy).toHaveBeenNthCalledWith(1, {
        operation: 'move',
        sourcePath: '/working/path/video_transcoded.mkv',
        destinationPath: '/original/path/video_transcoded.mkv.tmp',
        args: baseArgs,
      });

      // Should move tmp to final location
      expect(mockFileMoveOrCopy).toHaveBeenNthCalledWith(2, {
        operation: 'move',
        sourcePath: '/original/path/video_transcoded.mkv.tmp',
        destinationPath: '/original/path/video_transcoded.mkv',
        args: baseArgs,
      });

      // Verify safe-swap ordering: tmp staged -> original renamed aside -> tmp into place -> .old deleted
      expect(callOrder).toEqual([
        'move:/working/path/video_transcoded.mkv->/original/path/video_transcoded.mkv.tmp',
        'rename:/original/path/video.mp4->/original/path/video.mp4.partial.old',
        'move:/original/path/video_transcoded.mkv.tmp->/original/path/video_transcoded.mkv',
        'unlink:/original/path/video.mp4.partial.old',
      ]);

      expect(result.outputFileObj._id).toBe('/original/path/video_transcoded.mkv');
    });

    it('should rename original aside and delete it after successful swap', async () => {
      mockFileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(mockFsPromises.rename).toHaveBeenCalledWith(
        '/original/path/video.mp4',
        '/original/path/video.mp4.partial.old',
      );
      expect(mockFsPromises.unlink).toHaveBeenCalledWith('/original/path/video.mp4.partial.old');
      // Original path must never be unlinked directly - only the .old copy
      expect(mockFsPromises.unlink).not.toHaveBeenCalledWith('/original/path/video.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Renaming original file to: /original/path/video.mp4.partial.old',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Deleting renamed original file: /original/path/video.mp4.partial.old',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should not rename or delete original file when it does not exist', async () => {
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(mockFsPromises.rename).not.toHaveBeenCalled();
      expect(mockFsPromises.unlink).not.toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
    });

    it('should not rename original when current file path is the same as original', async () => {
      baseArgs.inputFileObj._id = originalFileObj._id;
      baseArgs.inputFileObj.file_size = 50; // Different size to trigger replacement
      mockFileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/original/path/video.mp4');
      expect(mockFsPromises.rename).not.toHaveBeenCalled();
      expect(mockFsPromises.unlink).not.toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Stale .old Cleanup', () => {
    it('should unlink a stale .old file before renaming the original aside', async () => {
      // fileExists is called for originalPath AND originalPathOld; stub both
      mockFileExists.mockImplementation((p: string) => {
        if (p === '/original/path/video.mp4') return Promise.resolve(true);
        if (p === '/original/path/video.mp4.partial.old') return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const callOrder: string[] = [];
      mockFsPromises.unlink.mockImplementation((target: string) => {
        callOrder.push(`unlink:${target}`);
        return Promise.resolve();
      });
      mockFsPromises.rename.mockImplementation((from: string, to: string) => {
        callOrder.push(`rename:${from}->${to}`);
        return Promise.resolve();
      });

      await plugin(baseArgs);

      // Stale .old must be removed BEFORE the rename-aside
      expect(callOrder).toEqual([
        'unlink:/original/path/video.mp4.partial.old',
        'rename:/original/path/video.mp4->/original/path/video.mp4.partial.old',
        'unlink:/original/path/video.mp4.partial.old',
      ]);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stale file at /original/path/video.mp4.partial.old',
      );
    });

    it('should not attempt to unlink .old when it does not exist', async () => {
      mockFileExists.mockImplementation(
        (p: string) => Promise.resolve(p === '/original/path/video.mp4'),
      );

      await plugin(baseArgs);

      // Only the final cleanup unlink of .old, not a pre-rename one
      expect(mockFsPromises.unlink).toHaveBeenCalledTimes(1);
      expect(mockFsPromises.unlink).toHaveBeenCalledWith('/original/path/video.mp4.partial.old');
      expect(baseArgs.jobLog).not.toHaveBeenCalledWith(
        expect.stringContaining('Removing stale file'),
      );
    });
  });

  describe('Failure and Rollback', () => {
    it('should restore original from .old if final move fails, and rethrow', async () => {
      // First move (cache -> tmp) succeeds, second move (tmp -> final) fails
      mockFileMoveOrCopy
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('final move failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('final move failed');

      // Original should have been renamed aside
      expect(mockFsPromises.rename).toHaveBeenCalledWith(
        '/original/path/video.mp4',
        '/original/path/video.mp4.partial.old',
      );
      // And restored on failure
      expect(mockFsPromises.rename).toHaveBeenCalledWith(
        '/original/path/video.mp4.partial.old',
        '/original/path/video.mp4',
      );
      // The .old file must NOT be deleted when the swap failed
      expect(mockFsPromises.unlink).not.toHaveBeenCalledWith('/original/path/video.mp4.partial.old');
    });

    it('should clean up staged .tmp and rethrow if renaming original aside fails', async () => {
      mockFileExists.mockResolvedValue(true);
      mockFsPromises.rename.mockRejectedValueOnce(new Error('rename aside failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('rename aside failed');

      // Only first fileMoveOrCopy (stage to tmp) should have been attempted
      expect(mockFileMoveOrCopy).toHaveBeenCalledTimes(1);
      // Staged tmp should be cleaned up
      expect(mockFsPromises.unlink).toHaveBeenCalledWith(
        '/original/path/video_transcoded.mkv.tmp',
      );
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

    it('should log rename-aside and final delete when applicable', async () => {
      mockFileExists.mockResolvedValue(true);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Renaming original file to: /original/path/video.mp4.partial.old',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Deleting renamed original file: /original/path/video.mp4.partial.old',
      );
    });
  });

  describe('Atomic Swap', () => {
    // A tiny in-memory filesystem: path -> inode. Optionally case-insensitive, like macOS APFS.
    let files: Map<string, number>;
    let caseInsensitive: boolean;
    let nextIno: number;
    let callOrder: string[];
    const key = (p: string) => (caseInsensitive ? p.toLowerCase() : p);
    const addFile = (p: string) => {
      files.set(key(p), nextIno);
      nextIno += 1;
    };
    const has = (p: string) => files.has(key(p));
    const moveEntry = (from: string, to: string) => {
      if (!has(from)) throw Object.assign(new Error(`ENOENT ${from}`), { code: 'ENOENT' });
      const ino = files.get(key(from)) as number;
      files.delete(key(from));
      files.set(key(to), ino);
    };

    beforeEach(() => {
      files = new Map();
      caseInsensitive = false;
      nextIno = 1;
      callOrder = [];
      addFile('/original/path/video.mp4');
      addFile('/working/path/video_transcoded.mkv');

      baseArgs.inputs = { atomicSwap: true };
      baseArgs.platform = 'linux';
      baseArgs.job = { jobId: 'job123' } as IpluginInputArgs['job'];

      mockFileExists.mockImplementation((p: string) => Promise.resolve(has(p)));
      mockFsPromises.stat.mockImplementation((p: string) => {
        if (!has(p)) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        return Promise.resolve({ dev: 1, ino: files.get(key(p)) });
      });
      mockFileMoveOrCopy.mockImplementation(({ sourcePath, destinationPath }) => {
        callOrder.push(`move:${sourcePath}->${destinationPath}`);
        moveEntry(sourcePath, destinationPath);
        return Promise.resolve(true);
      });
      mockFsPromises.rename.mockImplementation((from: string, to: string) => {
        callOrder.push(`rename:${from}->${to}`);
        moveEntry(from, to);
        return Promise.resolve();
      });
      mockFsPromises.unlink.mockImplementation((target: string) => {
        callOrder.push(`unlink:${target}`);
        files.delete(key(target));
        return Promise.resolve();
      });
    });

    const TMP = '/original/path/.tdarr-replace-job123.partial.tmp';

    it('should stage under a hidden name and replace the original with one rename', async () => {
      files.clear();
      nextIno = 1;
      addFile('/original/path/video.mp4');
      addFile('/working/path/video.mp4');
      inputFileObj._id = '/working/path/video.mp4';

      const result = await plugin(baseArgs);

      expect(callOrder).toEqual([
        `move:/working/path/video.mp4->${TMP}`,
        `rename:${TMP}->/original/path/video.mp4`,
      ]);
      expect(result.outputFileObj._id).toBe('/original/path/video.mp4');
      expect(files.get('/original/path/video.mp4')).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Atomically replaced /original/path/video.mp4');
    });

    it('should never rename the original aside', async () => {
      await plugin(baseArgs);

      expect(callOrder.some((c) => c.includes('.partial.old'))).toBe(false);
      expect(callOrder.some((c) => c.startsWith('rename:/original/path/video.mp4'))).toBe(false);
    });

    it('should delete the original after the swap when the name or container changed', async () => {
      const result = await plugin(baseArgs);

      expect(callOrder).toEqual([
        `move:/working/path/video_transcoded.mkv->${TMP}`,
        `rename:${TMP}->/original/path/video_transcoded.mkv`,
        'unlink:/original/path/video.mp4',
      ]);
      expect(result.outputFileObj._id).toBe('/original/path/video_transcoded.mkv');
      expect(Array.from(files.keys())).toEqual(['/original/path/video_transcoded.mkv']);
    });

    it('should keep the new file when the name differs only by case on a case-insensitive filesystem', async () => {
      caseInsensitive = true;
      files.clear();
      nextIno = 1;
      addFile('/original/path/video.MKV');
      addFile('/working/path/video.mkv');
      originalFileObj._id = '/original/path/video.MKV';
      inputFileObj._id = '/working/path/video.mkv';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/original/path/video.mkv');
      expect(callOrder.some((c) => c.startsWith('unlink:'))).toBe(false);
      expect(files.get('/original/path/video.mkv')).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Not deleting /original/path/video.MKV: it now resolves to the new file (case-insensitive filesystem?)',
      );
    });

    it('should do nothing when the working file is the original (changed in place)', async () => {
      inputFileObj._id = '/original/path/video.mp4';
      inputFileObj.file_size = 90;

      const result = await plugin(baseArgs);

      expect(callOrder).toEqual([]);
      expect(result.outputFileObj._id).toBe('/original/path/video.mp4');
      expect(has('/original/path/video.mp4')).toBe(true);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file is already in place, nothing to swap');
    });

    it('should not delete anything when the original no longer exists', async () => {
      files.delete('/original/path/video.mp4');

      await plugin(baseArgs);

      expect(callOrder.some((c) => c.startsWith('unlink:'))).toBe(false);
      expect(has('/original/path/video_transcoded.mkv')).toBe(true);
    });

    it('should leave the original untouched and clean up if the swap fails', async () => {
      mockFsPromises.rename.mockImplementation((from: string, to: string) => {
        callOrder.push(`rename:${from}->${to}`);
        return Promise.reject(new Error('EACCES'));
      });

      await expect(plugin(baseArgs)).rejects.toThrow('EACCES');

      expect(callOrder).toEqual([
        `move:/working/path/video_transcoded.mkv->${TMP}`,
        `rename:${TMP}->/original/path/video_transcoded.mkv`,
        `unlink:${TMP}`,
      ]);
      expect(files.get('/original/path/video.mp4')).toBe(1);
    });

    it('should clean up a partial staged file and leave the original if staging fails', async () => {
      mockFileMoveOrCopy.mockImplementation(({ destinationPath }) => {
        addFile(destinationPath); // partial copy left behind
        return Promise.reject(new Error('copy failed'));
      });

      await expect(plugin(baseArgs)).rejects.toThrow('copy failed');

      expect(mockFsPromises.rename).not.toHaveBeenCalled();
      expect(mockFsPromises.unlink).toHaveBeenCalledWith(TMP);
      expect(has(TMP)).toBe(false);
      expect(files.get('/original/path/video.mp4')).toBe(1);
    });

    it('should log, not throw, if the old original cannot be deleted', async () => {
      mockFsPromises.unlink.mockRejectedValue(new Error('EPERM'));

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/original/path/video_transcoded.mkv');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete original file /original/path/video.mp4'),
      );
    });

    it('should use a unique fallback name when no job id is available', async () => {
      baseArgs.job = undefined as unknown as IpluginInputArgs['job'];

      await plugin(baseArgs);

      expect(callOrder[0]).toMatch(/->\/original\/path\/\.tdarr-replace-\d+-[a-z0-9]+\.partial\.tmp$/);
    });

    it('should use the default replace on Windows', async () => {
      baseArgs.platform = 'win32';

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Atomic swap is not supported on Windows, using the default replace',
      );
      expect(callOrder).toContain('rename:/original/path/video.mp4->/original/path/video.mp4.partial.old');
    });

    it('should detect Windows from process.platform when args.platform is not set', async () => {
      baseArgs.platform = undefined as unknown as string;
      const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform') as PropertyDescriptor;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      try {
        await plugin(baseArgs);
      } finally {
        Object.defineProperty(process, 'platform', realPlatform);
      }

      expect(callOrder).toContain('rename:/original/path/video.mp4->/original/path/video.mp4.partial.old');
    });

    it('should keep the default replace when the switch is off', async () => {
      baseArgs.inputs = { atomicSwap: false };

      await plugin(baseArgs);

      expect(callOrder[0]).toBe('move:/working/path/video_transcoded.mkv->/original/path/video_transcoded.mkv.tmp');
    });

    it('should still skip unchanged files', async () => {
      baseArgs.inputFileObj = originalFileObj;

      await plugin(baseArgs);

      expect(callOrder).toEqual([]);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has not changed, no need to replace file');
    });
  });
});
