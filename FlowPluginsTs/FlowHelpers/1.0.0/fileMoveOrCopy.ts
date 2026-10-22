import { promises as fsp } from 'fs';

import { getFileSize } from './fileUtils';
import { IpluginInputArgs } from './interfaces/interfaces';

interface Imove {
    sourcePath:string,
    destinationPath:string,
    sourceFileSize:number,
    args:IpluginInputArgs,
  }

interface IFileMoveOrCopy {
    operation: 'move' | 'copy',
    sourcePath: string,
    destinationPath: string,
    args: IpluginInputArgs,
    requireSourceDeletion?: boolean,
  }

const getSizeBytes = async (fPath: string): Promise<number> => {
  let size = 0;
  try {
    size = await getFileSize(fPath);
  } catch (err) {
    // err
  }
  return size;
};

const compareOldNew = ({
  sourceFileSize,
  destinationSize,
  args,
}:{
    sourceFileSize:number,
    destinationSize:number,
    args:IpluginInputArgs,
  }):void => {
  if (destinationSize !== sourceFileSize) {
    args.jobLog(`After move/copy, destination file of size ${destinationSize} does not match`
      + ` cache file of size ${sourceFileSize}`);
  } else {
    args.jobLog(`After move/copy, destination file of size ${destinationSize} does match`
      + ` cache file of size ${sourceFileSize}`);
  }
};

// fsync errors meaning the file system cannot sync, rather than that the data failed to write
const syncNotSupportedCodes = ['EINVAL', 'ENOTSUP', 'ENOSYS'];

// ncp resolves before the file is closed, and network shares can drop data still being written
// if the process then exits, so flush it and report write errors instead of trusting the size
const syncDestination = async (destinationPath: string, args: IpluginInputArgs): Promise<boolean> => {
  let handle: fsp.FileHandle;
  try {
    handle = await fsp.open(destinationPath, 'r+');
  } catch (err) {
    args.jobLog(`Unable to open destination file to sync, skipping sync: ${JSON.stringify(err)}`);
    return true;
  }

  try {
    await handle.sync();
    return true;
  } catch (err) {
    if (syncNotSupportedCodes.includes((err as NodeJS.ErrnoException).code || '')) {
      args.jobLog(`Destination file sync not supported, skipping sync: ${JSON.stringify(err)}`);
      return true;
    }
    args.jobLog(`File sync error: ${JSON.stringify(err)}`);
    return false;
  } finally {
    await handle.close().catch(() => undefined);
  }
};

