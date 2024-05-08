import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Video Streams Count',
  description: 'This plugin checks if the number of video streams is 1 or more.',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File has one video stream',
    },
    {
      number: 2,
      tooltip: 'File has more than one video stream',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { ffProbeData } = args.inputFileObj;

  if (!ffProbeData || !ffProbeData.streams) {
    throw new Error('ffProbeData or ffProbeData.streams is not available.');
  }

  const videoStreams = ffProbeData.streams.filter((stream) => stream.codec_type === 'video').length;

  let outputNumber = 1; // Default to one video stream

  if (videoStreams === 0) {
    throw new Error('No video streams found in file.');
  } else if (videoStreams === 1) {
    outputNumber = 1; // One video stream
  } else if (videoStreams > 1) {
    outputNumber = 2; // More than one video stream
  }

  args.jobLog(`Number of video streams: ${videoStreams}`);

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
