import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Video Framerate',
  description: 'Check if video framerate is within a specific range',
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
      label: 'Greater Than',
      name: 'greaterThan',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify lower bound of fps',
    },
    {
      label: 'Less Than',
      name: 'lessThan',
      type: 'number',
      defaultValue: '60',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify upper bound fps',
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

  const greaterThanFps = Number(args.inputs.greaterThan);
  const lessThanFps = Number(args.inputs.lessThan);

  const VideoFrameRate = args.inputFileObj?.meta?.VideoFrameRate;

  if (VideoFrameRate) {
    if (VideoFrameRate >= greaterThanFps && VideoFrameRate <= lessThanFps) {
      isWithinRange = true;
    }
  } else {
    throw new Error('Video framerate not found');
  }

  if (isWithinRange) {
    args.jobLog(`Video framerate of ${VideoFrameRate} is within range of ${greaterThanFps} and ${lessThanFps}`);
  } else {
    args.jobLog(`Video framerate of ${VideoFrameRate} is not within range of ${greaterThanFps} and ${lessThanFps}`);
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
