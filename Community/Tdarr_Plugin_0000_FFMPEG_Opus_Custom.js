const details = () => ({
  id: 'Tdarr_Plugin_0000_FFMPEG_Opus_Custom',
  Stage: 'Pre-processing',
  Name: 'FFMPEG Opus Custom',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: '[Contains built-in filter] This plugin transcodes non Opus audio streams into Opus, giving you a basic bitrate control. Video/subtitles/attachments not affected.  \n\n',
  Version: '1.1',
  Tags: 'pre-processing,ffmpeg,opus,audio only',
  Inputs: [
    {
      name: 'bitrate',
      type: 'string',
      defaultValue: '128k',
      inputUI: {
        type: 'dropdown',
        options: ['16k', '32k', '48k', '64k', '96k', '128k', '192k', '256k', '320k'],
      },
      tooltip: 'Select the audio bitrate to use for the Opus codec.',
    },
    {
      name: 'maxchannels',
      type: 'string',
      defaultValue: 'Stereo',
      inputUI: {
        type: 'dropdown',
        options: ['Mono', 'Stereo', '2.1', 'Quadrophonic', '5.1', '7.1'],
      },
      tooltip: 'Select the maximum number of channels to use for the Opus codec.',
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const bitrate = inputs.bitrate ?? '128k';
  const channelMapping = {
    Mono: 1,
    Stereo: 2,
    '2.1': 3,
    Quadrophonic: 4,
    '5.1': 6,
    '7.1': 8,
  };
  const maxchannels = channelMapping[inputs.maxchannels ?? 'Stereo'];

  const is5Point1Side =
    file.ffProbeData.streams.some(
      (s) =>
        s.codec_type === 'audio' &&
        s.channels === 6 &&
        s.channel_layout === '5.1(side)'
    );

  //  Workaround to force channel output to 6 if 5.1(side) detected
  const adjustedChannels = is5Point1Side ? 6 : maxchannels;

  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video! \n';
    return response;
  }
  response.infoLog += '☑File is a video! \n';

  if (file.ffProbeData.streams.some((s) => s.codec_name === 'opus')) {
    response.processFile = false;
    response.infoLog += '☑File already has Opus audio codec! \n';
    return response;
  }

  response.processFile = true;
  response.preset = `,-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy -c:a libopus -ac ${adjustedChannels} -compression_level 10 -b:a ${bitrate} -application audio`;
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += '☒File does not have Opus codec! \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
