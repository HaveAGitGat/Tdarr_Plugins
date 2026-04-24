/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_r002_rootuser_FFMPEG_HQ_HEVC_MKV_Animation",
    Stage: "Pre-processing",
    Name: "FFMPEG HQ 10-bit HEVC MKV For Animation",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] High Quality FFMPEG transcoding settings for Animation. Converts all audio to AAC 512K. Preserves track names, metadata and attachments/fonts. Proper use of x265-params. CRF 18. Preset medium. 10-Bit Video encoding. Skips h.265 encoded videos. The output container is mkv. \n\n`,
    Version: "1.1",
    Tags: "pre-processing,ffmpeg,h265,aac,10bit,anime,",
    Inputs:[],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var transcode = 0; //if this var changes to 1 the file will be transcoded

  //default values that will be returned
  var response = {
    processFile: false,
    preset: "",
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "",
  };

  //check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== "video") {
    response.processFile = false;
    response.infoLog += "☒File is not a video! \n";
    return response;
  } else {
    response.infoLog += "☑File is a video! \n";
  }

  //check if the file is already hevc, it will not be transcoded if true and the function will be stopped immediately
  if (file.ffProbeData.streams[0].codec_name == "hevc") {
    response.processFile = false;
    response.infoLog += "☑File is already in hevc! \n";
    return response;
  }

  //Transcoding options
  {
    response.preset =
      ",-map 0 -c:s copy -movflags use_metadata_tags -c:a aac -b:a 512k -c:v:0 libx265 -preset medium -x265-params crf=18:tune=animation:qcomp=0.7:aq-strength=1.1 -pix_fmt yuv420p10le -f matroska";
    transcode = 1;
  }

  //check if the file is eligible for transcoding
  //if true the neccessary response values will be changed
  if (transcode == 1) {
    response.processFile = true;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution} but is not hevc!\n`;
    response.infoLog += `☒File will be transcoded!\n`;
  }

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
