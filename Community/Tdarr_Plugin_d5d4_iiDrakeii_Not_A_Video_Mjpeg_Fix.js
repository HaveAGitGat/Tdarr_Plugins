/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_d5d4_iiDrakeii_Not_A_Video_Mjpeg_Fix",
    Stage: "Pre-processing",
    Name: "Mjpeg Stream False Not A Video Fixer",
    Type: "Video",
    Operation: 'Transcode',
    Description: `Checks if file is not a video file due to Mjpeg stream.  Removes Mjpeg Stream \n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg,",
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
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: "",
  };
  response.container = "." + file.container;

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    //check for mjpeg streams and set the preset if mjpeg streams are found
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == "mjpeg" &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "video"
      ) {
        response.preset = `,-map 0 -map -0:v:1 -c:v copy -c:a copy -c:s copy`;
        response.infoLog = "☒File is not a video but has Mjpeg Stream! \n";
      }
    } catch (err) {}
  }
  //If preset is not set check if file is video and stop (reque if it is a video)
  if (response.preset != `,-map 0 -map -0:v:1 -c:v copy -c:a copy -c:s copy`) {
    if (file.fileMedium !== "video") {
      console.log("File is not video!");
      response.infoLog += " File is not video\n";
      response.processFile = false;

      return response;
    } else {
      response.infoLog += "☑File is a video Without Mjpeg! \n";
      response.processFile = false;
      response.reQueueAfter = true;
      return response;
    }
  }
  //Process mjpeg removal if video found to not be a video and have mjpeg stream
  else {
    if (file.fileMedium !== "video") {
      transcode = 1;
    } else {
      response.infoLog += "☑File is a video With Mjpeg! \n";
      response.processFile = false;
      response.reQueueAfter = true;
      return response;
    }
  }
  //check if the file is eligible for transcoding
  //if true the neccessary response values will be changed
  if (transcode == 1) {
    response.processFile = true;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += `Mjpeg Stream is being removed!\n`;
  }

  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
