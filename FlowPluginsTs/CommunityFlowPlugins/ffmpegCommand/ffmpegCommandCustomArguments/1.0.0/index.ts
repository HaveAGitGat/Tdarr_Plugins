import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Custom Arguments',
  description: 'Set FFmpeg custom input and output arguments',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Input Arguments',
      name: 'inputArguments',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify input arguments',
    },

    {
      label: 'Output Arguments',
      name: 'outputArguments',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify output arguments',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const tokenize = (arg: string) => {
  const regex = /(.*?)"(.+?)"(.*)/;
  const arr = [];

  let unprocessedString = '';
  let regexResult = regex.exec(arg);
  while (regexResult !== null) {
    arr.push(...regexResult[1].trim().split(' '));
    arr.push(regexResult[2]);
    // eslint-disable-next-line prefer-destructuring
    unprocessedString = regexResult[3];
    regexResult = regex.exec(unprocessedString);
  }
  if (unprocessedString !== '') {
    arr.push(...unprocessedString.trim().split(' '));
  }
  return arr;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const inputArguments = String(args.inputs.inputArguments);
  const outputArguments = String(args.inputs.outputArguments);

  if (inputArguments) {
    args.variables.ffmpegCommand.overallInputArguments.push(...tokenize(inputArguments));
  }

  if (outputArguments) {
    args.variables.ffmpegCommand.overallOuputArguments.push(...tokenize(outputArguments));
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
