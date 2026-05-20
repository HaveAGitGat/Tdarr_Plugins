/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/prefer-default-export */

import { IflowTemplate } from '../../FlowHelpers/1.0.0/interfaces/interfaces';

// Custom function code that calculates target bitrate from file metadata
// and stores it as a flow variable for use in HandBrake arguments.
// Uses the same calculation as Tdarr_Plugin_00td_action_transcode:
//   targetBitrate = (file_size * 8) / duration * multiplier
const calcBitrateCode = `
module.exports = async (args) => {
  const file = args.inputFileObj;
  let duration = 0;
  if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
    duration = parseFloat(file.ffProbeData.format.duration);
  } else if (typeof file.meta?.Duration !== 'undefined') {
    duration = file.meta.Duration;
  } else if (file.ffProbeData?.streams?.[0]?.duration) {
    duration = parseFloat(file.ffProbeData.streams[0].duration);
  }
  if (!duration || duration <= 0) {
    args.jobLog('Could not determine file duration. Skipping bitrate calculation.');
    return {
      outputFileObj: file,
      outputNumber: 2,
      variables: args.variables,
    };
  }
  const multiplier = 0.5;
  const currentBitrate = (file.file_size * 1024 * 1024 * 8) / duration;
  const targetBitrate = Math.round((currentBitrate * multiplier) / 1000);
  args.jobLog('Current bitrate: ' + Math.round(currentBitrate / 1000) + ' kbps');
  args.jobLog('Target bitrate (multiplier ' + multiplier + '): ' + targetBitrate + ' kbps');
  if (!args.variables.user) {
    args.variables.user = {};
  }
  args.variables.user.targetBitrate = String(targetBitrate);
  return {
    outputFileObj: file,
    outputNumber: 1,
    variables: args.variables,
  };
}
`;

