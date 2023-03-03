const details = () => {
  return {
    id: "Tdarr_Plugin_nate_Convert_subs_to_srt",
    Stage: "Pre-processing",
    Name: "Convert subtitles to srt",
    Type: "Any",
    Operation: 'Transcode',
    Description: `This plugin will convert specified subtitles to srt.\n\n`,
    Version: "1.0",
    Tags: "pre-processing,ffmpeg,subtitle, audio,configurable",

    Inputs: [
      {
        name: "subtitle_codecs",
        type: 'string',
        defaultValue: 'ass',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify key words here for subtitle tracks you'd like to have converted (must be texted based and supported by ffmpeg).
                            \\nExample:\\n
                             ass
                            \\nExample:\\n
                             ass,dvb_teletext`,
      },
    ],
  };
}

const plugin = (file, librarySettings, inputs, otherArguments) => {

  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    processFile: false,
    preset: "",
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: "",

  };

  // Check if file is a video. If it isn't then exit plugin.

  if (file.fileMedium !== "video") {
    console.log("File is not video");
    response.infoLog += "☒File is not video \n";
    response.processFile = false;
    return response;
  }


  // Set up required variables.
  var tag_subtitle_codecs = inputs.subtitle_codecs.split(",");
  var ffmpegCommandInsert = "";
  var subtitleIdx = 0;
  var convert = false;

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
  // Catch error here incase the title metadata is completely missing.
    try {
     // Check stream is subtitle AND stream codec contains certain words, removing these streams .
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" &&
        tag_subtitle_codecs.indexOf(file.ffProbeData.streams[i].codec_name.toLowerCase()
        ) > -1
      ) {
        ffmpegCommandInsert += `-c:s:${subtitleIdx} srt `;
        response.infoLog += `☒Subtitle stream detected converting subtitle stream 0:s:${subtitleIdx} - ${file.ffProbeData.streams[i].tags.title} - ${file.ffProbeData.streams[i].codec_name}. \n`;
        convert = true;
      }
    } catch (err) {}
    // Check if stream type is subtitle and increment subtitleIdx if true.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
      subtitleIdx++;
    }
  }


  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c:v copy -c:a copy -max_muxing_queue_size 4096`;
    response.container = "." + file.container;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog +=
      "☑File doesn't contain subtitle codecs which require conversion.\n";

  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
