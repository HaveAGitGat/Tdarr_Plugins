/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_sdf5_Thierrrrry_Remove_Non_English_Audio",
    Stage: "Pre-processing",
    Name: "Remove Non English Audio",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin removes audio tracks which are not English or are not undefined. It ensures at least 1 audio track is left in any language. \n\n
`,
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

  response.FFmpegMode = true;

  //check if files is video

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  }

  var ffmpegCommandInsert = "";
  var audioIdx = -1;
  var hasNonEngTrack = false;
  var audioStreamsRemoved = 0;

  //count number of audio streams
  var audioStreamCount = file.ffProbeData.streams.filter(
    (row) => row.codec_type.toLowerCase() == "audio"
  ).length;

  console.log("audioStreamCount:" + audioStreamCount);

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    //check if current stream is audio, update audioIdx if so
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        audioIdx++;
      }
    } catch (err) {}

    try {
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        !(
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes("eng") ||
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes("und")
        )
      ) {
        audioStreamsRemoved++;

        if (audioStreamsRemoved == audioStreamCount) {
          break;
        }

        ffmpegCommandInsert += ` -map -0:a:${audioIdx}`;
        hasNonEngTrack = true;
      }
    } catch (err) {}
  }

  if (hasNonEngTrack === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
    response.container = "." + file.container;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog +=
      "☒File contains tracks which are not english or undefined. Removing! \n";
    return response;
  } else {
    response.infoLog +=
      "☑File doesn't contain tracks which are not english or undefined! \n";
  }

  response.processFile = false;
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
