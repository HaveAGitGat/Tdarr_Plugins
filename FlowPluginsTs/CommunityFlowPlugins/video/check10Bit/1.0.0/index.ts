import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check 10 Bit Video',
  description: 'Check if a file is 10 bit video',
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
      tooltip: 'File is 10 bit video',
    },
    {
      number: 2,
      tooltip: 'File is not 10 bit video',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let is10Bit = false;

  for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
    const stream = args.variables.ffmpegCommand.streams[i];
    if (stream.codec_type === 'video' && stream.bits_per_raw_sample === 10) {
      is10Bit = true;
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: is10Bit ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
