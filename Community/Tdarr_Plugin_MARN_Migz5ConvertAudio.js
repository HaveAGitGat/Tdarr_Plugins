/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MARN_Migz5ConvertAudio',
  Stage: 'Pre-processing',
  Name: 'Migz-Convert audio streams',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin is based on Tdarr_Plugin_MC93_Migz5ConvertAudio (thanx !!). It does the same thing except it takes languages into account. For downmixing, it will check if each language has a 2.0 audio track. \n\n',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [{
    name: 'aac_stereo',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify if any 2.0 audio tracks should be converted to aac for maximum compatability with devices.
                      \\nOptional.
               \\nExample:\\n
               true
  
               \\nExample:\\n
               false`,
  },
  {
    name: 'downmix',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify if downmixing should be used to create extra audio tracks.
                      \\nI.e if you have an 8ch but no 2ch or 6ch for a specific language, create the missing audio tracks from the 8 ch.
                      \\nLikewise if you only have 6ch for a specific language, create the missing 2ch from it. Optional.
               \\nExample:\\n
               true
  
               \\nExample:\\n
               false`,
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
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  //  Check if both inputs.aac_stereo AND inputs.downmix have been left empty. If they have then exit plugin.
  if (inputs && inputs.aac_stereo === '' && inputs.downmix === '') {
    response.infoLog += '☒Plugin has not been configured, please configure required options. Skipping this plugin. \n';
    response.processFile = false;
    return response;
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video. \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let convert = false;
  let languagesAudioStreams = [];

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Go through all audio streams and check if 2,6 & 8 channel tracks exist or not.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        let language = file.ffProbeData.streams[i].tags.language.toLowerCase();
        let languageAudioStreams = languagesAudioStreams.find(ls => ls.language === language);
        if (!languageAudioStreams) {
          languageAudioStreams = { language: language, hasChannel2: false, hasChannel6: false, hasChannel8: false }
          languagesAudioStreams.push(languageAudioStreams);
        }
        switch (file.ffProbeData.streams[i].channels) {
          case 8:
            languageAudioStreams.channel8 = { index: i, codecName: file.ffProbeData.streams[i].codec_name };
            languageAudioStreams.hasChannel8 = true;
            break;
          case 6:
            languageAudioStreams.channel6 = { index: i, codecName: file.ffProbeData.streams[i].codec_name };
            languageAudioStreams.hasChannel6 = true;
            break;
          case 2:
          default:
            languageAudioStreams.channel2 = { index: i, codecName: file.ffProbeData.streams[i].codec_name };
            languageAudioStreams.hasChannel2 = true;
            break;
        }
      }
    } catch (err) {
      // Error
    }
  }

  // Go through or languagesAudioStreams array.
  for (let i = 0; i < languagesAudioStreams.length; i++) {
    // Catch error here incase user left inputs.downmix empty.
    try {
      // Check if inputs.downmix is set to true.
      if (inputs.downmix.toLowerCase() === 'true') {
        if (languagesAudioStreams[i].hasChannel8 && !languagesAudioStreams[i].hasChannel6) {
          ffmpegCommandInsert += `-map 0:${languagesAudioStreams[i].channel8.index} -c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
          response.infoLog += `☒Language "${languagesAudioStreams[i].language}" has 8 channels audio track but no 6 channels. Creating 6 channels audio track. \n`;
          convert = true;
        }
        if ((languagesAudioStreams[i].hasChannel6 || languagesAudioStreams[i].hasChannel8) && !languagesAudioStreams[i].hasChannel2) {
          ffmpegCommandInsert += `-map 0:${languagesAudioStreams[i].channel6?.index || languagesAudioStreams[i].channel8.index} -c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0" `;
          response.infoLog += `☒Language "${languagesAudioStreams[i].language}" has 8 or 6 channels audio track but no 2 channels. Creating 2 channels audio track. \n`;
          convert = true;
        }
      }
    } catch (err) {
      response.infoLog += `Downmixing err ${err} \n`;
    }

    // Catch error here incase user left inputs.aac_stereo empty.
    try {
      // Check if inputs.aac_stereo is set to true.
      if (inputs.aac_stereo === 'true') {
        // Check if codec_name for stream is NOT aac AND check if channel ammount is 2.
        if (
          languagesAudioStreams[i].hasChannel2
          && languagesAudioStreams[i].channel2.codecName !== 'aac'
        ) {
          ffmpegCommandInsert += `-c:a:${audioIdx} aac `;
          response.infoLog += `☒Language "${languagesAudioStreams[i].language}" has 2 channels audio track but codec is not AAC. Converting. \n`;
          convert = true;
        }
      }
    }
    catch (err) {
      response.infoLog += `AAC convert err ${err} \n`;
    }

    audioIdx += 1;
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} `
      + '-strict -2 -c:s copy -max_muxing_queue_size 9999 ';
  } else {
    response.infoLog += '☑File contains all required audio formats. \n';
    response.processFile = false;
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
