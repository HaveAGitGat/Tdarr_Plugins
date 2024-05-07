import { getContainer, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Name Includes',
  description: 'Check if a file name includes specific terms. Only needs to match one term',
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
      label: 'Terms',
      name: 'terms',
      type: 'string',
      defaultValue: '_720p,_1080p',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify terms to check for in file name using comma seperated list e.g. _720p,_1080p',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File name contains terms',
    },
    {
      number: 2,
      tooltip: 'File name does not contains terms',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const fileName = `${getFileName(args.inputFileObj._id)}.${getContainer(args.inputFileObj._id)}`;
  const terms = String(args.inputs.terms).trim().split(',');
  let containsTerms = false;

  for (let i = 0; i < terms.length; i++) {
    if (fileName.includes(terms[i])) {
      containsTerms = true;
      break;
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: containsTerms ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
