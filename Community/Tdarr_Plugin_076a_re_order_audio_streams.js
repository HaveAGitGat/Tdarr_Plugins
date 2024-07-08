/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_076a_re_order_audio_streams",
    Stage: "Pre-processing",
    Name: "Re-order Audio Streams",
    Type: "Audio",
    Operation: "Transcode",
    Description: `[Contains built-in filter] Specify a language tag for Tdarr to try and put as 1st audio track  \n\n`,
    Version: "1.00",
    Tags: "pre-processing,audio only,ffmpeg,configurable",
    Inputs: [
      {
        name: "preferred_language",
        type:'string',
        defaultValue:'eng',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify one language tag for Tdarr to try and put as 1st audio track

        \\nExample:\\n

        eng

        \\nExample:\\n

        en

        \\nExample:\\n

        fr

        \\nExample:\\n

        de
 
        `,
      },
    ],
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",
  };

  console.log(inputs.preferred_language);

  if (inputs.preferred_language === undefined) {
    response.processFile = false;
    response.infoLog += "☒ Inputs not entered! \n";
    return response;
  }

  var desiredTrackPosition = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type.toLowerCase() == "video"
  ).length;

  var audioInLang = file.ffProbeData.streams.filter((stream) => {
    if (
      stream.codec_type.toLowerCase() == "audio" &&
      stream.tags &&
      stream.tags.language &&
      inputs.preferred_language.includes(stream.tags.language.toLowerCase())
    ) {
      return true;
    }

    return false;
  });

  if (audioInLang.length == 0) {
    response.processFile = false;
    response.infoLog += "☒ No audio tracks in desired language! \n";
    return response;
  }

  var streamToMove = audioInLang[0];

  if (streamToMove.index == desiredTrackPosition) {
    response.processFile = false;
    response.infoLog += "☑ Preferred language is already first audio track! \n";
    return response;
  }

  var ffmpegCommand = ", -c copy";

  ffmpegCommand += ` -map 0:v? `;

  var allAudioTracks = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type.toLowerCase() == "audio"
  );

  var streamIdx;

  for (var i = 0; i < allAudioTracks.length; i++) {
    if (allAudioTracks[i].index == streamToMove.index) {
      streamIdx = i;
      break;
    }
  }

  ffmpegCommand += ` -map 0:a:${streamIdx} -disposition:a:0 default`;

  for (var i = 0; i < allAudioTracks.length; i++) {
    if (i !== streamIdx) {
      ffmpegCommand += ` -map 0:a:${i} `;
    }
    if (i !== 0) {
      ffmpegCommand += ` -disposition:a:${i} 0 `;
    }
  }

  ffmpegCommand += ` -map 0:s? -map 0:d? `;

  response.processFile = true;
  response.preset = ffmpegCommand;
  response.container = `.` + file.container;
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += `☒ Desired audio lang is not first audio stream, moving! \n`;
  return response;
};





module.exports.details = details;
module.exports.plugin = plugin;