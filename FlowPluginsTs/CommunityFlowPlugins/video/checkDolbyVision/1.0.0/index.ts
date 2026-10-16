import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Dolby Vision',
  description: `Check which Dolby Vision profile, if any, the file carries.
  \\n\\n
  Profile 5 has no HDR10 fallback (IPT colour space), so it is usually left alone or tone mapped.
  Profile 7 is dual layer (base layer + enhancement layer), as found on UHD Blu-ray remuxes.
  Profile 8 is single layer with an HDR10, SDR or HLG compatible base layer.
  \\n\\n
  Reads the DOVI configuration record that FFprobe reports in stream side data, which covers
  both MKV and MP4. Every video stream is checked, so profile 7 remuxes that carry the
  enhancement layer and RPU in a separate video track are detected too.`,
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
      tooltip: 'File has Dolby Vision profile 5',
    },
    {
      number: 2,
      tooltip: 'File has Dolby Vision profile 7',
    },
    {
      number: 3,
      tooltip: 'File has Dolby Vision profile 8',
    },
    {
      number: 4,
      tooltip: 'File has another Dolby Vision profile (e.g. 4, 9, 10), or Dolby Vision whose profile '
        + 'could not be read',
    },
    {
      number: 5,
      tooltip: 'File does not have Dolby Vision',
    },
  ],
});

interface IdoviRecord {
  side_data_type?: string,
  dv_profile?: number,
  dv_level?: number,
  rpu_present_flag?: number,
  el_present_flag?: number,
  bl_present_flag?: number,
  dv_bl_signal_compatibility_id?: number,
}

// MP4/MOV sample entry codec tags for Dolby Vision (HEVC, AVC and AV1).
const dvCodecTags = ['dvhe', 'dvh1', 'dvav', 'dva1', 'dav1'];

const getDoviRecord = (stream: Istreams): IdoviRecord | undefined => {
  if (!Array.isArray(stream.side_data_list)) {
    return undefined;
  }
  return stream.side_data_list.find(
    (sideData: IdoviRecord) => sideData?.dv_profile !== undefined
      || sideData?.side_data_type === 'DOVI configuration record',
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const streams = args.inputFileObj.ffProbeData?.streams;
  if (!Array.isArray(streams)) {
    throw new Error('File has no stream data');
  }

  let record: IdoviRecord | undefined;
  let recordStreamIndex = -1;
  let hasDvCodecTag = false;

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (stream.codec_type === 'video') {
      const streamRecord = getDoviRecord(stream);
      if (streamRecord && !record) {
        record = streamRecord;
        recordStreamIndex = stream.index ?? i;
      }
      const codecTag = String(stream.codec_tag_string || '').toLowerCase();
      if (dvCodecTags.includes(codecTag)) {
        hasDvCodecTag = true;
      }
    }
  }

  if (!record && !hasDvCodecTag) {
    args.jobLog('File does not have Dolby Vision');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 5,
      variables: args.variables,
    };
  }

  const profile = Number(record?.dv_profile);
  let outputNumber = 4;
  if (profile === 5) {
    outputNumber = 1;
  } else if (profile === 7) {
    outputNumber = 2;
  } else if (profile === 8) {
    outputNumber = 3;
  }

  if (record) {
    args.jobLog(`File has Dolby Vision profile ${record.dv_profile ?? 'unknown'}`
      + ` (level ${record.dv_level ?? 'unknown'}`
      + `, compatibility id ${record.dv_bl_signal_compatibility_id ?? 'unknown'}`
      + `, enhancement layer ${record.el_present_flag ? 'present' : 'absent'}`
      + `) on stream ${recordStreamIndex}`);
  } else {
    args.jobLog('File has a Dolby Vision codec tag but no DOVI configuration record, profile unknown');
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
