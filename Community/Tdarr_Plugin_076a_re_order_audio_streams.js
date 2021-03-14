/* eslint-disable */
module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_076a_re_order_audio_streams",
    Stage: "Pre-processing",
    Name: "Re-order audio streams",
    Type: "",
    Operation: "Transcode",
    Description: `[Contains built-in filter] Specify a language tag for Tdarr to try and put as 1st audio track  \n\n`,
    Version: "1.00",
    Link: "",
    Tags: "pre-processing,audio only,ffmpeg,configurable",
    Inputs: [
      {
        name: "preferred_language",
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

module.exports.plugin = function plugin(file, librarySettings, inputs) {
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

  if (file.ffProbeData.streams[0].codec_type.toLowerCase() == "video") {
    ffmpegCommand += ` -map 0:v `;
  }

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

  ffmpegCommand += ` -map 0:a:${streamIdx} -disposition:a:${streamIdx} default`;

  for (var i = 0; i < allAudioTracks.length; i++) {
    if (i !== streamIdx) {
      ffmpegCommand += ` -map 0:a:${i} -disposition:a:${i} none `;
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
