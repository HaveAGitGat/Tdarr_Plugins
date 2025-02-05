/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_sdd3_Remove_Commentary_Tracks",
    Stage: "Pre-processing",
    Name: "Remove Video Commentary Tracks",
    Type: "Video",
    Operation: 'Transcode',
    Description: `[Contains built-in filter] If commentary or descriptive tracks are detected, they will be removed. \n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg,audio only",
    Inputs: [],
  };
}

const isSDHAudioStream = (stream) => stream.disposition.hearing_impaired === 1 || /\b(ad|sdh)\b/gi.test(stream.tags?.title || '');
const isDescriptiveAudioStream = (stream) => stream.disposition.comment == 1 || stream.disposition.descriptions === 1 || stream.disposition.visual_impaired === 1 || /\b(commentary|description|descriptive)\b/gi.test(stream.tags?.title || '');

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
    //keep track of audio streams for when removing tracks
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        audioIdx++;
      }
    } catch (err) { }

    //check if commentary or descriptive track and passing audio stream number
    try {
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        (isSDHAudioStream(file.ffProbeData.streams[i]) || isDescriptiveAudioStream(file.ffProbeData.streams[i]))) {
        ffmpegCommandInsert += ` -map -0:a:${audioIdx}`;
        hasCommentaryTrack = true;
      }
    } catch (err) { }
  }

  if (hasCommentaryTrack === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
    response.container = "." + file.container;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += "☒File contains commentary or descriptive tracks. Removing! \n";
    return response;
  } else {
    response.infoLog += "☑File doesn't contain commentary or descriptive tracks! \n";
  }

  response.processFile = false;
  response.infoLog += "☑File meets conditions! \n";
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
