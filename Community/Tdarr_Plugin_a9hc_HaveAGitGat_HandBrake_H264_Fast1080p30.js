/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_a9hc_HaveAGitGat_HandBrake_H264_Fast1080p30",
    Stage: "Pre-processing",
    Name:
      "HaveAGitGat HandBrake Fast1080p30, No Title Meta, No Subs, 192Kb AAC Stereo,MP4",
    Type: "Video",
    Operation: 'Transcode',
    Description: `[Contains built-in filter] This plugin transcodes into H264 using HandBrake's 'Fast 1080p30' preset if the file is not in H264 already. It removes subs, metadata (if a title exists) and adds a stereo 192kbit AAC track if an AAC track (any) doesn't exist. The output container is MP4. \n\n
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

    if (file.ffProbeData.streams[0].codec_name != "h264") {
      response.infoLog += "☒File is not in h264! \n";
      response.preset = '-Z "Fast 1080p30"';
      response.reQueueAfter = true;
      response.processFile = true;
      response.handBrakeMode = true;
      return response;
    } else {
      response.infoLog += "☑File is already in h264! \n";
    }

    ///

    if (hasSubs) {
      response.infoLog += "☒File has subs \n";
      response.preset = ",-sn  -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    } else {
      response.infoLog += "☑File has no subs \n";
    }

    if (
      file.meta.Title != "undefined" &&
      !jsonString.includes("aac") &&
      hasSubs
    ) {
      response.infoLog += "☒File has title metadata and no aac and subs \n";
      response.preset = ",-map_metadata -1 -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    }

    if (!jsonString.includes("aac") && hasSubs) {
      response.infoLog += "☒File has no aac track and has subs \n";
      response.preset =
        ",-sn -map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 aac -b:a:0 192k -ac 2";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    }

    if (file.meta.Title != "undefined" && hasSubs) {
      response.infoLog += "☒File has title and has subs \n";
      response.preset = ",-sn -map_metadata -1 -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    }

    ///
    if (file.meta.Title != undefined) {
      response.infoLog += "☒File has title metadata \n";
      response.preset = ",-map_metadata -1 -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    } else {
      response.infoLog += "☑File has no title metadata";
    }

    if (!jsonString.includes("aac")) {
      response.infoLog += "☒File has no aac track \n";
      response.preset =
        ",-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 aac -b:a:0 192k -ac 2";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    } else {
      response.infoLog += "☑File has aac track \n";
    }

    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
