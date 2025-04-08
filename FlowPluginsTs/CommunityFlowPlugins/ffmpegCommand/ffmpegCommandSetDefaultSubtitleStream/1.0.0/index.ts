import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

// Optimized plugin details with better type safety
const details = (): IpluginDetails => ({
  name: 'Set Default Subtitle Stream',
  description: 'Sets the default subtitle track based on language',
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
      label: 'Allow descriptive streams to be default',
      name: 'allowDescriptive',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: { type: 'switch' },
      tooltip: 'If set to yes, descriptive streams will not be discarded when finding the default stream.',
    },
    {
      label: 'Allow forced streams to be default',
      name: 'allowForced',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: { type: 'switch' },
      tooltip: 'If set to yes, forced streams will not be discarded when finding the default stream.',
    },
  ],
  outputs: [
    { number: 1, tooltip: 'Default has been set' },
    { number: 2, tooltip: 'No default has been set' },
  ],
});

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
  outputArgs?: string[];
}

const DESCRIPTIVE_KEYWORDS = /\b(commentary|description|descriptive|sdh)\b/gi;
const FORCED_KEYWORDS = /\b(forced|force|forcé|forces|forcés)\b/gi;

const getFFMPEGDisposition = (isDefault: boolean, dispositions?: IDisposition): string => {
  if (!dispositions) return isDefault ? 'default' : '0';

  const activeDispositions = Object.entries(dispositions)
    .filter(([key, value]) => key !== 'default' && value === 1)
    .map(([key]) => key);
  if (isDefault) activeDispositions.unshift('default');

  return activeDispositions.length ? activeDispositions.join('+') : '0';
};

const getIsDescriptiveSubtitleStream = (stream: IStreamDisposition): boolean => {
  const { disposition, tags } = stream;
  return Boolean(
    disposition?.comment
    || disposition?.descriptions
    || disposition?.hearing_impaired
    || DESCRIPTIVE_KEYWORDS.test(tags?.title || ''),
  );
};

const getIsForcedSubtitleStream = (stream: IStreamDisposition): boolean => {
  const { disposition, tags } = stream;
  return Boolean(
    disposition?.forced
    || FORCED_KEYWORDS.test(tags?.title || ''),
  );
};

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  let shouldProcess = false;
  const { streams } = args.variables.ffmpegCommand;
  const { allowDescriptive, allowForced } = args.inputs as {
    allowDescriptive: boolean;
    allowForced: boolean;
  };

  // Sets the language code used to determine the default subtitle stream
  const languageCode = args.inputs.language;

  let defaultSet = false;
  streams.forEach((stream: IStreamDisposition, index: number) => {
    if (stream.codec_type !== 'subtitle') return;

    const streamLanguage = stream.tags?.language ?? '';
    const dispositions = stream.disposition;
    const isDefault = dispositions?.default !== 0;
    const isDescriptive = getIsDescriptiveSubtitleStream(stream);
    const isForced = getIsForcedSubtitleStream(stream);

    const shouldBeDefault = streamLanguage === languageCode
      && !isDefault
      && (!isDescriptive || allowDescriptive)
      && (!isForced || allowForced)
      && !defaultSet;

    const shouldRemoveDefault = isDefault
      && (streamLanguage !== languageCode
        || (isDescriptive && !allowDescriptive)
        || (isForced && !allowForced)
        || defaultSet);

    if (shouldBeDefault || shouldRemoveDefault) {
      stream.outputArgs?.push(
        `-c:${index}`,
        'copy',
        `-disposition:${index}`,
        getFFMPEGDisposition(shouldBeDefault, dispositions),
      );

      if (shouldBeDefault) {
        defaultSet = true;
        args.jobLog(`Stream ${index} (language ${streamLanguage}) set as default`);
      } else {
        args.jobLog(
          `Stream ${index} (language ${streamLanguage}, descriptive ${isDescriptive}, `
          + `forced ${isForced}) set as not default`,
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
