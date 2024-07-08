/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_vdka_Remove_DataStreams",
    Stage: "Pre-processing",
    Name: "Remove Data Streams",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin removes data streams if detected. The output container is mkv. Helps with issues like bin_data making files impossible to process. \n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg",
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
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  } else {
    response.FFmpegMode = true;
    response.container = ".mkv";

    var hasData = false;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "data"
        ) {
            hasData = true;
        }
      } catch (err) {}
    }

    if (hasData) {
      response.infoLog += "☒File has data streams \n";
      response.preset = ",-map 0 -c copy -dn -map_chapters -1";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has no data streams! \n";
    }

    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
