const details = () => ({
  id: 'Tdarr_Plugin_00td_action_add_audio_stream_codec',
  Stage: 'Pre-processing',
  Name: 'Add Audio Stream Codec',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This action has a built-in filter. Additional filters can be added above. \n\n

  If the following audio track does not exist, Tdarr will try to add it using existing audio streams.
  Tdarr will try to create the specified audio stream from the highest channel count stream
  available in the specified language.
  If no specified language track exists, the best untagged/undefined stream will be used.
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
    container: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const { audioCodec, language, channels } = inputs;

  const transcodeAddAudioStream = lib.actions.transcodeAddAudioStream(
    file,
    audioCodec,
    language,
    channels,
  );

  response.preset = transcodeAddAudioStream.preset;
  response.container = `.${file.container}`;
  response.handbrakeMode = false;
  response.ffmpegMode = true;
  response.reQueueAfter = true;
  response.processFile = transcodeAddAudioStream.processFile;
  response.infoLog += transcodeAddAudioStream.note;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
