/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_tws101_Remove_Commentary',
  Stage: 'Pre-processing',
  Name: 'tws101 audio remove commentary',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin removes commentary from audio streams. \n\n',
//    Created by tws101 
//    Release version
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,audio only',
  Inputs: []
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let convert = false;
  let audioIdx = 0;
  let audioStreamsRemoved = 0;
  const audioStreamCount = file.ffProbeData.streams.filter(
    (row) => row.codec_type.toLowerCase() === 'audio',
  ).length;

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    let removeTrack = false;
    // Catch error here incase the language metadata is completely missing.
    try {
      // Check if stream is audio
      // AND checks if it is commentary.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio' &&
        (file.ffProbeData.streams[i].tags.title
          .toLowerCase()
          .includes('commentary') ||
        file.ffProbeData.streams[i].tags.title
          .toLowerCase()
          .includes('description') ||
        file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh'))
      ) {
        removeTrack = true;
        response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as being descriptive, removing. \n`;
      }
    } catch (err) {
      // Error
    }

    if (removeTrack) {
      audioStreamsRemoved += 1;
      ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
      convert = true;
    }
    // Check if stream type is audio and increment audioIdx if true.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
      audioIdx += 1;
    }
  }

  // Failsafe to cancel processing if all streams would be removed following this plugin. We don't want no audio.
  if (audioStreamsRemoved === audioStreamCount) {
    response.infoLog += '☒Cancelling plugin otherwise all audio tracks would be removed. \n';
    response.processFile = false;
    return response;
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.container = `.${file.container}`;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain audio tracks detected as being descriptive.\n";
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;