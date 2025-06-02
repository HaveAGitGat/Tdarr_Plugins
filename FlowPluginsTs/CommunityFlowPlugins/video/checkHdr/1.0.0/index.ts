import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check HDR Video',
  description: 'Check if video is HDR',
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

  if (Array.isArray(args?.inputFileObj?.ffProbeData?.streams)) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
      const stream = args.inputFileObj.ffProbeData.streams[i];
      if (
        stream.codec_type === 'video'
            && (
              (stream.color_transfer === 'smpte2084'
                    && stream.color_primaries === 'bt2020'
                    && stream.color_range === 'tv')
                || (stream.codec_tag_string?.includes('dvhe'))
                || (stream.codec_tag_string?.includes('dvav'))
                || (stream.codec_tag_string?.includes('dav1'))
                || (stream.codec_tag_string?.includes('dvh11'))
            )
      ) {
        isHdr = true;
      }
    }
  } else {
    throw new Error('File has not stream data');
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
