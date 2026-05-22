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
});
