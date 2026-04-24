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
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

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
