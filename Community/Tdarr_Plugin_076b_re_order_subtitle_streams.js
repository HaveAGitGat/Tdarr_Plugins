/* eslint-disable */
module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_076b_re_order_subtitle_streams",
    Stage: "Pre-processing",
    Name: "Re-order subtitle streams",
    Type: "",
    Operation: "Transcode",
    Description: `[Contains built-in filter] Specify a language tag for Tdarr to try and put as 1st subtitle track  \n\n`,
    Version: "1.00",
    Link: "",
    Tags: "pre-processing,subtitle only,ffmpeg,configurable",
    Inputs: [
      {
        name: "preferred_language",
        tooltip: `Specify one language tag for Tdarr to try and put as 1st subtitle track

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
    (stream) =>
      stream.codec_type.toLowerCase() == "video" ||
      stream.codec_type.toLowerCase() == "audio"
  ).length;

  var subtitleInLang = file.ffProbeData.streams.filter((stream) => {
    if (
      stream.codec_type.toLowerCase() == "subtitle" &&
      stream.tags &&
      stream.tags.language &&
      inputs.preferred_language.includes(stream.tags.language.toLowerCase())
    ) {
      return true;
    }

    return false;
  });

  if (subtitleInLang.length == 0) {
    response.processFile = false;
    response.infoLog += "☒ No subtitle tracks in desired language! \n";
    return response;
  }

  var streamToMove = subtitleInLang[0];

  if (streamToMove.index == desiredTrackPosition) {
    response.processFile = false;
    response.infoLog +=
      "☑ Preferred language is already first subtitle track! \n";
    return response;
  }

  var ffmpegCommand = ", -c copy ";

  if (file.ffProbeData.streams[0].codec_type.toLowerCase() == "video") {
    ffmpegCommand += ` -map 0:v -map 0:a `;
  }

  var allSubtitleTracks = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type.toLowerCase() == "subtitle"
  );

  var streamIdx;

  for (var i = 0; i < allSubtitleTracks.length; i++) {
    if (allSubtitleTracks[i].index == streamToMove.index) {
      streamIdx = i;
      break;
    }
  }

  ffmpegCommand += ` -map 0:s:${streamIdx} -disposition:s:${streamIdx} default`;

  for (var i = 0; i < allSubtitleTracks.length; i++) {
    if (i !== streamIdx) {
      ffmpegCommand += ` -map 0:s:${i} -disposition:a:${i} none `;
    }
  }

  ffmpegCommand += ` -map 0:d? `;

  response.processFile = true;
  response.preset = ffmpegCommand;
  response.container = `.` + file.container;
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += `☒ Desired subtitle lang is not first subtitle stream, moving! \n`;
  return response;
};
