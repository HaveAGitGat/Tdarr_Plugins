import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Move To Original Directory',
  description: 'Move working file original directory.',
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
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const fileName = getFileName(args.inputFileObj._id);
  const container = getContainer(args.inputFileObj._id);
  const outputDir = getFileAbosluteDir(args.originalLibraryFile._id);

  const ouputFilePath = `${outputDir}/${fileName}.${container}`;

  if (args.inputFileObj._id === ouputFilePath) {
    args.jobLog('Input and output path are the same, skipping move.');

    return {
      outputFileObj: {
        _id: args.inputFileObj._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: args.inputFileObj._id,
    destinationPath: ouputFilePath,
    args,
  });

  return {
    outputFileObj: {
      _id: ouputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
