import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Default Audio Track',
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
      defaultValue: '5.1',
      inputUI: {
        type: 'dropdown',
        options: ['7.1', '5.1', '2.0'],
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
  const languageCode = args.inputs.useRadarrOrSonarr
    ? args.variables.user.ArrOriginalLanguageCode
    : args.inputs.language;

  // Sets the channels used to determine the default audio stream
  const channels = args.inputs.useHightestNumberOfChannels
    ? streams
      .filter((stream) => stream.codec_type === 'audio' && (stream.tags?.language ?? languageCode === ''))
      ?.sort((stream1, stream2) => ((stream1.channels ?? 0) > (stream2.channels ?? 0) ? 1 : -1))
      ?.at(0)
      ?.channels
    ?? 0
    : args.inputs.channels;

  streams.forEach((stream, index) => {
    if (stream.codec_type === 'audio') {
      if ((stream.tags?.language ?? '') === languageCode
        && (stream.channels ?? 0) === channels
        && !defaultSet) {
        stream.outputArgs.push(`-disposition:${index}`, 'default');
        defaultSet = true;
      } else stream.outputArgs.push(`-disposition:${index}`, '0');
    }
  });

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
