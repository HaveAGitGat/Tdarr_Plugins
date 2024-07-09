/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_MP01_MichPasCleanSubsAndAudioCodecs",
    Stage: "Pre-processing",
    Name: "MichPass Remove Subtitle And Audio Streams With Certain Codecs",
    Type: "Any",
    Operation: 'Transcode',
    Description: `This plugin removed specified codecs from subtitle and audio tracks. Helpful to remove bitmap subtitles (pgs,vobsub) or audio codec (truehd), which can cause Plex to start transcoding. Based on Migz4 Plugin. Thanks \n\n`,
    Version: "1.0",
    Tags: "pre-processing,ffmpeg,subtitle, audio,configurable",

    Inputs: [
      {
        name: "tag_subtitle_codecs",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify key words here for subtitle tracks you'd like to have removed.
                            \\nExample:\\n
                             hdmv_pgs_subtitle
                             \\nExample:\\n
                            hdmv_pgs_subtitle,dvd_subtitle`,
      },
      {

        name: "tag_audio_codecs",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify all audio codecs you'd like to have removed.
                            \\nExample:\\n
                            truehd
                            \\nExample:\\n
                            xxx,yyy`,
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
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
  var tag_subtitle_codecs = inputs.tag_subtitle_codecs.split(",");
  var tag_audio_codecs = inputs.tag_audio_codecs.split(",");
  var ffmpegCommandInsert = "";
  var subtitleIdx = 0;
  var audioIdx = 0;
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
        ffmpegCommandInsert += `-map -0:s:${subtitleIdx} `;
        response.infoLog += `☒Subtitle stream detected as unwanted. removing subtitle stream 0:s:${subtitleIdx} - ${file.ffProbeData.streams[i].tags.title} - ${file.ffProbeData.streams[i].codec_name}. \n`;
        convert = true;
      }
    } catch (err) {}


// For debugging
// response.infoLog += `☒test tags codectype title - ${file.ffProbeData.streams[i].codec_type}. \n`;
// response.infoLog += `☒test tag name - ${file.ffProbeData.streams[i].codec_name}. \n`;
// response.infoLog += `☒test tags long name - ${file.ffProbeData.streams[i].codec_long_name}. \n`;
 
    try {
      // Check if stream is audio .
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
       tag_audio_codecs.indexOf(file.ffProbeData.streams[i].codec_name.toLowerCase()
        ) > -1
      ) {
        ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
        response.infoLog += `☒audio stream detected as unwanted. removing audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.title} -  ${file.ffProbeData.streams[i].codec_name} \n`;
        convert = true;
      }
   } catch (err) {}

  
     // Check if stream type is audio and increment audioIdx if true.
 if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
      audioIdx++;
    }

     // Check if stream type is subtitle and increment subtitleIdx if true.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
      subtitleIdx++;
    }
  }


  // Convert file if convert variable is set to true.

  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 4096`;
    response.container = "." + file.container;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog +=
      "☑File doesn't contain subtitle or audio codecs which were unwanted or that require tagging.\n";

  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;