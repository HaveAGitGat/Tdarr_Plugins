/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_sdd3_Remove_Commentary_Tracks",
    Stage: "Pre-processing",
    Name: "Remove Video Commentary Tracks",
    Type: "Video",
    Operation: 'Transcode',
    Description: `[Contains built-in filter] If commentary tracks are detected, they will be removed. \n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg,audio only",
    Inputs:[],
  };
}

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

  if (file.fileMedium !== "video") {
    response.processFile = false;
    response.infoLog += "☒File is not a video! \n";
    return response;
  } else {
    response.infoLog += "☑File is a video! \n";
  }

  var audioIdx = -1;
  var hasCommentaryTrack = false;
  var ffmpegCommandInsert = "";

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    //keep track of audio streams for when removing commentary track
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        audioIdx++;
      }
    } catch (err) {}

    //check if commentary track and passing audio stream number
    try {
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        file.ffProbeData.streams[i].disposition.comment == 1 ||
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        file.ffProbeData.streams[i].tags.title
          .toLowerCase()
          .includes("commentary")
      ) {
        ffmpegCommandInsert += ` -map -0:a:${audioIdx}`;
        hasCommentaryTrack = true;
      }
    } catch (err) {}
  }

  if (hasCommentaryTrack === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
    response.container = "." + file.container;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += "☒File contains commentary tracks. Removing! \n";
    return response;
  } else {
    response.infoLog += "☑File doesn't contain commentary tracks! \n";
  }

  response.processFile = false;
  response.infoLog += "☑File meets conditions! \n";
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
