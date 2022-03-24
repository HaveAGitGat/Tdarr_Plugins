/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_fu85_aune_pcm_to_flac",
    Stage: "Pre-processing",
    Name: 'Aune - PCM to FLAC',
    Type: "Audio",
    Operation: "Transcode",
    Description: '[Contains built-in filter] This plugin transcodes all 16 and 24bit WAV-tracks (PCM codec) to FLAC. '
        + 'It ignores files that contains video streams and is made for music libraries.\n\n',
    Version: "1.00",
    Tags: "ffmpeg",
    Inputs:[],
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object at some point in the function else plugin will fail.

  let response = {
    processFile: false,
    preset: '<io> -f flac',
    container: ".flac",
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "",
  };

  if (file.ffProbeData.streams.filter((x) => x.codec_type === 'video' && x.avg_frame_rate !== '0/0').length) {
    response.infoLog += '☒File contains video!\n';
    return response;
  }
 
  // Either transcode to FLAC (lossless) or ignore file
  if (file.ffProbeData.streams.filter(
    (x) => x.codec_type.toLowerCase() === 'audio' && (x.codec_name.toLowerCase() === 'pcm_s16be' || x.codec_name.toLowerCase() === 'pcm_s16le' || x.codec_name.toLowerCase() === 'pcm_s24be' || x.codec_name.toLowerCase() === 'pcm_s24le' || x.codec_name.toLowerCase() === 'pcm_u16be' || x.codec_name.toLowerCase() === 'pcm_u16le' || x.codec_name.toLowerCase() === 'pcm_u24be' || x.codec_name.toLowerCase() === 'pcm_u24le'),
  ).length) {
    response.processFile = true;
    response.infoLog += '☒Found 16 or 24bit PCM codec!\n';
    return response;
  }
  response.infoLog += '☑No valid PCM codec found!\n';
  return response;
};


module.exports.details = details;
module.exports.plugin = plugin;