const details = () => ({
  id: 'Tdarr_Plugin_x7ac_Remove_Closed_Captions',
  Stage: 'Pre-processing',
  Name: 'Remove Burned Closed Captions',
  Type: 'Video',
  Operation: 'Transcode',
  Description:
      '[Contains built-in filter] If detected, closed captions (XDS,608,708) will be removed from streams.',
  Version: '1.01',
  Tags: 'pre-processing,ffmpeg,subtitle only',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    // eslint-disable-next-line no-useless-escape
    preset: ',-map 0 -codec copy -bsf:v \"filter_units=remove_types=6\"',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒File is not video \n';
    return response;
  }
  // Check if Closed Captions are set at file level
  if (file.hasClosedCaptions) {
    response.processFile = true;
    response.infoLog += '☒This file has closed captions \n';
    return response;
  }
  // If not, check for Closed Captions in the streams
  const { streams } = file.ffProbeData;
  streams.forEach((stream) => {
    if (stream.closed_captions) {
      response.processFile = true;
    }
  });

  response.infoLog += response.processFile ? '☒This file has burnt closed captions \n'
    : '☑Closed captions have not been detected on this file \n';
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
