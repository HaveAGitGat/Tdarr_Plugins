import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Flow Variable',
  description: 'Check Flow Variable',
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Variable',
      name: 'variable',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Variable to check. For example , 
      
      \\nExample\\n
      args.librarySettings._id
      
      \\nExample\\n
      args.inputFileObj._id

      \\nExample\\n
      args.userVariables.library.test

      \\nExample\\n
      args.userVariables.global.test
      `,
    },
    {
      label: 'Condition',
      name: 'condition',
      type: 'string',
      defaultValue: '==',
      inputUI: {
        type: 'dropdown',
        options: [
          '==',
          '!=',
        ],
      },
      tooltip: 'Check condition',
    },

    {
      label: 'Value',
      name: 'value',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Value of variable to check',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'The variable matches the condition',
    },
    {
      number: 2,
      tooltip: 'The variable does not match the condition',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const variable = String(args.inputs.variable).trim();
  const condition = String(args.inputs.condition);
  const value = String(args.inputs.value);

  // variable could be e.g. args.librarySettings._id or args.inputFileObj._id
  // condition could be e.g. '==' or '!='

  const variableParts = variable.split('.');

  let targetValue;
  switch (variableParts.length) {
    case 1:
      targetValue = args;
      break;
    case 2:
      // @ts-expect-error index
      targetValue = args[variableParts[1]];
      break;
    case 3:
      // @ts-expect-error index
      targetValue = args[variableParts[1]][variableParts[2]];
      break;
    case 4:
      // @ts-expect-error index
      targetValue = args[variableParts[1]][variableParts[2]][variableParts[3]];
      break;
    case 5:
      // @ts-expect-error index
      targetValue = args[variableParts[1]][variableParts[2]][variableParts[3]][variableParts[4]];
      break;
    default:
      throw new Error(`Invalid variable: ${variable}`);
  }

  targetValue = String(targetValue);
  let outputNumber = 1;

  if (condition === '==') {
    if (targetValue === value) {
      args.jobLog(`Variable ${variable} of value ${targetValue} matches condition ${condition} ${value}`);
      outputNumber = 1;
    } else {
      args.jobLog(`Variable ${variable} of value ${targetValue} does not match condition ${condition} ${value}`);
      outputNumber = 2;
    }
  } else if (condition === '!=') {
    if (targetValue !== value) {
      args.jobLog(`Variable ${variable} of value ${targetValue} matches condition ${condition} ${value}`);
      outputNumber = 1;
    } else {
      args.jobLog(`Variable ${variable} of value ${targetValue} does not match condition ${condition} ${value}`);
      outputNumber = 2;
    }
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
