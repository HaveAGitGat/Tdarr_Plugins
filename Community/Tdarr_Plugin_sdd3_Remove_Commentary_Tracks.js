/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_sdd3_Remove_Commentary_Tracks",
    Stage: "Pre-processing",
    Name: "Remove Video Commentary Tracks",
    Type: "Video",
    Operation: 'Transcode',
    Description: `[Contains built-in filter] If commentary or descriptive (optional) tracks are detected, they will be removed. \n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg,audio only",
    Inputs: [{
      name: 'descriptive',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `
  Specify if descriptive audio tracks should also be removed. 
  Optional. Will remove audio tracks that contain the words "AD", "SDH", "description" or "descriptive" in the title (case insensitive) or are tagged as descriptions, visual_impaired or hearing_impaired in the dispositions.
                 \\nExample:\\n
                 true
  
                 \\nExample:\\n
                 false`,
    }],
  };
}

const isCommentaryAudioStream = (stream) => stream.disposition.comment == 1 || /\bcommentary\b/gi.test(stream.tags?.title || '');
const isDescriptiveAudioStream = (stream) => stream.disposition.hearing_impaired === 1 || stream.disposition.descriptions === 1 || stream.disposition.visual_impaired === 1 || /\b(ad|sdh|description|descriptive)\b/gi.test(stream.tags?.title || '');

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
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio"
        && (isCommentaryAudioStream(file.ffProbeData.streams[i])
          || (inputs.descriptive === true && isDescriptiveAudioStream(file.ffProbeData.streams[i])))) {
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
