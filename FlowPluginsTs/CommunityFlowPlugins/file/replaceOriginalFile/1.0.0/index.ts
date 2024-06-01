import { promises as fsp } from 'fs';
import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  fileExists,
  getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Replace Original File',
  description: 'Replace the original file. If the file hasn\'t changed then no action is taken.',
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
  const orignalFolder = getFileAbosluteDir(args.originalLibraryFile._id);
  const fileName = getFileName(args.inputFileObj._id);
  const container = getContainer(args.inputFileObj._id);

  const newPath = `${orignalFolder}/${fileName}.${container}`;
  const newPathTmp = `${newPath}.tmp`;

  args.jobLog(JSON.stringify({
    currentPath,
    newPath,
    newPathTmp,
  }));

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: currentPath,
    destinationPath: newPathTmp,
    args,
  });

  // delete original file
  if (
    await fileExists(args.originalLibraryFile._id)
    && args.originalLibraryFile._id !== currentPath
  ) {
    args.jobLog(`Deleting original file:${args.originalLibraryFile._id}`);
    await fsp.unlink(args.originalLibraryFile._id);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: newPathTmp,
    destinationPath: newPath,
    args,
  });

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
