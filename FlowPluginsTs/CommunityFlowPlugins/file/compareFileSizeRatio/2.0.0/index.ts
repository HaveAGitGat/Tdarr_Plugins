import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Compare File Size Ratio',
  description: 'Compare file size ratio of working file compared to original file using percentage.',
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
      label: 'Greater Than',
      name: 'greaterThan',
      type: 'number',
      defaultValue: '40',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify lower bound.'
      + 'Default value is 40% so new file size must be at least 40% of original file size.',
    },
    {
      label: 'Less Than',
      name: 'lessThan',
      type: 'number',
      defaultValue: '110',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify upper bound.'
      + ' Default value is 110% so new file size must be at most 110% of original file size.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Working file size % is within range',
    },
    {
      number: 2,
      tooltip: 'Working file size % is smaller than lower bound',
    },
    {
      number: 3,
      tooltip: 'Working file size % is larger than upper bound',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const newFileSizeBytes = args.inputFileObj.file_size;
  const origFileSizeBytes = args.originalLibraryFile.file_size;

  const greaterThanPerc = Number(args.inputs.greaterThan);
  const lessThanPerc = Number(args.inputs.lessThan);

  const ratio = (newFileSizeBytes / origFileSizeBytes) * 100;

  const sizeText = `New file has size ${newFileSizeBytes.toFixed(3)} MB which is ${ratio}% `
  + `of original file size:  ${origFileSizeBytes.toFixed(3)} MB`;

  const getBound = (bound:number) => (bound / 100) * origFileSizeBytes;

  let outputNumber = 1;

  const errText = 'New file size not within limits.';
  if (newFileSizeBytes > getBound(lessThanPerc)) {
    // Item will be errored in UI
    args.jobLog(`${errText} ${sizeText}. upperBound is ${lessThanPerc}%`);
    outputNumber = 3;
  } else if (newFileSizeBytes < getBound(greaterThanPerc)) {
    // // Item will be errored in UI
    args.jobLog(`${errText} ${sizeText}. lowerBound is ${greaterThanPerc}%`);
    outputNumber = 2;
  } else {
    args.jobLog(sizeText);
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
