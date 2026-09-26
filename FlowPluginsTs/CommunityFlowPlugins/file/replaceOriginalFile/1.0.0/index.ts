import { promises as fsp } from 'fs';
import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  fileExists,
  getContainer, getFileAbsoluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Replace Original File',
  description: `
  Replace the original file with the 'working' file passed into this plugin.
  If the file hasn't changed then no action is taken.
  Note: The 'working' filename and container will replace the original filename and container.
  `,
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      label: 'Atomic Swap',
      name: 'atomicSwap',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: `Off (default): the working file is staged next to the original as <name>.tmp, the
original is renamed aside to .partial.old, and the new file is then moved into place.
For those few seconds the original path does not exist.

On: the working file is staged under a hidden name that is not derived from the
original (.tdarr-replace-<jobId>.partial.tmp), then a single rename replaces the original.
On local Linux/macOS filesystems the original path always exists, and if anything fails
the original is untouched. A crash mid-copy can leave that hidden file behind.

Use this when other software watches the library while Tdarr works, e.g. Sonarr/Radarr
rescans, which have been seen to treat a briefly missing file as deleted and remove its
"extra" files (subtitles, artwork, and the staged <name>.tmp).

As with the default, the new file keeps the working file's owner and permissions.
On Windows, rename cannot replace an existing file, so the default behaviour is used.`,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type FileId = { dev: number, ino: number };

const getFileId = async (filePath: string): Promise<FileId | null> => {
  try {
    const { dev, ino } = await fsp.stat(filePath);
    return { dev, ino };
  } catch (err) {
    return null;
  }
};

// Treat unknown (0) inode numbers as "same file" so we err on the side of not deleting.
const sameFile = (a: FileId, b: FileId): boolean => a.dev === b.dev && (a.ino === b.ino || a.ino === 0 || b.ino === 0);

