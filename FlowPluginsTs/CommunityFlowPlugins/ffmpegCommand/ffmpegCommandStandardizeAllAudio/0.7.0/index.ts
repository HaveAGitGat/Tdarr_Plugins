import { getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Standardize All Audio',
  description: 'Standardize All Audio to the same codec. Command will be sent for all audio streams.'
  + ' It is recomended to use Check All Audio Codecs or other verifiers before sending this command.'
  + ' The following configurations are unsupported by FFmpeg.'
  + ' FFmpeg does NOT support 1 channel truehd.'
  + ' FFmpeg does NOT support 6 channel dca or libmp3lame.'
  + ' FFmpeg does NOT support 8 channel dca, libmp3lame, truehd, ac3, or eac3.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Audio Encoder',
      name: 'audioEncoder',
      type: 'string',
      defaultValue: 'ac3',
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
      tooltip: 'Enter the desired audio code',
    },
    {
      label: 'Channels',
      name: 'channels',
      type: 'number',
      defaultValue: '6',
      inputUI: {
        type: 'dropdown',
        options: [
          '1',
          '2',
          '6',
          '8',
        ],
      },
      tooltip: 'Enter the desired number of channel, certain channel counts are not supported with certain codec.',
    },
    {
      label: 'Enable Bitrate',
      name: 'enableBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to enable setting audio bitrate',
    },
    {
      label: 'Bitrate',
      name: 'bitrate',
      type: 'string',
      defaultValue: '300k',
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
      tooltip: 'Specify the audio bitrate for newly added channels',
    },
    {
      label: 'Enable Samplerate',
      name: 'enableSamplerate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to enable setting audio samplerate',
    },
    {
      label: 'Samplerate',
      name: 'samplerate',
      type: 'string',
      defaultValue: '48k',
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
      tooltip: 'Specify the audio bitrate for newly added channels',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const checkAbort = (audioCodec :string, channelCount :number) => {
  // channel count 1 not supported
  if ((['truehd'].includes(audioCodec)) && channelCount === 1) {
    throw new Error(
      `Selected ${audioCodec} does not support the channel count of ${channelCount}. Reconfigure the Plugin`,
    );
  }
  // channel count 6 not supported
  if ((['dca', 'libmp3lame'].includes(audioCodec)) && channelCount === 6) {
    throw new Error(
      `Selected ${audioCodec} does not support the channel count of ${channelCount}. Reconfigure the Plugin`,
    );
  }
  // channel count 8 not supported
  if ((['dca', 'libmp3lame', 'truehd', 'ac3', 'eac3'].includes(audioCodec)) && channelCount === 8) {
    throw new Error(
      `Selected ${audioCodec} does not support the channel count of ${channelCount}. Reconfigure the Plugin`,
    );
  }
};

const transcodeStreams = (args :IpluginInputArgs) => {
  const enableBitrate = Boolean(args.inputs.enableBitrate);
  const bitrate = String(args.inputs.bitrate);
  const enableSamplerate = Boolean(args.inputs.enableSamplerate);
  const samplerate = String(args.inputs.samplerate);
  const audioEncoder = String(args.inputs.audioEncoder);
  const wantedChannelCount = Number(args.inputs.channels);

  checkAbort(audioEncoder, wantedChannelCount);

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'audio') {
      return;
    }
    let targetChannels = wantedChannelCount;
    if (stream.channels && stream.channels < wantedChannelCount) {
      targetChannels = Number(stream.channels);
    }
    args.jobLog(`Processing Stream ${stream.index} Standardizing`);
    stream.outputArgs.push('-c:{outputIndex}', audioEncoder);
    stream.outputArgs.push('-ac:{outputIndex}', `${targetChannels}`);
    if (enableBitrate) {
      const ffType = getFfType(stream.codec_type);
      stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}`);
    }
    if (enableSamplerate) {
      stream.outputArgs.push('-ar:{outputIndex}', `${samplerate}`);
    }
    if (['dca', 'truehd', 'flac'].includes(audioEncoder)) {
      stream.outputArgs.push('-strict', '-2');
    }
  });
  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.shouldProcess = true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  transcodeStreams(args);

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