const details = () :IflowTemplate => ({
  name: 'Basic HEVC Video Flow - HandBrake',
  description: 'Transcode a video file to HEVC using HandBrake. '
  + 'Checks file medium, codec, and bitrate cutoff before transcoding. '
  + 'Calculates a target bitrate using a 0.5x multiplier (same as the classic transcode plugin). '
  + 'Uses GPU worker detection to branch between NVENC GPU and x265 CPU encoding. '
  + 'Equivalent to the classic Tdarr_Plugin_00td_action_transcode plugin but using HandBrake.',
  tags: '',
  flowPlugins: [
    {
      name: 'Input File',
      sourceRepo: 'Community',
      pluginName: 'inputFile',
      version: '1.0.0',
      id: 'hbT1InputF',
      position: {
        x: 650,
        y: 100,
      },
    },
    {
      name: 'Check File Medium',
      sourceRepo: 'Community',
      pluginName: 'checkFileMedium',
      version: '1.0.0',
      id: 'hbT2Medium',
      position: {
        x: 650,
        y: 220,
      },
    },
    {
      name: 'Check if hevc',
      sourceRepo: 'Community',
      pluginName: 'checkVideoCodec',
      version: '1.0.0',
      id: 'hbT3Codec',
      position: {
        x: 650,
        y: 360,
      },
    },
    {
      name: 'Check Bitrate Above Cutoff',
      sourceRepo: 'Community',
      pluginName: 'checkVideoBitrate',
      version: '1.0.0',
      id: 'hbT4Bitrte',
      position: {
        x: 450,
        y: 500,
      },
      inputsDB: {
        unit: 'kbps',
        greaterThan: '3000',
        lessThan: '1000000',
      },
    },
    {
      name: 'Calculate Target Bitrate (0.5x multiplier)',
      sourceRepo: 'Community',
      pluginName: 'customFunction',
      version: '1.0.0',
      id: 'hbT5CalcBR',
      position: {
        x: 552,
        y: 588,
      },
      inputsDB: {
        code: calcBitrateCode,
      },
    },
    {
      name: 'Check Flow Variable: Worker Type',
      sourceRepo: 'Community',
      pluginName: 'checkFlowVariable',
      version: '1.0.0',
      id: 'hbT6Worker',
      position: {
        x: 288,
        y: 732,
      },
      inputsDB: {
        variable: '{{{args.workerType}}}',
        value: 'transcodegpu',
      },
    },
    {
      name: 'Check Node Hardware Encoder',
      sourceRepo: 'Community',
      pluginName: 'checkNodeHardwareEncoder',
      version: '1.0.0',
      id: 'hbT7HwChk',
      position: {
        x: 192,
        y: 876,
      },
    },
    {
      name: 'HandBrake GPU (NVENC)',
      sourceRepo: 'Community',
      pluginName: 'handbrakeCustomArguments',
      version: '2.0.0',
      id: 'hbT8GPU',
      position: {
        x: 96,
        y: 1080,
      },
      inputsDB: {
        customArguments: '-e nvenc_h265 -b {{{args.variables.user.targetBitrate}}}'
          + ' --all-audio --all-subtitles',
        container: 'mkv',
      },
    },
    {
      name: 'HandBrake CPU (x265)',
      sourceRepo: 'Community',
      pluginName: 'handbrakeCustomArguments',
      version: '2.0.0',
      id: 'hbT9CPU',
      position: {
        x: 500,
        y: 1080,
      },
      inputsDB: {
        customArguments: '-e x265 -b {{{args.variables.user.targetBitrate}}}'
          + ' --encoder-preset medium --all-audio --all-subtitles',
        container: 'mkv',
      },
    },
    {
      name: 'Replace Original File',
      sourceRepo: 'Community',
      pluginName: 'replaceOriginalFile',
      version: '1.0.0',
      id: 'hbTAReplac',
      position: {
        x: 650,
        y: 1260,
      },
    },
  ],
  flowEdges: [
    // Input -> Check File Medium
    {
      source: 'hbT1InputF',
      sourceHandle: '1',
      target: 'hbT2Medium',
      targetHandle: null,
      id: 'hbE1InpMed',
    },
    // File Medium is Video -> Check Codec
    {
      source: 'hbT2Medium',
      sourceHandle: '1',
      target: 'hbT3Codec',
      targetHandle: null,
      id: 'hbE2MedCod',
    },
    // Already hevc -> Replace Original (no-op)
    {
      source: 'hbT3Codec',
      sourceHandle: '1',
      target: 'hbTAReplac',
      targetHandle: null,
      id: 'hbE3CodSkp',
    },
    // Not hevc -> Check Bitrate
    {
      source: 'hbT3Codec',
      sourceHandle: '2',
      target: 'hbT4Bitrte',
      targetHandle: null,
      id: 'hbE4CodBit',
    },
    // Bitrate within range (above cutoff) -> Calculate Target Bitrate
    {
      source: 'hbT4Bitrte',
      sourceHandle: '1',
      target: 'hbT5CalcBR',
      targetHandle: null,
      id: 'hbE5BitClc',
    },
    // Bitrate below cutoff -> Replace Original (skip transcode)
    {
      source: 'hbT4Bitrte',
      sourceHandle: '2',
      target: 'hbTAReplac',
      targetHandle: null,
      id: 'hbE6BitSkp',
    },
    // Bitrate calculated -> Check Worker Type
    {
      source: 'hbT5CalcBR',
      sourceHandle: '1',
      target: 'hbT6Worker',
      targetHandle: null,
      id: 'hbE7ClcWrk',
    },
    // Bitrate calc failed -> Replace Original (skip)
    {
      source: 'hbT5CalcBR',
      sourceHandle: '2',
      target: 'hbTAReplac',
      targetHandle: null,
      id: 'hbE8ClcSkp',
    },
    // GPU worker -> Check Node Hardware
    {
      source: 'hbT6Worker',
      sourceHandle: '1',
      target: 'hbT7HwChk',
      targetHandle: null,
      id: 'hbE9WrkHw',
    },
    // CPU worker -> HandBrake CPU
    {
      source: 'hbT6Worker',
      sourceHandle: '2',
      target: 'hbT9CPU',
      targetHandle: null,
      id: 'hbEAWrkCpu',
    },
    // Node has GPU hardware -> HandBrake GPU
    {
      source: 'hbT7HwChk',
      sourceHandle: '1',
      target: 'hbT8GPU',
      targetHandle: null,
      id: 'hbEBHwGpu',
    },
    // Node has no GPU hardware -> HandBrake CPU fallback
    {
      source: 'hbT7HwChk',
      sourceHandle: '2',
      target: 'hbT9CPU',
      targetHandle: null,
      id: 'hbECHwCpu',
    },
    // HandBrake GPU -> Replace Original
    {
      source: 'hbT8GPU',
      sourceHandle: '1',
      target: 'hbTAReplac',
      targetHandle: null,
      id: 'hbEDGpuRpl',
    },
    // HandBrake CPU -> Replace Original
    {
      source: 'hbT9CPU',
      sourceHandle: '1',
      target: 'hbTAReplac',
      targetHandle: null,
      id: 'hbEECpuRpl',
    },
  ],
});

export {
  details,
};
