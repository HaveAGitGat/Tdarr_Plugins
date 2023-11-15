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

const attemptMakeStream = ({
  args,
  langTag,
  streams,
  audioCodec,
  audioEncoder,
  wantedChannelCount,
}: {
  args: IpluginInputArgs,
  langTag: string
  streams: IffmpegCommandStream[],
  audioCodec: string,
  audioEncoder: string,
  wantedChannelCount: number,
}): boolean => {
  const langMatch = (stream: IffmpegCommandStream) => (
    (langTag === 'und'
      && (stream.tags === undefined || stream.tags.language === undefined))
      || (stream?.tags?.language && stream.tags.language.toLowerCase().includes(langTag)
      )
  );

  // filter streams to only include audio streams with the specified lang tag
  const streamsWithLangTag = streams.filter((stream) => {
    if (
      stream.codec_type === 'audio'
        && langMatch(stream)
    ) {
      return true;
    }

    return false;
  });

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

  const hasStreamAlready = streams.filter((stream) => {
    if (
      stream.codec_type === 'audio'
      && langMatch(stream)
      && stream.codec_name === audioCodec
      && stream.channels === targetChannels
    ) {
      return true;
    }

    return false;
  });

  if (hasStreamAlready.length > 0) {
    args.jobLog(`File already has ${langTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);
    return true;
  }

  args.jobLog(`Adding ${langTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);

  const streamCopy: IffmpegCommandStream = JSON.parse(JSON.stringify(streamWithHighestChannel));
  streamCopy.index = streams.length;
  streamCopy.outputArgs.push('-c:{outputIndex}', audioEncoder);
  streamCopy.outputArgs.push('-ac', `${targetChannels}`);

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

  const audioEncoder = String(args.inputs.audioEncoder);
  const langTag = String(args.inputs.language).toLowerCase();
  const wantedChannelCount = Number(args.inputs.channels);

  const { streams } = args.variables.ffmpegCommand;

  let audioCodec = audioEncoder;

  if (audioEncoder === 'dca') {
    audioCodec = 'dts';
  }

  if (audioEncoder === 'libmp3lame') {
    audioCodec = 'mp3';
  }

  if (audioEncoder === 'libopus') {
    audioCodec = 'opus';
  }

  const addedOrExists = attemptMakeStream({
    args,
    langTag,
    streams,
    audioCodec,
    audioEncoder,
    wantedChannelCount,
  });

  if (!addedOrExists) {
    attemptMakeStream({
      args,
      langTag: 'und',
      streams,
      audioCodec,
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
