/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_e3jc_Tharic_H.264_MKV_480p30_No_Subs_No_Title_Meta",
    Stage: "Pre-processing",
    Name: "H.264 MKV 480p30, No Subs No, Title Meta",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin removes subs, metadata (if a title exists) and makes sure the video is h264 480p mkv. \n\n
`,
    Version: "1.00",
    Tags: "pre-processing,handbrake,ffmpeg,h264",
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

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  } else {
    var jsonString = JSON.stringify(file);

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

    //

    if (
      file.ffProbeData.streams[0].codec_name != "h264" ||
      file.ffProbeData.streams[0].width > 720 ||
      file.ffProbeData.streams[0].height > 480
    ) {
      response.processFile = true;
      response.preset = '-Z "H.264 MKV 480p30"';
      response.container = ".mkv";
      response.handBrakeMode = true;
      response.FFmpegMode = false;
      response.reQueueAfter = true;
      response.infoLog += "☒File is not h264 480p! \n";
      return response;
    } else {
      response.infoLog += "☑File is h264 480p! \n";
    }
    //

    if (file.meta.Title != "undefined" && hasSubs) {
      response.processFile = true;
      response.preset = ",-sn -map_metadata -1 -map 0 -c copy";
      response.container = ".mkv";
      response.handBrakeMode = false;
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog += "☒File has title and has subs \n";
      return response;
    } else {
      response.infoLog += "☑File has no title and has no subs \n";
    }

    if (file.meta.Title != undefined) {
      response.processFile = true;
      response.preset = ",-map_metadata -1 -map 0 -c copy";
      response.container = ".mkv";
      response.handBrakeMode = false;
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog += "☒File has title metadata \n";
      return response;
    } else {
      response.infoLog += "☑File has no title metadata \n";
    }

    if (hasSubs) {
      response.processFile = true;
      response.preset = ",-sn  -map 0 -c copy";
      response.container = ".mkv";
      response.handBrakeMode = false;
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog += "☒File has subs \n";
      return response;
    } else {
      response.infoLog += "☑File has no subs \n";
    }

    if (file.container != "mkv") {
      response.processFile = true;
      response.preset = ", -map 0 -c copy";
      response.container = ".mkv";
      response.handBrakeMode = false;
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog += "☒File is not in mkv container! \n";
      return response;
    } else {
      response.infoLog += "☑File is in mkv container! \n";
    }

    response.processFile = false;
    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
