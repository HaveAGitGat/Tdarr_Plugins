import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Extension',
  description: 'Check file extension',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Extensions',
      name: 'extensions',
      type: 'string',
      defaultValue: 'mkv,mp4',
      inputUI: {
        type: 'text',
      },
      tooltip: 'A comma separated list of extensions to check',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File is one of extensions',
    },
    {
      number: 2,
      tooltip: 'File is not one of extensions',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const extensions = String(args.inputs.extensions);
  const extensionArray = extensions.trim().split(',').map((row) => row.toLowerCase());

  const extension = getContainer(args.inputFileObj._id).toLowerCase();

  let extensionMatch = false;

  if (extensionArray.includes(extension)) {
    extensionMatch = true;
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: extensionMatch ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
