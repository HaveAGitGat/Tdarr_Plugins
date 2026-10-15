/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_c0r1_SetDefaultAudioStream",
    Stage: "Pre-processing",
    Name: "Set Default Audio Stream (Based On Channel Count)",
    Type: "Audio",
    Operation: "Transcode",
    Description: `This plugin will set an audio channel (2.0, 5.1, 7.1) to default and remove default from all other audio streams \n\n`,
    Version: "0.1.0a",
    Tags: "audio only,ffmpeg,configurable",

    Inputs: [
      {
        name: "channels",
        type: 'string',
        defaultValue:'2',
        inputUI: {
          type: 'text',
        },
        tooltip: `Desired audio channel number.

      \\nExample:\\n

      2

      \\nExample:\\n

      6

      \\nExample:\\n

      8`,
      },
    ],
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
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
  var totalDefaultAudioStreams = 0;
  var matchingAudioStreams = 0;
  var matchingDefaultAudioStreams = 0;
  var defaultSet = false;
  var ffmpegCommandInsert = "";

  // Check if default audio stream matches user's channel selection. Defaults are
  // counted across all audio streams so a non-matching default is also caught
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === "audio") {
      var isDefault = file.ffProbeData.streams[i].disposition.default === 1;
      if (isDefault) {
        totalDefaultAudioStreams++;
      }
      if (file.ffProbeData.streams[i].channels == inputs.channels) {
        matchingAudioStreams++;
        if (isDefault) {
          matchingDefaultAudioStreams++;
        }
      }
    }
  }

  // Already correct when the only default audio stream is a matching one
  var alreadyCorrect =
    totalDefaultAudioStreams === 1 && matchingDefaultAudioStreams === 1;

  // build command
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === "audio") {
      if (file.ffProbeData.streams[i].channels == inputs.channels) {
        if (!defaultSet) {
          ffmpegCommandInsert += `-disposition:${i} default `;
          defaultSet = true;
        } else {
          ffmpegCommandInsert += `-disposition:${i} 0 `;
        }
      } else {
        ffmpegCommandInsert += `-disposition:${i} 0 `;
      }
    }
  }

  // Only process when there is a matching stream and the file isn't already correct
  if (matchingAudioStreams >= 1 && !alreadyCorrect) {
    shouldProcess = true;
    response.infoLog += "☒ Matching audio stream is not set to default. \n";
  }

  if (shouldProcess) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 -c copy ${ffmpegCommandInsert}`;
    response.infoLog +=
      "☒ Setting " +
      inputs.channels +
      " channel matching audio stream to default. Remove default from all other audio streams \n";
  } else {
    if (matchingAudioStreams < 1) {
      response.infoLog +=
        "☑ No " + inputs.channels + " channel audio stream exists. \n ";
    } else {
      response.infoLog +=
        "☑ Default " +
        inputs.channels +
        " channel audio stream already exists. \n ";
    }

    response.processFile = false;
  }
  return response;
};



module.exports.details = details;
module.exports.plugin = plugin;