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

  describe('copy progress', () => {
    let ticks: (() => Promise<void>)[];
    let updateWorker: jest.Mock;
    // The first report is sent without waiting; let it land before the copy writes anything.
    const firstReport = async () => {
      while (updateWorker.mock.calls.length === 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setImmediate(resolve));
      }
    };
    const percentages = () => updateWorker.mock.calls.map(([o]) => (o as { percentage: number }).percentage);

    beforeEach(() => {
      ticks = [];
      updateWorker = jest.fn();
      args.updateWorker = updateWorker;
      fs.writeFileSync(sourcePath, Buffer.alloc(1000, 1));
      jest.spyOn(global, 'setInterval').mockImplementation(((cb: () => Promise<void>) => {
        ticks.push(cb);
        return 1 as unknown as NodeJS.Timeout;
      }) as unknown as typeof setInterval);
      jest.spyOn(global, 'clearInterval').mockImplementation(() => undefined);
      jest.spyOn(fs.promises, 'rename').mockRejectedValue({ code: 'EXDEV', syscall: 'rename' });
    });

    it('should report the share of bytes copied while a cross-device move copies', async () => {
      args.deps.ncp = jest.fn(async (src: string, dest: string, cb: (err?: Error) => void) => {
        await firstReport();
        fs.writeFileSync(dest, Buffer.alloc(250, 1));
        await ticks[0]();
        fs.writeFileSync(dest, Buffer.alloc(900, 1));
        await ticks[0]();
        fs.copyFileSync(src, dest);
        cb();
      });

      await expect(fileMoveOrCopy({
        operation: 'move',
        sourcePath,
        destinationPath,
        args,
      })).resolves.toBe(true);

      expect(percentages()).toEqual([0, 25, 90]);
      expect(ticks).toHaveLength(1);
      expect(global.clearInterval).toHaveBeenCalledWith(1);
    });

    it('should stay flat while a copy is hung, so a stalled worker can still be cancelled', async () => {
      args.deps.ncp = jest.fn(async (src: string, dest: string, cb: (err?: Error) => void) => {
        await firstReport();
        fs.writeFileSync(dest, Buffer.alloc(400, 1));
        await ticks[0]();
        await ticks[0]();
        fs.copyFileSync(src, dest);
        cb();
      });

      await fileMoveOrCopy({
        operation: 'copy',
        sourcePath,
        destinationPath,
        args,
      });

      expect(percentages()).toEqual([0, 40, 40]);
    });

    it('should stop reporting when every copy method fails', async () => {
      args.deps.ncp = jest.fn((src: string, dest: string, cb: (err?: Error) => void) => cb(new Error('ncp failed')));
      jest.spyOn(fs.promises, 'copyFile').mockRejectedValue({ code: 'EIO', syscall: 'copyfile' });

      await expect(fileMoveOrCopy({
        operation: 'move',
        sourcePath,
        destinationPath,
        args,
      })).rejects.toThrow('Failed to move file');

      expect(global.clearInterval).toHaveBeenCalledWith(1);
    });

    it('should not report progress for a plain rename', async () => {
      (fs.promises.rename as jest.Mock).mockRestore();

      await fileMoveOrCopy({
        operation: 'move',
        sourcePath,
        destinationPath,
        args,
      });

      expect(updateWorker).not.toHaveBeenCalled();
      expect(global.setInterval).not.toHaveBeenCalled();
    });

    it('should copy normally when updateWorker is unavailable', async () => {
      delete (args as Partial<IpluginInputArgs>).updateWorker;

      await expect(fileMoveOrCopy({
        operation: 'copy',
        sourcePath,
        destinationPath,
        args,
      })).resolves.toBe(true);

      expect(global.setInterval).not.toHaveBeenCalled();
    });
  });
});
