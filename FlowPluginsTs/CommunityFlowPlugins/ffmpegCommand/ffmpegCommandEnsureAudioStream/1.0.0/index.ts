import { getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Ensure Audio Stream',
  description: 'Ensure that the file has an audio stream with set codec and channel count',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
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
      tooltip:
        'Enter the desired audio codec',
    },
    {
      label: 'Language',
      name: 'language',
      type: 'string',
      defaultValue: 'en',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Tdarr will check to see if the stream language tag includes the tag you specify.'
        + ' Case-insensitive. One tag only',
    },
    {
      label: 'Channels',
      name: 'channels',
      type: 'number',
      defaultValue: '2',
      inputUI: {
        type: 'dropdown',
        options: [
          '1',
          '2',
          '6',
          '8',
        ],
      },
      tooltip:
        'Enter the desired number of channels',
    },
    {
      label: 'Enable Bitrate',
      name: 'enableBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable setting audio bitrate',
    },
    {
      label: 'Bitrate',
      name: 'bitrate',
      type: 'string',
      defaultValue: '128k',
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
      tooltip:
        'Specify the audio bitrate for newly added channels',
    },
    {
      label: 'Enable Samplerate',
      name: 'enableSamplerate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Toggle whether to enable setting audio samplerate',
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
      tooltip:
        'Specify the audio samplerate for newly added channels',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getHighest = (first: IffmpegCommandStream, second: IffmpegCommandStream) => {
  // @ts-expect-error channels
  if (first?.channels > second?.channels) {
    return first;
  }
  return second;
};

const audioCodecNames: Record<string, string> = {
  dca: 'dts',
  libopus: 'opus',
  libmp3lame: 'mp3',
};

const audioTrackTitles: Record<string, string> = {
  libopus: 'Opus',
  truehd: 'TrueHD',
};

const channelTitles: Record<number, string> = {
  1: '1.0',
  2: '2.0',
  6: '5.1',
  8: '7.1',
};

const channelLayouts: Record<number, string> = {
  1: 'mono',
  2: 'stereo',
  6: '5.1',
  8: '7.1',
};

const getAudioCodecName = (audioEncoder: string): string => audioCodecNames[audioEncoder] || audioEncoder;
const getTrackTitle = (audioEncoder: string, channels: number): string => (
  `${audioTrackTitles[audioEncoder] || getAudioCodecName(audioEncoder).toUpperCase()}`
  + ` ${channelTitles[channels] || `${channels} channels`}`
);

const codecTitlePrefix = new RegExp(
  '^(?:dts(?:-?hd)?|e-?ac-?3|ac-?3|aac|dca|flac|opus|mp2|mp3|truehd)'
  + '(?:\\s+(?:hd|ma|hra|master audio|atmos))*'
  + '(?:\\s+\\d(?:\\.\\d)?(?:\\s*channels?)?)?(?=$|\\s)',
  'i',
);

const getOutputTrackTitle = (sourceTitle: string | undefined, audioEncoder: string, channels: number): string => {
  const trackTitle = getTrackTitle(audioEncoder, channels);
  const trimmedTitle = sourceTitle?.trim();

  if (!trimmedTitle) {
    return trackTitle;
  }

  return trimmedTitle.replace(codecTitlePrefix, trackTitle).trim();
};

const parseRate = (rate: string): number | undefined => {
  const normalizedRate = rate.trim().toLowerCase();
  const rateMatch = normalizedRate.match(/^(\d+(?:\.\d+)?)(k?)$/);

  if (!rateMatch) {
    return undefined;
  }

  const multiplier = rateMatch[2] === 'k' ? 1000 : 1;
  return Math.round(Number(rateMatch[1]) * multiplier);
};

const attemptMakeStream = ({
  args,
  langTag,
  streams,
  audioEncoder,
  wantedChannelCount,
}: {
  args: IpluginInputArgs,
  langTag: string
  streams: IffmpegCommandStream[],
  audioEncoder: string,
  wantedChannelCount: number,
}): boolean => {
  const enableBitrate = Boolean(args.inputs.enableBitrate);
  const bitrate = String(args.inputs.bitrate);
  const enableSamplerate = Boolean(args.inputs.enableSamplerate);
  const samplerate = String(args.inputs.samplerate);
  const audioCodecName = getAudioCodecName(audioEncoder);

  const langMatch = (stream: IffmpegCommandStream) => (
    (langTag === 'und'
      && (stream.tags === undefined || stream.tags.language === undefined))
      || (stream?.tags?.language && stream.tags.language.toLowerCase().includes(langTag)
      )
  );

  // filter streams to only include audio streams with the specified lang tag
  const streamsWithLangTag = streams.filter((stream) => stream.codec_type === 'audio' && langMatch(stream));

  if (streamsWithLangTag.length === 0) {
    args.jobLog(`No streams with language tag ${langTag} found. Skipping \n`);
    return false;
  }

  // get the stream with the highest channel count
  const streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
  const highestChannelCount = Number(streamWithHighestChannel.channels);

  let targetChannels = 0;
  if (wantedChannelCount <= highestChannelCount) {
    targetChannels = wantedChannelCount;
    args.jobLog(`The wanted channel count ${wantedChannelCount} is <= than the`
      + ` highest available channel count (${streamWithHighestChannel.channels}). \n`);
  } else {
    targetChannels = highestChannelCount;
    args.jobLog(`The wanted channel count ${wantedChannelCount} is higher than the`
      + ` highest available channel count (${streamWithHighestChannel.channels}). \n`);
  }

  const hasStreamAlready = streams.some((stream) => (
    stream.codec_type === 'audio'
    && langMatch(stream)
    && stream.codec_name === audioCodecName
    && stream.channels === targetChannels
  ));

  if (hasStreamAlready) {
    args.jobLog(`File already has ${langTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);
    return true;
  }

  args.jobLog(`Adding ${langTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);

  const streamCopy: IffmpegCommandStream = JSON.parse(JSON.stringify(streamWithHighestChannel));
  streamCopy.removed = false;
  streamCopy.index = streams.length;
  // Keep planned stream metadata aligned for subsequent command plugins.
  const trackTitle = getOutputTrackTitle(streamCopy.tags?.title, audioEncoder, targetChannels);
  streamCopy.codec_name = audioCodecName;
  streamCopy.channels = targetChannels;
  if (channelLayouts[targetChannels]) {
    streamCopy.channel_layout = channelLayouts[targetChannels];
  } else {
    delete streamCopy.channel_layout;
  }
  streamCopy.tags = {
    ...(streamCopy.tags || {}),
    title: trackTitle,
  };
  delete streamCopy.codec_long_name;
  delete streamCopy.profile;
  streamCopy.outputArgs.push('-c:{outputIndex}', audioEncoder);
  streamCopy.outputArgs.push('-ac', `${targetChannels}`);
  streamCopy.outputArgs.push('-metadata:s:a:{outputTypeIndex}', `title=${trackTitle}`);

  if (enableBitrate) {
    const ffType = getFfType(streamCopy.codec_type);
    streamCopy.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}`);
    const parsedBitrate = parseRate(bitrate);
    if (parsedBitrate !== undefined) {
      streamCopy.bit_rate = parsedBitrate;
    }
  }

  if (enableSamplerate) {
    streamCopy.outputArgs.push('-ar', `${samplerate}`);
    const parsedSamplerate = parseRate(samplerate);
    if (parsedSamplerate !== undefined) {
      streamCopy.sample_rate = String(parsedSamplerate);
    }
  }

  // eslint-disable-next-line no-param-reassign
  args.variables.ffmpegCommand.shouldProcess = true;

  streams.push(streamCopy);

  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const audioEncoder = String(args.inputs.audioEncoder);
  const langTag = String(args.inputs.language).toLowerCase();
  const wantedChannelCount = Number(args.inputs.channels);

  const { streams } = args.variables.ffmpegCommand;

  const addedOrExists = attemptMakeStream({
    args,
    langTag,
    streams,
    audioEncoder,
    wantedChannelCount,
  });

  if (!addedOrExists) {
    attemptMakeStream({
      args,
      langTag: 'und',
      streams,
      audioEncoder,
      wantedChannelCount,
    });
  }

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
