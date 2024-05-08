import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check File Size',
  description: 'Check size of working file',
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
      label: 'Unit',
      name: 'unit',
      type: 'string',
      defaultValue: 'GB',
      inputUI: {
        type: 'dropdown',
        options: [
          'B',
          'KB',
          'MB',
          'GB',
        ],
      },
      tooltip: 'Specify the unit to use',
    },
    {
      label: 'Greater Than',
      name: 'greaterThan',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify lower bound',
    },
    {
      label: 'Less Than',
      name: 'lessThan',
      type: 'number',
      defaultValue: '10000',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify upper bound',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File within range',
    },
    {
      number: 2,
      tooltip: 'File not within range',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let isWithinRange = false;
  let greaterThanBytes = Number(args.inputs.greaterThan);
  let lessThanBytes = Number(args.inputs.lessThan);
  const fileSizeBytes = args.inputFileObj.file_size * 1000 * 1000;

  if (args.inputs.unit === 'KB') {
    greaterThanBytes *= 1000;
    lessThanBytes *= 1000;
  } else if (args.inputs.unit === 'MB') {
    greaterThanBytes *= 1000000;
    lessThanBytes *= 1000000;
  } else if (args.inputs.unit === 'GB') {
    greaterThanBytes *= 1000000000;
    lessThanBytes *= 1000000000;
  }

  if (fileSizeBytes >= greaterThanBytes && fileSizeBytes <= lessThanBytes) {
    isWithinRange = true;
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: isWithinRange ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
