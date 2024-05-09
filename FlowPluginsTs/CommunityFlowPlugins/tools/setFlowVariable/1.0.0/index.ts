import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Flow Variable',
  description: `Set a Flow Variable to whatever you like. This can be used with the 'Check Flow Variable'
  plugin for complex flows with loops in them where you're wanting to keep track 
  of where you are in the flow. For example, when attempting to transcode with NVENC, then QSV, then CPU.`,
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: 1,
  icon: '',
  inputs: [
    {
      label: 'Variable',
      name: 'variable',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Variable to set.
      
      \\nExample\\n
      transcodeStage
      
      \\n
      You can then check this in the 'Check Flow Variable' plugin
      {{{args.variables.user.transcodeStage}}}
      `,
    },
    {
      label: 'Value',
      name: 'value',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Value to set.
      
      \\nExample\\n
      1
      
      \\nExample\\n
      nvenc
      `,
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
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const variable = String(args.inputs.variable).trim();
  const value = String(args.inputs.value);

  if (!args.variables.user) {
    // eslint-disable-next-line no-param-reassign
    args.variables.user = {};
  }

  args.jobLog(`Setting variable ${variable} to ${value}`);

  // eslint-disable-next-line no-param-reassign
  args.variables.user[variable] = value;

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
