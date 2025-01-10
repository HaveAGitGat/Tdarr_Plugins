import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Default Audio Stream',
  description: 'Sets the default audio track based on channels count and Radarr or Sonar',
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
      tooltip: 'Should the language of the default audio track be read from Radarr or Sonarr ? If yes, '
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
    {
      label: 'Use the highest number of channels as default',
      name: 'useHightestNumberOfChannels',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Should the audio stream, matching the language, with the highest number of channels be set '
        + 'as the default audio stream ? If yes, the Channels property will be ignored. If no, please indicate '
        + 'the channels to use in the Channels property.',
    },
    {
      label: 'Channels ',
      name: 'channels',
      type: 'string',
      defaultValue: '6',
      inputUI: {
        type: 'dropdown',
        options: ['8', '6', '2'],
      },
      tooltip: 'Specify what number of channels should be used as the default channel.',
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
}

const addDisposition = (disposition: string, dispositionToAdd: string): string => (dispositionToAdd.length > 0
  ? `${disposition}${disposition.length > 0 ? '+' : ''}${dispositionToAdd}`
  : disposition);

const getFFMPEGDisposition = (stream: IStreamDisposition, isDefault: boolean): string => {
  if (!stream.disposition) return '0';

  const disposition = addDisposition(
    isDefault ? 'default' : '',
    Object.entries(stream.disposition)
      .filter(([value]) => value === '1')
      .map(([key]) => key)
      .join('+'),
  );
  return disposition.length > 0 ? disposition : '0';
};
// addDisposition(disposition, stream.disposition.dub === 1 ? 'dub' : '');
// addDisposition(disposition, stream.disposition.original === 1 ? 'original' : '');
// addDisposition(disposition, stream.disposition.comment === 1 ? 'comment' : '');
// addDisposition(disposition, stream.disposition.lyrics === 1 ? 'lyrics' : '');
// addDisposition(disposition, stream.disposition.karaoke === 1 ? 'karaoke' : '');
// addDisposition(disposition, stream.disposition.forced === 1 ? 'forced' : '');
// addDisposition(disposition, stream.disposition.hearing_impaired === 1 ? 'hearing_impaired' : '');
// addDisposition(disposition, stream.disposition.visual_impaired === 1 ? 'visual_impaired' : '');
// addDisposition(disposition, stream.disposition.clean_effects === 1 ? 'clean_effects' : '');
// addDisposition(disposition, stream.disposition.attached_pic === 1 ? 'attached_pic' : '');
// addDisposition(disposition, stream.disposition.timed_thumbnails === 1 ? 'timed_thumbnails' : '');
// addDisposition(disposition, stream.disposition.captions === 1 ? 'captions' : '');
// addDisposition(disposition, stream.disposition.descriptions === 1 ? 'descriptions' : '');
// addDisposition(disposition, stream.disposition.metadata === 1 ? 'metadata' : '');
// addDisposition(disposition, stream.disposition.dependent === 1 ? 'dependent' : '');
// addDisposition(disposition, stream.disposition.still_image === 1 ? 'still_image' : '');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  // const streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));
  const { streams } = args.variables.ffmpegCommand;

  let defaultSet = false;

  // Sets the language code used to determine the default audio stream
  let languageCode = args.inputs.language;
  if (args.inputs.useRadarrOrSonarr) {
    languageCode = args.variables.user.ArrOriginalLanguageCode;
    args.jobLog(`Language ${languageCode} read from flow variables`);
  }

  // Sets the channels used to determine the default audio stream
  let { channels } = args.inputs;
  if (args.inputs.useHightestNumberOfChannels) {
    channels = streams
      .filter((stream) => stream.codec_type === 'audio' && (stream.tags?.language ?? languageCode === ''))
      ?.sort((stream1, stream2) => (stream2.channels ?? 0) - (stream1.channels ?? 0))
      ?.at(0)
      ?.channels
      ?? 0;
    args.jobLog(`Channels ${channels} determined has being the highest match`);
  }

  streams.forEach((stream, index) => {
    if (stream.codec_type === 'audio') {
      if ((stream.tags?.language ?? '') === languageCode
        && (stream.channels ?? 0) === channels
        && !defaultSet) {
        args.jobLog(`Setting stream ${index} (language ${languageCode}, channels ${channels}) has default`);
        const disposition = getFFMPEGDisposition(stream as IStreamDisposition, true);
        args.jobLog(`Original ${JSON.stringify(stream.disposition ?? {})}; new ${disposition}`);
        stream.outputArgs.push(`-c:${index}`, 'copy', `-disposition:${index}`, disposition);
        defaultSet = true;
      } else {
        const disposition = getFFMPEGDisposition(stream as IStreamDisposition, false);
        args.jobLog(`Original ${JSON.stringify(stream.disposition ?? {})}}; new ${disposition}`);
        stream.outputArgs.push(`-c:${index}`, 'copy', `-disposition:${index}`, disposition);
      }
    }
  });

  if (defaultSet) {
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.streams = streams;
  } else args.jobLog('No matching stream was found');

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: defaultSet ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
