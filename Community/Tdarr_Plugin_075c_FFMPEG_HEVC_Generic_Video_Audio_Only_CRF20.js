/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_075c_FFMPEG_HEVC_Generic_Video_Audio_Only_CRF20",
    Stage:'Pre-processing',
    Name: "FFMPEG H265 Video + Audio Kept Only With CRF 20",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin transcodes non h265 files into h265 mkv using default settings. Only video and audio streams are kept. Useful for if you're getting errors because of certain containers not being able to handle certain subtitle/data streams. A CRF value of 20 is used. \n\n`,
    Version: "1.00",
    Tags: "pre-processing,video only,ffmpeg,h265",
    Inputs:[]
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

  if (file.ffProbeData.streams[0].codec_name == "hevc") {
    response.processFile = false;
    response.infoLog += "☑File is already in hevc! \n";
    return response;
  }

  response.processFile = true;
  response.preset = `,-map 0:v -map 0:a -c copy -c:v:0 libx265 -crf 20`;
  response.container = ".mkv";
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += `☒File is not hevc! \n`;
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
