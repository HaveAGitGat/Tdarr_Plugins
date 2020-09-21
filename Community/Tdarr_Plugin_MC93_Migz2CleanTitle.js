function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz2CleanTitle",
    Stage: "Pre-processing",
    Name: "Migz-Clean title metadata",
    Type: "Video",
    Operation: "Clean",
    Description: `This plugin removes title metadata from video/audio/subtitles, if it exists. Video checking is mandatory, audio and subtitles are optional.\n\n`,
    Version: "1.3",
    Link:
      "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz2CleanTitle.js",
    Tags: "pre-processing,ffmpeg,configurable",
    Inputs: [
      {
        name: "clean_audio",
        tooltip: `Specify if audio titles should be checked & cleaned. Optional.
  	            \\nExample:\\n
  	            true

  	            \\nExample:\\n
  	            false`,
      },
      {
        name: "clean_subtitles",
        tooltip: `Specify if subtitle titles should be checked & cleaned. Optional.
  	            \\nExample:\\n
  	            true

  	            \\nExample:\\n
  	            false`,
      },
    ],
  };
}

function plugin(file, librarySettings, inputs) {
  var response = {
    processFile: false,
    preset: "",
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: "",
  };

  // Set up required variables.
  var ffmpegCommandInsert = "";
  var videoIdx = 0;
  var audioIdx = 0;
  var subtitleIdx = 0;
  var convert = false;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== "video") {
    console.log("File is not video");
    response.infoLog += "☒File is not video \n";
    response.processFile = false;
    return response;
  }

  // Check if overall file metadata title is not empty, if it's not empty set to "".
  if (typeof file.meta.Title != "undefined")
    try {
      ffmpegCommandInsert += ` -metadata title="" `;
      convert = true;
    } catch (err) {}

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++)
    try {
      // Check if stream is a video.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
        // Check if stream title is not empty, if it's nto empty set to "".
        if (typeof file.ffProbeData.streams[i].tags.title != "undefined") {
          response.infoLog += `☒Video stream title is not empty, most likely junk metadata. Removing title from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} title="" `;
          convert = true;
        }
        // Increment videoIdx.
        videoIdx++;
      }

      // Check if title metadata of audio stream has more then 3 full stops. If so then it's likely to be junk metadata so remove.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        inputs.clean_audio.toLowerCase() == "true"
      ) {
        if (file.ffProbeData.streams[i].tags.title.split(".").length - 1 > 3) {
          response.infoLog += `☒More then 3 full stops detected in audio title, likely to be junk metadata. Removing title from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} title="" `;
          convert = true;
        }
        // Increment audioIdx.
        audioIdx++;
      }

      // Check if title metadata of subtitle stream has more then 3 full stops. If so then it's likely to be junk metadata so remove.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" &&
        inputs.clean_subtitles.toLowerCase() == "true"
      ) {
        if (file.ffProbeData.streams[i].tags.title.split(".").length - 1 > 3) {
          response.infoLog += `☒More then 3 full stops detected in subtitle title, likely to be junk metadata. Removing title from stream ${i} \n`;
          ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title="" `;
          convert = true;
        }
        // Increment subtitleIdx.
        subtitleIdx++;
      }
    } catch (err) {}

  // Convert file if convert variable is set to true.
  if (convert == true) {
    response.infoLog += "☒File has title metadata. Removing \n";
    response.preset = `,${ffmpegCommandInsert} -c copy -map 0 -max_muxing_queue_size 9999`;
    response.reQueueAfter = true;
    response.processFile = true;
  } else {
    response.infoLog += "☑File has no title metadata \n";
  }
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
