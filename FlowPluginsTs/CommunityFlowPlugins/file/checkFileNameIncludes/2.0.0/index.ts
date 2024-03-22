import { getContainer, getFileAbosluteDir, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';
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
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '_720p,_1080p',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
      tooltip: 'Specify terms to check for in file name using comma seperated list e.g. _720p,_1080p',
    },
    {
      label: 'Pattern (regular expression)',
      name: 'pattern',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
      tooltip: 'Specify the pattern (regex) to check for in file name e.g. ^Pattern.*mkv$',
    },
    {
      label: 'Include file directory in check',
      name: 'includeFileDirectory',
      type: 'boolean',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      // eslint-disable-next-line no-template-curly-in-string
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

  const buildArrayInput = (arrayInput: unknown): string[] => String(arrayInput)?.trim().split(',') ?? [];

  const fileName = `${(args.inputs.includeFileDirectory ? `${getFileAbosluteDir(args.inputFileObj._id)}/` : '')
    + getFileName(args.inputFileObj._id)
  }.${getContainer(args.inputFileObj._id)}`;
  const searchCriteriasArray = buildArrayInput(args.inputs.terms)
    .map((term) => term.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')); // https://github.com/tc39/proposal-regex-escaping
  if (args.inputs.pattern) searchCriteriasArray.push(String(args.inputs.pattern));

  const searchCriteriaMatched = searchCriteriasArray
    .find((searchCriteria) => new RegExp(searchCriteria).test(fileName));
  const isAMatch = searchCriteriaMatched !== undefined;
  if (isAMatch) args.jobLog(`'${fileName}' includes '${searchCriteriaMatched}'`);

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
