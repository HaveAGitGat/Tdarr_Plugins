/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_hk76_GilbN_MP4_AAC_No_metaTitle",
    Stage: "Pre-processing",
    Name: "GilbN MP4 Stereo AAC, No Title Meta Data",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin removes metadata (if a title exists) and adds a stereo 192kbit AAC track if an AAC track (any) doesn't exist. The output container is mp4. \n\n
`,
    Version: "1.01",
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

  response.FFmpegMode = true;

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  } else {
    var jsonString = JSON.stringify(file);

    if (file.container != "mp4") {
      response.infoLog += "☒File is not in mp4 container! \n";
      response.preset = ", -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File is in mp4 container! \n";
    }

    if (file.meta.Title != undefined) {
      response.infoLog += "☒File has title metadata \n";
      response.preset = ",-map_metadata -1 -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has no title metadata \n";
    }

    if (!jsonString.includes("aac")) {
      response.infoLog += "☒File has no aac track";
      response.preset =
        ",-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 aac -b:a:0 192k -ac 2";
      response.reQueueAfter = true;
      response.processFile = true;
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
