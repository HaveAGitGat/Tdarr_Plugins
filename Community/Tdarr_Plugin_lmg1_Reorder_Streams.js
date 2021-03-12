/* eslint-disable */
function details() {
  return {
    id: "Tdarr_Plugin_lmg1_Reorder_Streams",
    Stage: "Pre-processing",
    Name: "Tdarr_Plugin_lmg1_Reorder_Streams ",
    Type: "Video",
    Description: `[Contains built-in filter] This plugin will move the video stream to the front so Tdarr will recognize the codec correctly.\n\n`,
    Version: "1.00",
    Link: "https://github.com/luigi311/Tdarr_Plugin_lmg1_Reorder_Streams",
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

    response.infoLog += " File is not video\n";
    response.processFile = false;

    return response;
  } else {
    response.FFmpegMode = true;
    response.container = "." + file.container;

    if (file.ffProbeData.streams[0].codec_type != "video") {
      response.infoLog += "Video is not in the first stream";
      response.preset =
        ",-map 0:v? -map 0:a? -map 0:s? -map 0:d? -map 0:t? -c copy";
      response.reQueueAfter = true;
      response.processFile = true;

      return response;
    } else {
      response.infoLog += "File has video in first stream\n";
    }

    response.infoLog += " File meets conditions!\n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
