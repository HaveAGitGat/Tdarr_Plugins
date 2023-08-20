import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Unpack File',
  description: 'Unpack a file',
  style: {
    borderColor: 'green',
    opacity: 0.5,
  },
  tags: '',
  isStartPlugin: false,
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      name: 'target_codec',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc',
          // 'vp9',
          'h264',
          // 'vp8',
        ],
      },
      tooltip: 'Specify the codec to use',
    },
  ],
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

  const currentPath = args.inputFileObj._id;
  const newPath = getNewPath(args.originalLibraryFile._id, currentPath);
  const newPathTmp = `${newPath}.tmp`;

  args.jobLog(JSON.stringify({
    currentPath,
    newPath,
    newPathTmp,
  }));

  await new Promise((resolve) => setTimeout(resolve, 2000));

  fs.renameSync(currentPath, newPathTmp);

  if (fs.existsSync(newPath)) {
    fs.unlinkSync(newPath);
  }

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
