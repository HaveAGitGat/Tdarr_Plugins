import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Custom Arguments',
  description: 'Set FFmpeg custome input and output arguments',
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
    {
      label: 'Only Apply If Processing',
      name: 'onlyApplyIfProcessing',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: `By default, any custom argument makes the file get processed.

Enable this to add the arguments only when another plugin already requires processing
(for example a stream was removed or is being re-encoded).

Use it for arguments that should ride along with real work but are not a reason to rewrite
the file on their own, such as metadata, colour tags or encoder tuning. Otherwise a file
that already matches the flow is re-processed on every pass just to re-apply them.`,
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
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const inputArguments = String(args.inputs.inputArguments);
  const outputArguments = String(args.inputs.outputArguments);
  const onlyApplyIfProcessing = Boolean(args.inputs.onlyApplyIfProcessing);

  const { ffmpegCommand } = args.variables;

  if (onlyApplyIfProcessing) {
    if (inputArguments) {
      if (!ffmpegCommand.overallInputArgumentsIfProcessing) {
        ffmpegCommand.overallInputArgumentsIfProcessing = [];
      }
      ffmpegCommand.overallInputArgumentsIfProcessing.push(...inputArguments.split(' '));
    }

    if (outputArguments) {
      if (!ffmpegCommand.overallOutputArgumentsIfProcessing) {
        ffmpegCommand.overallOutputArgumentsIfProcessing = [];
      }
      ffmpegCommand.overallOutputArgumentsIfProcessing.push(...outputArguments.split(' '));
    }
  } else {
    if (inputArguments) {
      ffmpegCommand.overallInputArguments.push(...inputArguments.split(' '));
    }

    if (outputArguments) {
      ffmpegCommand.overallOuputArguments.push(...outputArguments.split(' '));
    }
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
