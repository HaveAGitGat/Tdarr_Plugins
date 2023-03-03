const details = () => ({
  id: 'Tdarr_Plugin_nate_Convert_subs_to_srt',
  Stage: 'Pre-processing',
  Name: 'Convert subtitles to srt',
  Type: 'Any',
  Operation: 'Transcode',
  Description: 'This plugin will convert specified subtitles to srt.\n\n',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,subtitle, audio,configurable',

  Inputs: [
    {
      name: 'subtitle_codecs',
      type: 'string',
      defaultValue: 'ass',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify subtitle codecs to have converted (must be texted based and supported by ffmpeg).
                            \\nExample:\\n
                             ass
                            \\nExample:\\n
                             ass,dvb_teletext`,
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',

  };

  // Check if the file is a video, if not the plugin will exit.
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒File is not a video! \n';
    return response;
  }
  response.infoLog += '☑File is a video! \n';

  // Set up required variables.
  const tag_subtitle_codecs = inputs.subtitle_codecs.split(',');
  let ffmpegCommandInsert = '';
  let subtitleIdx = 0;
  let convert = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
  // Catch error here incase the title metadata is completely missing.
    try {
      // Check stream is subtitle AND stream codec contains certain words, removing these streams .
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
        && tag_subtitle_codecs.indexOf(file.ffProbeData.streams[i].codec_name.toLowerCase()) > -1
      ) {
        ffmpegCommandInsert += `-c:s:${subtitleIdx} srt `;
        response.infoLog += `☒Subtitle stream detected converting subtitle stream 0:s:${subtitleIdx} - `
          + `${file.ffProbeData.streams[i].tags.title} - ${file.ffProbeData.streams[i].codec_name}. \n`;
        convert = true;
      }
    } catch (err) {
      // I want application to not crash, but don't care about the message.
    }
    // Check if stream type is subtitle and increment subtitleIdx if true.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
      subtitleIdx += 1;
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c:v copy -c:a copy -max_muxing_queue_size 4096`;
    response.container = `.${file.container}`;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog
      += "☑File doesn't contain subtitle codecs which require conversion.\n";
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
