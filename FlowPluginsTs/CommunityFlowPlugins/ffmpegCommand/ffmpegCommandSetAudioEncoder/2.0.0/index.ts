import {
  appendFfmpegCommandV2Operation,
  ffmpegCommandV2RequiresVersion,
} from '../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Set Audio Encoder',
  description: 'Set the audio encoder for audio streams',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: ffmpegCommandV2RequiresVersion,
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Audio Encoder',
      name: 'audioEncoder',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'dropdown',
        options: [
          'aac',
          'ac3',
          'eac3',
          'dca',
          'flac',
          'libopus',
          'mp2',
          'libmp3lame',
          'truehd',
        ],
      },
      tooltip: 'Select the audio encoder',
    },
    {
      label: 'Force Encoding',
      name: 'forceEncoding',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to force encoding if stream already has the target codec',
    },
    {
      label: 'Enable Bitrate',
      name: 'enableBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to set audio bitrate',
    },
    {
      label: 'Bitrate',
      name: 'bitrate',
      type: 'string',
      defaultValue: '192k',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify the audio bitrate',
    },
    {
      label: 'Enable Samplerate',
      name: 'enableSamplerate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to set audio samplerate',
    },
    {
      label: 'Samplerate',
      name: 'samplerate',
      type: 'string',
      defaultValue: '48000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enableSamplerate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify the audio samplerate',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  appendFfmpegCommandV2Operation({
    args,
    pluginName: 'ffmpegCommandSetAudioEncoder',
    operationType: 'setAudioEncoder',
    inputs: {
      audioEncoder: String(args.inputs.audioEncoder),
      forceEncoding: args.inputs.forceEncoding === true,
      enableBitrate: args.inputs.enableBitrate === true,
      bitrate: String(args.inputs.bitrate),
      enableSamplerate: args.inputs.enableSamplerate === true,
      samplerate: String(args.inputs.samplerate),
    },
  });

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
