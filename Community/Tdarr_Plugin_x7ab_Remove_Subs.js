/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_x7ab_Remove_Subs",
    Stage: "Pre-processing",
    Name: "Remove Subtitles",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin removes subtitles if detected. The output container is the same as the original. \n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg,subtitle only",
    Inputs: [],
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
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  } else {
    response.FFmpegMode = true;
    response.container = "." + file.container;

    var hasSubs = false;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle"
        ) {
          hasSubs = true;
        }
      } catch (err) {}
    }

    if (hasSubs) {
      response.infoLog += "☒File has subs \n";
      response.preset = ",-sn -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has no subs \n";
    }

    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
