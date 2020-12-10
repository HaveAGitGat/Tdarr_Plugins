/* eslint-disable */
function details() {
  return {
    id: "Tdarr_Plugin_vdka_Remove_DataStreams",
    Stage: "Pre-processing",
    Name: "Remove Data Streams ",
    Type: "Video",
    Description: `[Contains built-in filter] This plugin removes data streams if detected. The output container is the same as the original. Helps with issues like bin_data making files impossible to process. \n\n`,
    Version: "1.00",
    Link:
      "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_vdka_Remove_DataStreams.js",
    Tags: "pre-processing,ffmpeg",
  };
}

function plugin(file) {
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
