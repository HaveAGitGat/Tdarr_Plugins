import fs from 'fs';
import os from 'os';
import path from 'path';

import fileMoveOrCopy from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy';
import { IpluginInputArgs } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

describe('fileMoveOrCopy', () => {
  let tmpDir = '';
  let sourcePath = '';
  let destinationPath = '';
  let args: IpluginInputArgs;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fileMoveOrCopy-test-'));
    sourcePath = path.join(tmpDir, 'source.mkv');
    destinationPath = path.join(tmpDir, 'destination.mkv');
    fs.writeFileSync(sourcePath, Buffer.from('sample video data'));

    args = {
      deps: {},
      jobLog: jest.fn(),
    } as unknown as IpluginInputArgs;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should keep legacy best-effort cleanup behavior by default', async () => {
    jest.spyOn(fs.promises, 'rename').mockRejectedValue({
      code: 'EACCES',
      syscall: 'rename',
      path: sourcePath,
      dest: destinationPath,
    });
    jest.spyOn(fs.promises, 'unlink').mockRejectedValue({
      code: 'EACCES',
      syscall: 'unlink',
      path: sourcePath,
    });

    await expect(fileMoveOrCopy({
      operation: 'move',
      sourcePath,
      destinationPath,
      args,
    })).resolves.toBe(true);

    expect(args.jobLog).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to delete source file ${sourcePath}`),
    );
    expect(fs.existsSync(destinationPath)).toBe(true);
  });

  it('should reject a strict fallback move when the copied source cannot be deleted', async () => {
    jest.spyOn(fs.promises, 'rename').mockRejectedValue({
      code: 'EACCES',
      syscall: 'rename',
      path: sourcePath,
      dest: destinationPath,
    });
    jest.spyOn(fs.promises, 'unlink').mockRejectedValue({
      code: 'EACCES',
      syscall: 'unlink',
      path: sourcePath,
    });

    await expect(fileMoveOrCopy({
      operation: 'move',
      sourcePath,
      destinationPath,
      args,
      requireSourceDeletion: true,
    })).rejects.toThrow(`Failed to delete source file ${sourcePath}`);

    expect(args.jobLog).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to delete source file ${sourcePath}`),
    );
    expect(fs.existsSync(destinationPath)).toBe(true);
  });

  describe('destination sync after copy', () => {
    const mockSync = (sync: jest.Mock) => jest.spyOn(fs.promises, 'open').mockResolvedValue({
      sync,
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as fs.promises.FileHandle);

    beforeEach(() => {
      jest.spyOn(fs.promises, 'rename').mockRejectedValue({ code: 'EXDEV', syscall: 'rename' });
      args.deps.ncp = jest.fn((src: string, dest: string, cb: (err?: Error) => void) => {
        fs.copyFileSync(src, dest);
        cb();
      });
    });

    it('should sync the destination before reporting a copy as complete', async () => {
      const sync = jest.fn().mockResolvedValue(undefined);
      const openSpy = mockSync(sync);

      await expect(fileMoveOrCopy({
        operation: 'move',
        sourcePath,
        destinationPath,
        args,
      })).resolves.toBe(true);

      expect(openSpy).toHaveBeenCalledWith(destinationPath, 'r+');
      expect(sync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync(sourcePath)).toBe(false);
    });

    it('should fail the copy and keep the source when the destination cannot be synced', async () => {
      mockSync(jest.fn().mockRejectedValue({ code: 'EIO', syscall: 'fsync' }));

      await expect(fileMoveOrCopy({
        operation: 'move',
        sourcePath,
        destinationPath,
        args,
      })).rejects.toThrow('Failed to move file');

      expect(args.jobLog).toHaveBeenCalledWith(expect.stringContaining('File sync error'));
      expect(fs.existsSync(sourcePath)).toBe(true);
    });

    it('should skip the sync when the file system does not support it', async () => {
      mockSync(jest.fn().mockRejectedValue({ code: 'EINVAL', syscall: 'fsync' }));

      await expect(fileMoveOrCopy({
        operation: 'copy',
        sourcePath,
        destinationPath,
        args,
      })).resolves.toBe(true);

      expect(args.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Destination file sync not supported'),
      );
    });

    it('should skip the sync when the destination cannot be opened for writing', async () => {
      jest.spyOn(fs.promises, 'open').mockRejectedValue({ code: 'EACCES', syscall: 'open' });

      await expect(fileMoveOrCopy({
        operation: 'copy',
        sourcePath,
        destinationPath,
        args,
      })).resolves.toBe(true);

      expect(args.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Unable to open destination file to sync'),
      );
    });
  });
});
