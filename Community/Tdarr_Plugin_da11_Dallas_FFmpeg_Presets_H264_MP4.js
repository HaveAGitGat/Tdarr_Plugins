/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_da11_Dallas_FFmpeg_Presets_H264_MP4",
    Stage: "Pre-processing",
    Name:
      "Dallas FFmpeg H264 MP4. Video: H264/MP4, Subs: Convert To:mov_text Or Drop, Audio:aac",
    Type: "Video",
    Operation: 'Transcode',
    Description: `This plugin transcodes into H264 with an MP4 container using the FFmpeg preset you select (slow,medium,fast,veryfast). It maintains all compatible subtitles and audio tracks. Drops picture tracks such as mjpeg\n\n`,
    Version: "1.00",
    Tags: "pre-processing,ffmpeg,h264,video only,configurable",
    Inputs: [
      {
        name: "FFmpeg_preset",
        type: 'string',
        defaultValue: 'medium  ',
        inputUI: {
          type: 'text',
        },
        tooltip: `Select the FFmpeg preset you wish to use,(slow,medium,fast,veryfast). 
      
      \\nExample:\\n 
      slow  
      
      \\nExample:\\n 
      medium  
      
      \\nExample:\\n 
      fast  
      
      \\nExample:\\n 
      veryfast`,
      },
    ],
  };
}

const presets = ["slow", "medium", "fast", "veryfast"];

// Normalizes the preset or if invalid returns null
function getPreset(preset) {
  if (!preset) return null;

  preset = preset.toLowerCase();
  // Strip Spaces
  preset = preset.replace(/\s+/g, "");

  if (presets.includes(preset)) {
    return preset;
  }

  return null;
}

const GOOD = true;
const BAD = false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",

  };

  const addInfo = (status, info) => {
    response.infoLog += (status ? "☑" : "☒") + " " + info + "\n";
  }

  // Check the file is a video
  if (file.fileMedium !== "video") {
    console.log("File is not video");
    addInfo(BAD, `File is not video`);
    response.processFile = false;
    return response;
  }

  // Get and check the preset
  let preset = getPreset(inputs.FFmpeg_preset);

  if (preset === null) {
    addInfo(
      BAD,
      `Invalid Preset, \"${inputs.FFmpeg_preset}\" please select from (slow,medium,fast,veryfast)`
    );

    throw `Error: Invalid Preset, \"${inputs.FFmpeg_preset}\" please select from (slow,medium,fast,veryfast) \n`;
  }

  var jsonString = JSON.stringify(file);

  var hasSubs = false;
  var hasBadSubs = false;
  var subType = "-c:s mov_text";
  var subMap = "";

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      let streamData = file.ffProbeData.streams[i];
      if (streamData.codec_type.toLowerCase() == "subtitle") {
        if (
          streamData.codec_name === "hdmv_pgs_subtitle" ||
          streamData.codec_name === "dvd_subtitle"
        ) {
          hasBadSubs = true;
          // Drop incompatible subs
          subMap += " -map -0:" + streamData.index + " ";
        } else if (streamData.codec_name != "mov_text") {
          hasSubs = true;
          // Keep compatible subs
          subMap += " -map 0:" + streamData.index + " ";
        }
      }
    } catch (err) {
      console.log("Error reading stream: " + JSON.stringify(err));
    }
  }

  if (hasBadSubs)
    addInfo(BAD, "File contains unsupported sub(s), dropping these!");

  if (file.ffProbeData.streams[0].codec_name != "h264") {
    addInfo(BAD, "File is not in h264!");
    response.preset =
      ", -map_metadata -1 -map 0:V " +
      subMap +
      " -map 0:a -c:v libx264 -preset " + preset + " -c:a aac -strict -2 " +
      subType;
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  } else {
    addInfo(GOOD, "File is already in h264!");
  }

  if (file.meta.Title != undefined && !jsonString.includes("aac") && hasSubs) {
    addInfo(BAD, "File has title metadata and no aac and subs");
    response.preset =
      ", -map_metadata -1 -map 0:v " +
      subMap +
      " -map 0:a -c:v copy -c:a aac -strict -2 " +
      subType;
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }

  if (!jsonString.includes("aac") && hasSubs) {
    addInfo(BAD, "File has no aac track and has subs");
    response.preset =
      ", -map 0:v " +
      subMap +
      " -map 0:a -c:v copy -c:a aac -strict -2 " +
      subType;
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }

  if (file.meta.Title != undefined && hasSubs) {
    addInfo(BAD, "File has title and has subs");
    response.preset =
      ", -map_metadata -1 -map 0:v " +
      subMap +
      " -map 0:a -c:v copy -c:a copy " +
      subType;
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }

  if (file.meta.Title != undefined) {
    addInfo(BAD, "File has title metadata");
    response.preset =
      ", -map_metadata -1 -map 0:v " +
      subMap +
      " -map 0:a -c:v copy -c:a copy " +
      subType;
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  } else {
    addInfo(GOOD, "File has no title metadata");
  }

  if (!jsonString.includes("aac")) {
    addInfo(BAD, "File has no aac track");
    response.preset =
      ", -map 0:v " +
      subMap +
      " -map 0:a -c:v copy -c:a aac -strict -2 " +
      subType;
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  } else {
    addInfo(GOOD, "File has aac track");
  }

  if (hasSubs) {
    if (hasBadSubs) {
      addInfo(BAD, "File has incompatible subs, dropping these...");
    } else {
      addInfo(BAD, "File has compatible subs, copying...");
    }
    response.preset =
      ", -map 0:v " + subMap + " -map 0:a -c:v copy -c:a copy " + subType;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  } else {
    addInfo(GOOD, "File has no/compatible subs");
  }

  addInfo(GOOD, "File meets conditions!");
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
