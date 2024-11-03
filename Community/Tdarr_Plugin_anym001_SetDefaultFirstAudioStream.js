/* eslint-disable */
const details = () => {
  return {
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
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    processFile: false,
    preset: "",
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: "",
  };

  var shouldProcess = false;
  var defaultAudioStreams = 0;
  var firstdefaultAudioStream = 0;
  var matchingAudioStreams = 0;
  var firstmatchingAudioStream = 0;
  var defaultSet = false;
  var ffmpegCommandInsert = "";

  // Check if the audio streams meet the defined condition
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === "audio") {
      firstmatchingAudioStream++;
      matchingAudioStreams++;
      if (firstmatchingAudioStream === 1 && file.ffProbeData.streams[i].disposition.default === 1) {
        firstdefaultAudioStream++;
      }
      if (file.ffProbeData.streams[i].disposition.default === 1) {
        defaultAudioStreams++;
      }
    }
  }

  // build command
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === "audio") {
      if (!defaultSet) {
        ffmpegCommandInsert += `-disposition:${i} default `;
        defaultSet = true;
      } 
      else {
        ffmpegCommandInsert += `-disposition:${i} 0 `;
      }
    }
  }

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
    response.reQueueAfter = true;
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
