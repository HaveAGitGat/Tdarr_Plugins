import { promises as fsp } from 'fs';

import { getFileSize } from './fileUtils';
import { IpluginInputArgs } from './interfaces/interfaces';

interface Imove {
    sourcePath:string,
    destinationPath:string,
    sourceFileSize:number,
    args:IpluginInputArgs,
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

const cleanSourceFile = async ({
  args,
  sourcePath,
}:{
    args:IpluginInputArgs,
    sourcePath: string,
}) => {
  try {
    args.jobLog(`Deleting source file ${sourcePath}`);
    await fsp.unlink(sourcePath);
  } catch (err) {
    args.jobLog(`Failed to delete source file ${sourcePath}: ${JSON.stringify(err)}`);
  }
};

const fileMoveOrCopy = async ({
  operation,
  sourcePath,
  destinationPath,
  args,
}: {
    operation: 'move' | 'copy',
    sourcePath: string,
    destinationPath: string,
    args: IpluginInputArgs,
}):Promise<boolean> => {
  args.jobLog('Calculating cache file size in bytes');

  const sourceFileSize = await getSizeBytes(sourcePath);
  args.jobLog(`${sourceFileSize}`);

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
      });
    }

    return true;
  }

  throw new Error(`Failed to ${operation} file`);
};

export default fileMoveOrCopy;
