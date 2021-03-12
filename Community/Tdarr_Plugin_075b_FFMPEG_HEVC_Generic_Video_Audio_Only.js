/* eslint-disable */
function details() {
  return {
    id: "Tdarr_Plugin_075b_FFMPEG_HEVC_Generic_Video_Audio_Only",
    Stage: "Pre-processing",
    Name: "FFMPEG H265 Video + Audio Kept Only",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin transcodes non h265 files into h265 mkv using default settings. Only video and audio streams are kept. Useful for if you're getting errors because of certain containers not being able to handle certain subtitle/data streams.  \n\n`,
    Version: "1.00",
    Link:
      "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_075b_FFMPEG_HEVC_Generic_Video_Audio_Only.js",
    Tags: "pre-processing,video only,ffmpeg,h265",
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
  response.preset = `,-map 0:v -map 0:a -c copy -c:v:0 libx265 -max_muxing_queue_size 9999`;
  response.container = ".mkv";
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += `☒File is not hevc! \n`;
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
