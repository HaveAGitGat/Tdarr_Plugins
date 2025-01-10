import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
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
      label: 'Use Radarr or Sonarr to get original language',
      name: 'useRadarrOrSonarr',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Should the language of the default subtitle track be read from Radarr or Sonarr ? If yes, '
        + 'the "Set Flow Variables From Radarr Or Sonarr" has to be run before and the Language property will be '
        + 'ignored. If no, please indicate the language to use in the Language property.',
    },
    {
      label: 'Language',
      name: 'language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify what language to use in the ISO 639-2 format.'
        + '\\nExample:\\n'
        + 'eng\\n'
        + 'fre\\n',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Default has been set',
    },
    {
      number: 2,
      tooltip: 'No default has been set',
    },
  ],
});

interface IDisposition {
  default: number,
  dub: number,
  original: number,
  comment: number,
  lyrics: number,
  karaoke: number,
  forced: number,
  hearing_impaired: number,
  visual_impaired: number,
  clean_effects: number,
  attached_pic: number,
  timed_thumbnails: number,
  captions: number,
  descriptions: number,
  metadata: number,
  dependent: number,
  still_image: number,
}

interface IStreamDisposition {
  disposition?: IDisposition
  tags?: { title?: string }
}

const getFFMPEGDisposition = (isDefault: boolean, dispositions?: IDisposition): string => {
  if (!dispositions) return isDefault ? 'default' : '0';

  const previousDispositions = Object.entries(dispositions)
    .reduce((acc, [key, value]) => {
      if (key !== 'default' && value === 1) {
        acc.push(key);
      }
      return acc;
    }, [] as string[]);

  return [
    isDefault ? 'default' : '',
    ...previousDispositions,
  ]
    .filter(Boolean)
    .join('+')
    || '0';
};

const getIsDescriptiveSubtitleStream = (stream: IStreamDisposition): boolean => Boolean(stream.disposition
  && (stream.disposition.comment
    || stream.disposition.descriptions
    || stream.disposition.visual_impaired
    || /\b(commentary|description|descriptive)\b/gi.test(stream.tags?.title || '')));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  // const streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));
  const { streams } = args.variables.ffmpegCommand;

  let shouldProcess = false;
  let defaultSet = false;

  // Sets the language code used to determine the default subtitle stream
  let languageCode = args.inputs.language;
  if (args.inputs.useRadarrOrSonarr) {
    languageCode = args.variables.user.ArrOriginalLanguageCode;
    args.jobLog(`Language ${languageCode} read from flow variables`);
  }

  streams.forEach((stream, index) => {
    if (stream.codec_type === 'subtitle') {
      const dispositions = (stream as IStreamDisposition).disposition;
      const isDescriptiveSubtitleStream = getIsDescriptiveSubtitleStream(stream as IStreamDisposition);
      if ((stream.tags?.language ?? '') === languageCode
        && (dispositions?.default ?? 0) === 0
        && !isDescriptiveSubtitleStream
        && !defaultSet) {
        args.jobLog(`Stream ${index} (language ${languageCode}) set has default`);
        stream.outputArgs.push(
          `-c:${index}`,
          'copy',
          `-disposition:${index}`,
          getFFMPEGDisposition(true, dispositions),
        );
        defaultSet = true;
        shouldProcess = true;
      } else if ((dispositions?.default ?? 0) === 1
        && ((stream.tags?.language ?? '') !== languageCode
        || isDescriptiveSubtitleStream)) {
        args.jobLog(`Stream ${index} (language ${languageCode}, descriptive ${isDescriptiveSubtitleStream}) `
          + 'set has not default');
        stream.outputArgs.push(
          `-c:${index}`,
          'copy',
          `-disposition:${index}`,
          getFFMPEGDisposition(false, dispositions),
        );
        shouldProcess = true;
      }
    }
  });

  if (shouldProcess) {
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.streams = streams;
  } else args.jobLog('No stream to modify');

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: shouldProcess ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
