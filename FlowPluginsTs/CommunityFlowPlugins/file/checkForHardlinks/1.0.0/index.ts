import { promises as fsp } from 'fs';

import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check For Hardlinks',
  description: 'Check if the working file has hardlinks (nlink > 1). Useful for detecting files that share'
  + ' data blocks on disk, allowing you to route hardlinked files differently in your flow.',
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faLink',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File has hardlinks',
    },
    {
      number: 2,
      tooltip: 'File does not have hardlinks',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const filePath = args.inputFileObj._id;

  args.jobLog(`Checking hardlinks for: ${filePath}`);

  const stat = await fsp.stat(filePath);
  const { nlink } = stat;

  args.jobLog(`File has ${nlink} link(s)`);

  if (nlink > 1) {
    args.jobLog('File has hardlinks, routing to output 1');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog('File does not have hardlinks, routing to output 2');
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