// Stage under a hidden name, then replace the original with one rename(). On local POSIX
// filesystems rename() over an existing file is atomic, so the original path never disappears,
// and any failure before it leaves the original untouched.
const atomicReplace = async ({
  args,
  currentPath,
  originalPath,
  newPath,
  originalFolder,
}: {
  args: IpluginInputArgs,
  currentPath: string,
  originalPath: string,
  newPath: string,
  originalFolder: string,
}): Promise<void> => {
  // The working file already is the destination (e.g. edited in place): there is nothing to move,
  // and staging it would take the only copy out of the library.
  if (currentPath === newPath || currentPath === originalPath) {
    args.jobLog('Working file is already in place, nothing to swap');
    return;
  }

  const suffix = args.job?.jobId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // Includes `.partial`, like the default path's sentinel, so Tdarr's folder watcher ignores it.
  const hiddenTmp = `${originalFolder}/.tdarr-replace-${suffix}.partial.tmp`;

  args.jobLog(JSON.stringify({
    currentPath,
    newPath,
    hiddenTmp,
  }));

  // Identity of the original before the swap. On a case-insensitive filesystem a name that differs
  // only by case (video.MKV -> video.mkv) is the same directory entry, so after the rename
  // originalPath resolves to the NEW file and must not be deleted.
  const originalIdBefore = newPath !== originalPath ? await getFileId(originalPath) : null;

  await sleep(2000);

  try {
    await fileMoveOrCopy({
      operation: 'move',
      sourcePath: currentPath,
      destinationPath: hiddenTmp,
      args,
    });
  } catch (err) {
    args.jobLog(`Failed to stage ${currentPath} as ${hiddenTmp}, original untouched: ${JSON.stringify(err)}`);
    if (await fileExists(hiddenTmp)) {
      try {
        await fsp.unlink(hiddenTmp);
      } catch (cleanupErr) {
        args.jobLog(`Failed to clean up temporary file ${hiddenTmp}: ${JSON.stringify(cleanupErr)}`);
      }
    }
    throw err;
  }

  try {
    await fsp.rename(hiddenTmp, newPath);
  } catch (err) {
    args.jobLog(`Failed to rename ${hiddenTmp} to ${newPath}, original untouched: ${JSON.stringify(err)}`);
    try {
      await fsp.unlink(hiddenTmp);
    } catch (cleanupErr) {
      args.jobLog(`Failed to clean up temporary file ${hiddenTmp}: ${JSON.stringify(cleanupErr)}`);
    }
    throw err;
  }
  args.jobLog(`Atomically replaced ${newPath}`);

  // The name or container changed, so the new file did not overwrite the original: remove the
  // original, but only if originalPath is still the same file it was before and not the new one.
  if (originalIdBefore) {
    const originalIdAfter = await getFileId(originalPath);
    const newId = await getFileId(newPath);
    if (
      originalIdAfter
      && newId
      && sameFile(originalIdAfter, originalIdBefore)
      && !sameFile(originalIdAfter, newId)
    ) {
      args.jobLog(`Deleting original file: ${originalPath}`);
      try {
        await fsp.unlink(originalPath);
      } catch (err) {
        args.jobLog(`Failed to delete original file ${originalPath}: ${JSON.stringify(err)}`);
      }
    } else if (originalIdAfter) {
      args.jobLog(`Not deleting ${originalPath}: it now resolves to the new file (case-insensitive filesystem?)`);
    }
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  if (
    args.inputFileObj._id === args.originalLibraryFile._id
    && args.inputFileObj.file_size === args.originalLibraryFile.file_size
  ) {
    args.jobLog('File has not changed, no need to replace file');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog('File has changed, replacing original file');

  const currentPath = args.inputFileObj._id;
  const originalPath = args.originalLibraryFile._id;
  const orignalFolder = getFileAbsoluteDir(originalPath);
  const fileName = getFileName(args.inputFileObj._id);
  const container = getContainer(args.inputFileObj._id);

  const newPath = `${orignalFolder}/${fileName}.${container}`;

  if (args.inputs.atomicSwap === true) {
    const platform = args.platform || process.platform;
    if (platform !== 'win32') {
      await atomicReplace({
        args,
        currentPath,
        originalPath,
        newPath,
        originalFolder: orignalFolder,
      });

      return {
        outputFileObj: {
          _id: newPath,
        },
        outputNumber: 1,
        variables: args.variables,
      };
    }
    args.jobLog('Atomic swap is not supported on Windows, using the default replace');
  }

  const newPathTmp = `${newPath}.tmp`;
  // Suffix includes `.partial` so Tdarr's folder watcher ignores this sentinel if a crash
  // between rename-aside and final move leaves it on disk.
  const originalPathOld = `${originalPath}.partial.old`;

  args.jobLog(JSON.stringify({
    currentPath,
    newPath,
    newPathTmp,
    originalPathOld,
  }));

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 1: move the working/cache file into the original folder as .tmp
  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: currentPath,
    destinationPath: newPathTmp,
    args,
  });

  const originalFileExists = await fileExists(originalPath);
  const currentFileIsNotOriginal = originalPath !== currentPath;
  const shouldRenameOriginal = originalFileExists && currentFileIsNotOriginal;

  args.jobLog(JSON.stringify({
    originalFileExists,
    currentFileIsNotOriginal,
  }));

  // Step 2: rename the original file aside (non-destructive) so it can be restored on failure
  let originalRenamed = false;
  if (shouldRenameOriginal) {
    // Clear any stale .old left by a prior failed run so fsp.rename succeeds on Windows (where
    // rename does not overwrite an existing target).
    if (await fileExists(originalPathOld)) {
      args.jobLog(`Removing stale file at ${originalPathOld}`);
      try {
        await fsp.unlink(originalPathOld);
      } catch (staleErr) {
        args.jobLog(`Failed to remove stale file ${originalPathOld}: ${JSON.stringify(staleErr)}`);
      }
    }

    args.jobLog(`Renaming original file to: ${originalPathOld}`);
    try {
      await fsp.rename(originalPath, originalPathOld);
      originalRenamed = true;
    } catch (err) {
      args.jobLog(`Failed to rename original file aside: ${JSON.stringify(err)}`);
      // Best-effort cleanup of the staged .tmp file so we don't leave orphans
      try {
        await fsp.unlink(newPathTmp);
      } catch (cleanupErr) {
        args.jobLog(`Failed to clean up temporary file ${newPathTmp}: ${JSON.stringify(cleanupErr)}`);
      }
      throw err;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 3: put the new file in place; if it fails, restore the original from .old
  try {
    await fileMoveOrCopy({
      operation: 'move',
      sourcePath: newPathTmp,
      destinationPath: newPath,
      args,
    });
  } catch (err) {
    args.jobLog(`Failed to move ${newPathTmp} to ${newPath}: ${JSON.stringify(err)}`);
    if (originalRenamed) {
      args.jobLog(`Restoring original file from ${originalPathOld}`);
      try {
        await fsp.rename(originalPathOld, originalPath);
      } catch (restoreErr) {
        args.jobLog(`Failed to restore original file: ${JSON.stringify(restoreErr)}`);
      }
    }
    throw err;
  }

  // Step 4: new file is in place; remove the renamed-aside original
  if (originalRenamed) {
    args.jobLog(`Deleting renamed original file: ${originalPathOld}`);
    try {
      await fsp.unlink(originalPathOld);
    } catch (err) {
      args.jobLog(`Failed to delete renamed original file ${originalPathOld}: ${JSON.stringify(err)}`);
    }
  }

  return {
    outputFileObj: {
      _id: newPath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
