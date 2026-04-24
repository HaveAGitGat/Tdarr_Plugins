const details = () => ({
  id: 'Tdarr_Plugin_00td_action_standardise_audio_stream_codecs',
  Stage: 'Pre-processing',
  Name: 'Standardise Audio Stream Codecs',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
This action has a built-in filter. Additional filters can be added.\n\n

All audio tracks which are not in the specified codec will be transcoded
into the specified codec. Bitrate and channel count are kept the same.
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

  const transcodeStandardiseAudioCodecs = lib.actions.transcodeStandardiseAudioCodecs(
    file,
    inputs.audioCodec,
  );

  response.preset = transcodeStandardiseAudioCodecs.preset;
  response.container = `.${file.container}`;
  response.handbrakeMode = false;
  response.ffmpegMode = true;
  response.reQueueAfter = true;
  response.processFile = transcodeStandardiseAudioCodecs.processFile;
  response.infoLog += transcodeStandardiseAudioCodecs.note;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
