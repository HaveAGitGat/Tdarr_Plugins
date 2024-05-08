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
const details = (): IpluginDetails => ({
  name: 'Rename File',
  description: 'Rename a file',
  style: {
    borderColor: 'green',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'File Rename',
      name: 'fileRename',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '${fileName}_720p.${container}',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
      tooltip: 'Specify file to check using templating e.g. ${fileName}_720p.${container}',
    },
  ],
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

  const fileName = getFileName(args.inputFileObj._id);

  let newName = String(args.inputs.fileRename).trim();
  newName = newName.replace(/\${fileName}/g, fileName);
  newName = newName.replace(/\${container}/g, getContainer(args.inputFileObj._id));

  const fileDir = getFileAbosluteDir(args.inputFileObj._id);
  const newPath = `${fileDir}/${newName}`;

  if (args.inputFileObj._id === newPath) {
    args.jobLog('Input and output path are the same, skipping rename.');

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
