import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Medium',
  description: 'Check if file is video, audio or other type of file',
  style: {
    borderColor: 'orange',
  },
  tags: '',

  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File medium is a Video',

    },
    {
      number: 2,
      tooltip: 'File medium is an Audio',
    },
    {
      number: 3,
      tooltip: 'File medium is Other',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let outputNumber = 1;
  switch (args.inputFileObj.fileMedium) {
    case 'video':
      outputNumber = 1;
      break;
    case 'audio':
      outputNumber = 2;
      break;
    case 'other':
      outputNumber = 3;
      break;
    default:
      throw new Error('File has no fileMedium!');
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
