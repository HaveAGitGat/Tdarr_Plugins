import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check HDR',
  description: 'Check if video is HDR',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File is HDR',
    },
    {
      number: 2,
      tooltip: 'File is not HDR',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let isHdr = false;

  for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
    const stream = args.variables.ffmpegCommand.streams[i];
    if (
      stream.codec_type === 'video'
      && stream.transfer_characteristics === 'smpte2084'
      && stream.color_primaries === 'bt2020'
      && stream.color_range === 'tv'
    ) {
      isHdr = true;
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: isHdr ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
