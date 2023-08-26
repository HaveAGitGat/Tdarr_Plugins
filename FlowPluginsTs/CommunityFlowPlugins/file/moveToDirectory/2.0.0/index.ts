import { promises as fs } from 'fs';
import { getContainer, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Move To Directory',
  description: 'Move working file to directory.',
  style: {
    borderColor: 'green',
  },
  tags: '',

  isStartPlugin: false,
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      name: 'outputDirectory',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify ouput directory',
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
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const originalFileName = getFileName(args.originalLibraryFile._id);
  const newContainer = getContainer(args.inputFileObj._id);

  const outputPath = `${args.inputs.outputDirectory}/${originalFileName}.${newContainer}`;

  await fs.rename(args.inputFileObj._id, outputPath);

  return {
    outputFileObj: {
      _id: outputPath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
