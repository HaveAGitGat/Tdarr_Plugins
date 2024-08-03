/* eslint-disable */
const details = () => ({
  id: "Tdarr_Plugin_anym001_SetDefaultFirstAudioStream",
  Stage: "Pre-processing",
  Name: "Set first audio stream to default",
  Type: "Audio",
  Operation: "Transcode",
  Description: `This plugin will set the first audio to default and remove default from all other audio streams \n\n`,
  Version: "1.0.0",
  Tags: "audio only,ffmpeg",
  Inputs: [
  ],
});

/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
function loopOverStreamsOfType(file, type, method) {
    let id = 0;
    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
        method(file.ffProbeData.streams[i], id);
        id++;
      }
    }
  }

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: '',
    processFile: false,
    preset: ' , ',
    reQueueAfter: true,
  };

  let shouldProcess = false;
  let defaultAudioStreams = 0;
  let firstdefaultAudioStream = 0;
  let matchingAudioStreams = 0;
  let firstmatchingAudioStream = 0;
  let defaultSet = false;
  let ffmpegCommandInsert = "";

  // Check if the audio streams meet the defined condition
  function audioCheck(stream, id) {
    firstmatchingAudioStream++;
    matchingAudioStreams++;
    if (firstmatchingAudioStream === 1 && stream.disposition.default === 1) {
      firstdefaultAudioStream++;
    }
    if (stream.disposition.default === 1) {
      defaultAudioStreams++;
    }
  }

  loopOverStreamsOfType(file, 'audio', audioCheck);

  function audioProcess(stream, id) {
    if (!defaultSet) {
      ffmpegCommandInsert += `-disposition:a:${id} default `;
      defaultSet = true;
    } else {
      ffmpegCommandInsert += `-disposition:a:${id} 0 `;
    }
  }

  loopOverStreamsOfType(file, 'audio', audioProcess);

  // Only process when there is a matching stream and
  // when there is either no default or more than 1 default stream set
  if (matchingAudioStreams >= 1 && defaultAudioStreams >= 2) {
    shouldProcess = true;
    response.infoLog += "☒ More then one audio stream is set to default. \n";
  }
  
  if (matchingAudioStreams >= 1 && firstdefaultAudioStream !== 1) {
    shouldProcess = true;
    response.infoLog += "☒ First audio stream is not set to default. \n";
  }

  if (shouldProcess) {
    response.processFile = true;
    response.preset = `,-map 0 -c copy ${ffmpegCommandInsert}`;
    response.infoLog +=
      "☒ Setting first audio stream to default. Remove default from all other audio streams \n";
  } else {
    if (matchingAudioStreams < 1) {
      response.infoLog +=
        "☑ No audio stream exists. \n ";
    } else if (firstdefaultAudioStream === 1) {
      response.infoLog +=
        "☑ First audio stream already set to default. \n ";
    } else {
      response.infoLog += "☑ Unexpected: Did not process \n ";
    }

    response.processFile = false;
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
