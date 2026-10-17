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

// PQ (smpte2084) and HLG (arib-std-b67) are both HDR transfer functions.
const hdrTransfers = ['smpte2084', 'arib-std-b67'];

// Dolby Vision codec tags only ever appear in MP4/MOV. Matroska signals
// Dolby Vision through stream side data instead, handled separately below.
const dvCodecTags = ['dvhe', 'dvav', 'dav1', 'dvh11'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let isHdr = false;

  if (Array.isArray(args?.inputFileObj?.ffProbeData?.streams)) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
      const stream = args.inputFileObj.ffProbeData.streams[i];

      // color_range is deliberately not required: full range ('pc') HDR masters
      // exist, and some muxes omit the field entirely. Neither makes a
      // PQ/BT.2020 or HLG/BT.2020 stream any less HDR.
      const hasHdrColours = hdrTransfers.includes(stream.color_transfer as string)
        && stream.color_primaries === 'bt2020';

      const hasDvCodecTag = dvCodecTags
        .some((tag) => stream.codec_tag_string?.includes(tag));

      // Matroska carries Dolby Vision as a DOVI configuration record in side
      // data, where no Dolby Vision codec tag is present.
      const hasDvSideData = Array.isArray(stream.side_data_list)
        && stream.side_data_list
          .some((sideData) => sideData?.dv_profile !== undefined);

      if (stream.codec_type === 'video' && (hasHdrColours || hasDvCodecTag || hasDvSideData)) {
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
