/* eslint-disable */
function details() {
  return {
    id: "Tdarr_Plugin_075a_FFMPEG_HEVC_Generic",
    Stage: "Pre-processing",
    Name: "FFMPEG H265",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin transcodes non h265 files into h265 mkv using default settings. Audio/subtitles not affected.  \n\n`,
    Version: "1.00",
    Link:
      "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_075a_FFMPEG_HEVC_Generic.js",
    Tags: "pre-processing,ffmpeg,h265,video only",
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
    response.processFile = false;
    response.infoLog += "☒File is not a video! \n";
    return response;
  } else {
    response.infoLog += "☑File is a video! \n";
  }

  if (file.ffProbeData.streams[0].codec_name == "hevc") {
    response.processFile = false;
    response.infoLog += "☑File is already in hevc! \n";
    return response;
  }

  response.processFile = true;
  response.preset = `,-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy -c:v:0 libx265 -max_muxing_queue_size 9999`;
  response.container = ".mkv";
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += `☒File is not hevc! \n`;
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
