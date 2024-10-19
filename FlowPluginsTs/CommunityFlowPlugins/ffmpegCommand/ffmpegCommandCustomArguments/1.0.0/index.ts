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

const search = (arg:string, i:number, originalIndex:number = i): [string | null, number] => {
  const searchIndex = arg.indexOf(arg[i], i + 1);

  if (searchIndex === -1) {
    return [null, i];
  }
  if (arg[searchIndex - 1] === '\\') {
    return search(arg, searchIndex + 1, originalIndex);
  }
  return [arg.slice(originalIndex + 1, searchIndex), searchIndex];
};

const tokenize = (arg: string) => {
  const tokens = [];
  let token = '';

  for (let i = 0; i < arg.length; i++) {
    const char = arg[i];
    if (char === ' ') {
      if (token !== '') {
        tokens.push(token);
        token = '';
      }
    } else if ((char === '"' || char === '\'') && arg[i - 1] !== '\\') {
      const [searchResult, searchIndex] = search(arg, i);
      if (searchResult !== null) {
        if (token !== '') {
          tokens.push(token);
          token = '';
        }
        tokens.push(searchResult);
        i = searchIndex;
      } else {
        token += char;
      }
    } else {
      token += char;
    }
  }
  if (token !== '') {
    tokens.push(token);
  }

  return tokens;
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
