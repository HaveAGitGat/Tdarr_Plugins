import { promises as fs } from 'fs';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Delete File',
  description: 'Delete the working file or original file.',
  style: {
    borderColor: 'red',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faTrash',
  inputs: [
    {
      label: 'File To Delete',
      name: 'fileToDelete',
      type: 'string',
      defaultValue: 'workingFile',
      inputUI: {
        type: 'dropdown',
        options: [
          'workingFile',
          'originalFile',
        ],
      },
      tooltip: 'Specify the file to delete',
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

  const fileToDelete = String(args.inputs.fileToDelete);

  if (fileToDelete === 'workingFile') {
    args.jobLog(`Deleting working file ${args.inputFileObj._id}`);
    await fs.unlink(args.inputFileObj._id);
  } else if (fileToDelete === 'originalFile') {
    args.jobLog(`Deleting original file ${args.originalLibraryFile._id}`);
    await fs.unlink(args.originalLibraryFile._id);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
