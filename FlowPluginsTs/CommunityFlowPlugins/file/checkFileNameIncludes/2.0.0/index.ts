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
    {
      label: 'Pattern (regular expression)',
      name: 'pattern',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the pattern (regex) to check for in file name e.g. ^Pattern.*mkv$',
    },
    {
      label: 'Include file directory in check',
      name: 'includeFileDirectory',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Should the terms and patterns be evaluated against the file directory e.g. false, true',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File name contains terms or patterns',
    },
    {
      number: 2,
      tooltip: 'File name does not contain any of the terms or patterns',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const terms = String(args.inputs.terms);
  const pattern = String(args.inputs.pattern);
  const { includeFileDirectory } = args.inputs;

  const fileName = includeFileDirectory
    ? args.inputFileObj._id
    : `${getFileName(args.inputFileObj._id)}.${getContainer(args.inputFileObj._id)}`;

  const searchCriteriasArray = terms.trim().split(',')
    .map((term) => term.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')); // https://github.com/tc39/proposal-regex-escaping

  if (pattern) {
    searchCriteriasArray.push(pattern);
  }

  const searchCriteriaMatched = searchCriteriasArray
    .find((searchCriteria) => new RegExp(searchCriteria).test(fileName));
  const isAMatch = searchCriteriaMatched !== undefined;

  if (isAMatch) {
    args.jobLog(`'${fileName}' includes '${searchCriteriaMatched}'`);
  } else {
    args.jobLog(`'${fileName}' does not include any of the terms or patterns`);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: isAMatch ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