const tryMove = async ({
  sourcePath,
  destinationPath,
  sourceFileSize,
  args,
}:Imove):Promise<boolean> => {
  args.jobLog(`Attempting move from ${sourcePath} to ${destinationPath}, method 1`);

  let error = false;
  try {
    await fsp.rename(sourcePath, destinationPath);
  } catch (err) {
    error = true;
    args.jobLog(`File move error: ${JSON.stringify(err)}`);
  }

  const destinationSize = await getSizeBytes(destinationPath);
  compareOldNew({
    sourceFileSize,
    destinationSize,
    args,
  });

  if (error || destinationSize !== sourceFileSize) {
    return false;
  }

  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tryMvdir = async ({
  sourcePath,
  destinationPath,
  sourceFileSize,
  args,
}:Imove):Promise<boolean> => {
  args.jobLog(`Attempting move from ${sourcePath} to ${destinationPath}, method 2`);

  let error = false;
  await new Promise((resolve) => {
    // fs-extra and move-file don't work when destination is on windows root of drive
    // mvdir will try to move else fall back to copy/unlink
    // potential bug on unraid
    args.deps.mvdir(sourcePath, destinationPath, { overwrite: true })
      .then(() => {
        resolve(true);
      }).catch((err: Error) => {
        error = true;
        args.jobLog(`File move error: ${err}`);
        resolve(err);
      });
  });

  const destinationSize = await getSizeBytes(destinationPath);
  compareOldNew({
    sourceFileSize,
    destinationSize,
    args,
  });

  if (error || destinationSize !== sourceFileSize) {
    return false;
  }

  return true;
};

// Keep in e.g. https://github.com/HaveAGitGat/Tdarr/issues/858
const tyNcp = async ({
  sourcePath,
  destinationPath,
  sourceFileSize,
  args,
}:Imove):Promise<boolean> => {
  // added in 2.14.01
  if (args.deps.ncp) {
    args.jobLog(`Attempting copy from ${sourcePath} to ${destinationPath} , method 1`);

    let error = false;
    await new Promise((resolve) => {
      args.deps.ncp(sourcePath, destinationPath, (err: Error) => {
        if (err) {
          error = true;
          args.jobLog(`File copy error: ${err}`);
          resolve(err);
        } else {
          resolve(true);
        }
      });
    });

    if (!error) {
      error = !await syncDestination(destinationPath, args);
    }

    const destinationSize = await getSizeBytes(destinationPath);
    compareOldNew({
      sourceFileSize,
      destinationSize,
      args,
    });

    if (error || destinationSize !== sourceFileSize) {
      return false;
    }

    return true;
  }

  return false;
};

const tryNormalCopy = async ({
  sourcePath,
  destinationPath,
  sourceFileSize,
  args,
}:Imove):Promise<boolean> => {
  args.jobLog(`Attempting copy from ${sourcePath} to ${destinationPath} , method 2`);

  let error = false;
  try {
    await fsp.copyFile(sourcePath, destinationPath);
  } catch (err) {
    error = true;
    args.jobLog(`File copy error: ${JSON.stringify(err)}`);
  }

  if (!error) {
    error = !await syncDestination(destinationPath, args);
  }

  const destinationSize = await getSizeBytes(destinationPath);
  compareOldNew({
    sourceFileSize,
    destinationSize,
    args,
  });

  if (error || destinationSize !== sourceFileSize) {
    return false;
  }

  return true;
};

// A copy to another file system can take minutes. With "Auto cancel stalled workers" on, Tdarr
// cancels a worker whose percentage has not changed between two checks (every 300 s by default),
// so a silent copy of a large file can be cancelled at the end of a long job. Report the share of
// bytes copied, at once and then every 15 s. A copy that is genuinely hung stays flat and is still
// cancelled.
const startCopyProgress = ({
  destinationPath,
  sourceFileSize,
  args,
}:{
    destinationPath: string,
    sourceFileSize: number,
    args: IpluginInputArgs,
}): () => void => {
  if (typeof args.updateWorker !== 'function') {
    return () => undefined;
  }
  let last = 0;
  const report = async () => {
    try {
      const copied = await getSizeBytes(destinationPath);
      last = Math.max(last, Math.min(99.99, (copied / sourceFileSize) * 100));
      args.updateWorker({ percentage: Math.round(last * 100) / 100 });
    } catch (err) {
      // progress is best-effort
    }
  };
  void report();
  const interval = setInterval(report, 15000);
  return () => clearInterval(interval);
};

const cleanSourceFile = async ({
  args,
  sourcePath,
  requireSourceDeletion,
}:{
    args:IpluginInputArgs,
    sourcePath: string,
    requireSourceDeletion: boolean,
}): Promise<void> => {
  try {
    args.jobLog(`Deleting source file ${sourcePath}`);
    await fsp.unlink(sourcePath);
  } catch (err) {
    const message = `Failed to delete source file ${sourcePath}: ${JSON.stringify(err)}`;
    args.jobLog(message);
    if (requireSourceDeletion) {
      throw new Error(message);
    }
  }
};

const fileMoveOrCopy = async ({
  operation,
  sourcePath,
  destinationPath,
  args,
  requireSourceDeletion = false,
}: IFileMoveOrCopy):Promise<boolean> => {
  args.jobLog('Calculating cache file size in bytes');

  const sourceFileSize = await getSizeBytes(sourcePath);
  args.jobLog(`${sourceFileSize}`);

  if (sourceFileSize === 0) {
    throw new Error(`Source file ${sourcePath} has size 0 or does not exist, aborting ${operation}`);
  }

  if (operation === 'move') {
    const moved = await tryMove({
      sourcePath,
      destinationPath,
      args,
      sourceFileSize,
    });

    if (moved) {
      return true;
    }

    // disable: https://github.com/HaveAGitGat/Tdarr/issues/885
    // const mvdird = await tryMvdir({
    //   sourcePath,
    //   destinationPath,
    //   args,
    //   sourceFileSize,
    // });

    // if (mvdird) {
    //   return true;
    // }

    args.jobLog('Failed to move file, trying copy');
  }

  const stopCopyProgress = startCopyProgress({
    destinationPath,
    sourceFileSize,
    args,
  });

  try {
    const ncpd = await tyNcp({
      sourcePath,
      destinationPath,
      args,
      sourceFileSize,
    });

    if (ncpd) {
      if (operation === 'move') {
        await cleanSourceFile({
          args,
          sourcePath,
          requireSourceDeletion,
        });
      }

      return true;
    }

    const copied = await tryNormalCopy({
      sourcePath,
      destinationPath,
      args,
      sourceFileSize,
    });

    if (copied) {
      if (operation === 'move') {
        await cleanSourceFile({
          args,
          sourcePath,
          requireSourceDeletion,
        });
      }

      return true;
    }
  } finally {
    stopCopyProgress();
  }

  throw new Error(`Failed to ${operation} file`);
};

export default fileMoveOrCopy;
