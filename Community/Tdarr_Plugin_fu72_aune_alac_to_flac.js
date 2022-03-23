function details() {
    return {
      id: 'Tdarr_Plugin_fu72_aune_alac_to_flac',
      Stage: 'Pre-processing',
      Name: 'Aune - ALAC to Flac',
      Type: 'Audio',
      Operation: 'Transcode',
      Description: '[Contains built-in filter] This plugin transcodes all ALAC-tracks to FLAC. '
        + 'It ignores files that contains video streams and is made for music libraries.\n\n',
      Version: '1.00',
      Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_fu72_aune_alac_to_flac.js',
      Tags: 'pre-processing,ffmpeg,audio only',
    };
  }
   
  // eslint-disable-next-line no-unused-vars
  function plugin(file, librarySettings, inputs, otherArguments) {
    const lib = require('../methods/lib')();
    // eslint-disable-next-line no-unused-vars,no-param-reassign
    inputs = lib.loadDefaultValues(inputs, details);
    const response = {
      processFile: false,
      preset: '<io> -f flac',
      container: '.flac',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '',
    };
   
    if (file.ffProbeData.streams.filter((x) => x.codec_type === 'video' && x.avg_frame_rate !== '0/0').length) {
      response.infoLog += '☒File contains video!\n';
      return response;
    }
   
    // Either transcode to FLAC (lossless) or ignore file
    if (file.ffProbeData.streams.filter(
      (x) => x.codec_type.toLowerCase() === 'audio' && x.codec_name.toLowerCase() === 'alac',
    ).length) {
      response.processFile = true;
      response.infoLog += '☒Found ALAC codec!\n';
      return response;
    }
    response.infoLog += '☑No ALAC codec found!\n';
    return response;
  }
   
  module.exports.details = details;
  module.exports.plugin = plugin;
