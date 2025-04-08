import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Set Default Audio Stream',
  description: 'Sets the default audio track based on channels count and language',
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
      label: 'Language',
      name: 'language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: { type: 'text' },
      tooltip: 'Specify what language to use in the ISO 639-2 format.\nExample:\neng\nfre',
    },
    {
      label: 'Use the highest number of channels as default',
      name: 'useHightestNumberOfChannels',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: { type: 'switch' },
      tooltip: 'Should the audio stream, matching the language, with the highest number of channels be set '
        + 'as the default audio stream? If yes, the Channels property will be ignored. If no, please indicate '
        + 'the channels to use in the Channels count property.',
    },
    {
      label: 'Channels count',
      name: 'channelsCount',
      type: 'string',
      defaultValue: '6',
      inputUI: {
        type: 'dropdown',
        options: ['8', '6', '2'],
      },
      tooltip: 'Specify what number of channels should be used as the default channel.',
    },
    {
      label: 'Allow descriptive streams to be default',
      name: 'allowDescriptive',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: { type: 'switch' },
      tooltip: 'If set to yes, descriptive streams will not be discarded when finding the default stream.',
    },
  ],
  outputs: [
    { number: 1, tooltip: 'Default has been set' },
    { number: 2, tooltip: 'No default has been set' },
  ],
});

// Enhanced interfaces with better type definitions
interface IDisposition {
  default: number;
  dub: number;
  original: number;
  comment: number;
  lyrics: number;
  karaoke: number;
  forced: number;
  hearing_impaired: number;
  visual_impaired: number;
  clean_effects: number;
  attached_pic: number;
  timed_thumbnails: number;
  captions: number;
  descriptions: number;
  metadata: number;
  dependent: number;
  still_image: number;
}

interface IStreamDisposition {
  disposition?: IDisposition;
  tags?: {
    title?: string;
    language?: string;
  };
  codec_type?: string;
  channels?: number;
  outputArgs?: string[];
}

const DESCRIPTIVE_KEYWORDS = /\b(commentary|description|descriptive|sdh)\b/gi;

const getFFMPEGDisposition = (isDefault: boolean, dispositions?: IDisposition): string => {
  if (!dispositions) return isDefault ? 'default' : '0';

  const activeDispositions = Object.entries(dispositions)
    .filter(([key, value]) => key !== 'default' && value === 1)
    .map(([key]) => key);

  if (isDefault) {
    activeDispositions.unshift('default');
  }

  return activeDispositions.length ? activeDispositions.join('+') : '0';
};

const getIsDescriptiveAudioStream = (stream: IStreamDisposition): boolean => {
  const { disposition, tags } = stream;
  return Boolean(
    disposition?.comment
    || disposition?.descriptions
    || disposition?.visual_impaired
    || DESCRIPTIVE_KEYWORDS.test(tags?.title || ''),
  );
};

const findHighestChannelCount = (streams: IStreamDisposition[], languageCode: string): number => {
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio'
    && (stream.tags?.language ?? '') === languageCode);

  if (!audioStreams.length) return 0;

  return Math.max(...audioStreams.map((stream) => stream.channels ?? 0));
};

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  let shouldProcess = false;
  const { streams } = args.variables.ffmpegCommand;
  const {
    allowDescriptive,
    useHightestNumberOfChannels,
  } = args.inputs as {
    allowDescriptive: boolean;
    useHightestNumberOfChannels: boolean;
  };

  // Sets the language code used to determine the default subtitle stream
  const languageCode = String(args.inputs.language);

  // Determine target channel count
  const targetChannelsCount = useHightestNumberOfChannels
    ? findHighestChannelCount(streams, languageCode)
    : parseInt(String(args.inputs.channelsCount), 10);

  if (useHightestNumberOfChannels) {
    args.jobLog(`${targetChannelsCount} channels count determined as being the highest match`);
  }

  let defaultSet = false;

  streams.forEach((stream: IStreamDisposition, index: number) => {
    if (stream.codec_type !== 'audio') return;

    const streamLanguage = stream.tags?.language ?? '';
    const streamChannels = stream.channels ?? 0;
    const isDefault = stream.disposition?.default !== 0;
    const isDescriptive = getIsDescriptiveAudioStream(stream);

    const shouldBeDefault = streamLanguage === languageCode
      && streamChannels === targetChannelsCount
      && !isDefault
      && (!isDescriptive || allowDescriptive)
      && !defaultSet;

    const shouldRemoveDefault = isDefault
      && (streamLanguage !== languageCode
        || streamChannels !== targetChannelsCount
        || (isDescriptive && !allowDescriptive)
        || defaultSet);

    if (shouldBeDefault || shouldRemoveDefault) {
      stream.outputArgs?.push(
        `-c:${index}`,
        'copy',
        `-disposition:${index}`,
        getFFMPEGDisposition(shouldBeDefault, stream.disposition),
      );

      if (shouldBeDefault) {
        defaultSet = true;
        args.jobLog(
          `Stream ${index} (language ${streamLanguage}, channels ${streamChannels}) set as default`,
        );
      } else {
        args.jobLog(
          `Stream ${index} (language ${streamLanguage}, channels ${streamChannels}, `
          + `descriptive ${isDescriptive}) set as not default`,
        );
      }

      shouldProcess = true;
    }
  });

  if (shouldProcess) {
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.streams = streams;
  } else {
    args.jobLog('No stream to modify');
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: shouldProcess ? 1 : 2,
    variables: args.variables,
  };
};

export { details, plugin };
