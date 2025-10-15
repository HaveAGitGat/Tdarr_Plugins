import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Arithmetic Flow Variable',
  description: 'Apply an arithmetic calculation on a flow variable.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: 1,
  icon: 'faCalculator',
  inputs: [
    {
      label: 'Variable',
      name: 'variable',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the name of an existing flow variable containing a numeric value to perform arithmetic on.
      The variable must exist and contain a valid number.

      \\nExample\\n
      {{{args.variables.user.transcodeStage}}}
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
      tooltip: `Select the arithmetic operation to apply to the variable.

      + : Add the quantity to the variable
      - : Subtract the quantity from the variable
      * : Multiply the variable by the quantity
      / : Divide the variable by the quantity (quantity cannot be 0)`,
    },
    {
      label: 'Quantity',
      name: 'quantity',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the numeric value to use in the arithmetic operation.
      Must be a valid number. Cannot be 0 when using division.

      \\nExample\\n
      1

      \\nExample\\n
      5.5

      \\nExample\\n
      -10
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

  // Get original plugin inputs from thisPlugin.inputsDB
  const inputsOriginal = args.thisPlugin.inputsDB;

  // Extract variable path from the original template string
  const variableTemplate = String(inputsOriginal?.variable).trim();
  const variableMatch = variableTemplate.match(/\{\{\{(?:args|baseArgs)\.([\w.]+)\}\}\}/);

  if (!variableMatch) {
    throw new Error(`Variable template "${variableTemplate}" is invalid. Expected format: {{{args.path.to.variable}}}`);
  }

  const variablePath = variableMatch[1]; // e.g., "variables.user.existingVar"
  const pathParts = variablePath.split('.');

  const variable = String(args.inputs.variable).trim();
  const operation = String(args.inputs.operation).trim();
  const quantity = parseFloat(String(args.inputs.quantity).trim());

  const value = parseFloat(variable);

  // Validate numeric values
  if (Number.isNaN(quantity)) {
    throw new Error(`Quantity "${args.inputs.quantity}" is not a valid number`);
  }

  if (Number.isNaN(value)) {
    throw new Error(`Variable "${variableTemplate}" is not a valid number`);
  }

  // Check for division by zero
  if (operation === '/' && quantity === 0) {
    throw new Error('Division by zero is not allowed');
  }

  args.jobLog(
    `Applying the operation ${operation} ${quantity} to ${variableTemplate} of value ${value}`,
  );

  // Helper to set value at dynamic path
  const setValueAtPath = (obj: IpluginInputArgs, path: string[], val: string) => {
    let current = obj;
    for (let i = 0; i < path.length - 1; i += 1) {
      // @ts-expect-error dynamic path
      if (current[path[i]] === undefined || current[path[i]] === null) {
        throw new Error(`Path "${path.slice(0, i + 1).join('.')}" does not exist in args object`);
      }
      // @ts-expect-error dynamic path
      current = current[path[i]];
    }

    // @ts-expect-error dynamic path
    current[path[path.length - 1]] = val; // eslint-disable-line no-param-reassign
  };

  let result: number;
  switch (operation) {
    case '+':
      result = value + quantity;
      setValueAtPath(args, pathParts, String(result));
      break;
    case '-':
      result = value - quantity;
      setValueAtPath(args, pathParts, String(result));
      break;
    case '*':
      result = value * quantity;
      setValueAtPath(args, pathParts, String(result));
      break;
    case '/':
      result = value / quantity;
      setValueAtPath(args, pathParts, String(result));
      break;
    default:
      throw new Error(`The operation ${operation} is invalid`);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export { details, plugin };
