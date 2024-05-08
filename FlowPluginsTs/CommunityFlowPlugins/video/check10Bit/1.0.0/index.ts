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
  pType: '',
  requiresVersion: '2.11.01',
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

  if (Array.isArray(args?.inputFileObj?.ffProbeData?.streams)) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
      const stream = args.inputFileObj.ffProbeData.streams[i];
      if (
        stream.codec_type === 'video'
        && (
          stream.bits_per_raw_sample === 10
          || stream.pix_fmt === 'yuv420p10le'
        )
      ) {
        is10Bit = true;
      }
    }
  } else {
    throw new Error('File has not stream data');
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
