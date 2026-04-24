const details = () => ({
  id: 'Tdarr_Plugin_00td_action_keep_one_audio_stream',
  Stage: 'Pre-processing',
  Name: 'Keep One Audio Stream',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
This action has a built-in filter. Additional filters can be added.\n\n

Tdarr will try to keep the best audio track possible given the requirements specified below.
If the specified stream does not exist, Tdarr will try to create it using the best stream available.
If no specified language track exists, the best untagged/undefined stream will be used/kept.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'audioCodec',
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
      defaultValue: 2,
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
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const { audioCodec, language, channels } = inputs;

  const transcodeKeepOneAudioStream = lib.actions.transcodeKeepOneAudioStream(
    file,
    audioCodec,
    language,
    channels,
  );

  response.preset = transcodeKeepOneAudioStream.preset;
  if (['dca', 'truehd'].includes(audioCodec)) {
    response.preset += ' -strict -2';
  }
  response.container = `.${file.container}`;
  response.handbrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.processFile = transcodeKeepOneAudioStream.processFile;
  response.infoLog += transcodeKeepOneAudioStream.note;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
