import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Video Bitrate',
  description: 'Check if video bitrate is within a specific range',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      name: 'unit',
      type: 'string',
      defaultValue: 'kbps',
      inputUI: {
        type: 'dropdown',
        options: [
          'bps',
          'kbps',
          'mbps',
        ],
      },
      tooltip: 'Specify the unit to use',
    },
    {
      name: 'greaterThan',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify lower bound',
    },
    {
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

  let greaterThanBits = Number(args.inputs.greaterThan);
  let lessThanBits = Number(args.inputs.lessThan);

  if (args.inputs.unit === 'kbps') {
    greaterThanBits *= 1000;
    lessThanBits *= 1000;
  } else if (args.inputs.unit === 'mbps') {
    greaterThanBits *= 1000000;
    lessThanBits *= 1000000;
  }

  if (args.inputFileObj?.mediaInfo?.track) {
    args.inputFileObj.mediaInfo.track.forEach((stream) => {
      if (stream['@type'] === 'video') {
        if (stream.BitRate >= greaterThanBits && stream.BitRate <= lessThanBits) {
          isWithinRange = true;
        }
      }
    });
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
