/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_raf4_Floorpie_FFmpeg_Tiered_HEVC_MKV",
    Stage: "Pre-processing",
    Name: "FFmpeg Tiered HEVC MKV",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin uses different FFmpeg transcoding settings for 480p,576p,720p and 1080p. If files are not in hevc they will be transcoded. The output container is mkv. \n\n`,
    Version: "1.01",
    Tags: "pre-processing,ffmpeg,h265,video only,",
    Inputs:[]
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

  //file will be encoded if the resolution is 480p or 576p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "480p" || file.video_resolution === "576p") {
    if (file.video_codec_name == "h263") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "h264") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "mjpeg") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "mpeg1") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "mpeg2") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "mpeg4") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "vc1") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "vp8") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else if (file.video_codec_name == "vp9") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    } else {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 27";
    }

    transcode = 1;
  }

  //file will be encoded if the resolution is 720p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "720p") {
    if (file.video_codec_name == "h263") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "h264") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "mjpeg") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "mpeg1") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "mpeg2") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "mpeg4") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "vc1") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "vp8") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else if (file.video_codec_name == "vp9") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    } else {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 25";
    }

    transcode = 1;
  }

  //file will be encoded if the resolution is 1080p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "1080p") {
    if (file.video_codec_name == "h263") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "h264") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "mjpeg") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "mpeg1") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "mpeg2") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "mpeg4") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "vc1") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "vp8") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else if (file.video_codec_name == "vp9") {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    } else {
      response.preset =
        ",-map 0:v -map 0:s? -c:s srt -map 0:a -c copy -c:v:0 libx265 -preset fast -crf 23";
    }

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
