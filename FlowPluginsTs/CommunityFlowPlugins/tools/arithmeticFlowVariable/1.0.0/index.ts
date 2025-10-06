import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Arithmetic Flow Variable',
  description: 'Apply an arithmetic calculation on a Flow Variable.',
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
      `,
    },
    {
      label: 'Operation',
      name: 'operation',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'dropdown',
        options: ['+', '-', '*', '/'],
      },
      tooltip: 'Operation to perform on the variable',
    },
    {
      label: 'Quantity',
      name: 'quantity',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Value to set.

      \\nExample\\n
      1
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
  const operation = String(args.inputs.operation).trim();
  const quantity = parseInt(String(args.inputs.quantity).trim(), 10);
  const value = parseInt(args.variables.user[variable], 10);

  args.jobLog(
    `Applying the operation ${operation} ${quantity} to ${variable} of value ${value}`,
  );

  switch (operation) {
    case '+':
      // eslint-disable-next-line no-param-reassign
      args.variables.user[variable] = String(value + quantity);
      break;
    case '-':
      // eslint-disable-next-line no-param-reassign
      args.variables.user[variable] = String(value - quantity);
      break;
    case '*':
      // eslint-disable-next-line no-param-reassign
      args.variables.user[variable] = String(value * quantity);
      break;
    case '/':
      // eslint-disable-next-line no-param-reassign
      args.variables.user[variable] = String(value / quantity);
      break;
    default:
      throw new Error('The operation '.concat(operation, ' is invalid'));
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export { details, plugin };
