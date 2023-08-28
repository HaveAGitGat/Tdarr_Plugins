import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Replace Original File',
  description: 'Replace the original file',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
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

const getNewPath = (originalPath:string, tempPath:string) => {
  const tempPathParts = tempPath.split('.');
  const container = tempPathParts[tempPathParts.length - 1];

  const originalPathParts = originalPath.split('.');

  originalPathParts[originalPathParts.length - 1] = container;
  return originalPathParts.join('.');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const fs = require('fs');
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
  const newPath = getNewPath(args.originalLibraryFile._id, currentPath);
  const newPathTmp = `${newPath}.tmp`;

  args.jobLog(JSON.stringify({
    currentPath,
    newPath,
    newPathTmp,
  }));

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // delete original file
  if (fs.existsSync(args.originalLibraryFile._id)) {
    fs.unlinkSync(args.originalLibraryFile._id);
  }

  // delete temp file
  if (fs.existsSync(newPath)) {
    fs.unlinkSync(newPath);
  }

  fs.renameSync(currentPath, newPathTmp);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  fs.renameSync(newPathTmp, newPath);

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
