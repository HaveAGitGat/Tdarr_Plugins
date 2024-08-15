/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz5ConvertAudio',
  Stage: 'Pre-processing',
  Name: 'Migz Convert Audio Streams',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin can convert any 2.0 audio track/s to AAC and can create downmixed audio tracks. \n\n',
  Version: '2.4',
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [{
    name: 'aac_stereo',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
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
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if downmixing should be used to create extra audio tracks.
                    \\nI.e if you have an 8ch but no 2ch or 6ch, create the missing audio tracks from the 8 ch.
                    \\nLikewise if you only have 6ch, create the missing 2ch from it. Optional.
             \\nExample:\\n
             true

             \\nExample:\\n
             false`,
  },
  {
    name: 'downmix_single_track',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'By default this plugin will downmix each track. '
    + 'So four 6 channel tracks will result in four 2 channel tracks.'
    + ' Enable this option to only downmix a single track.',
  },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
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
  let has2Channel = false;
  let has6Channel = false;
  let convert = false;
  let is2channelAdded = false;
  let is6channelAdded = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Go through all audio streams and check if 2,6 & 8 channel tracks exist or not.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (file.ffProbeData.streams[i].channels === 2) {
          has2Channel = true;
        }
        if (file.ffProbeData.streams[i].channels === 6) {
          has6Channel = true;
        }
      }
    } catch (err) {
      // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is audio.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
      // Catch error here incase user left inputs.downmix empty.
      try {
        // Check if inputs.downmix is set to true.
        if (inputs.downmix === true) {
          // Check if file has 8 channel audio but no 6 channel, if so then create extra downmix from the 8 channel.
          if (
            file.ffProbeData.streams[i].channels === 8
            && has6Channel === false
            && (inputs.downmix_single_track === false
              || (inputs.downmix_single_track === true && is6channelAdded === false))

          ) {
            ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" `;
            response.infoLog += '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel from 8 channel. \n';
            convert = true;
            is6channelAdded = true;
          }
          // Check if file has 6 channel audio but no 2 channel, if so then create extra downmix from the 6 channel.
          if (
            file.ffProbeData.streams[i].channels === 6
            && has2Channel === false
            && (inputs.downmix_single_track === false
              || (inputs.downmix_single_track === true && is2channelAdded === false))
          ) {
            ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0" `;
            response.infoLog += '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel from 6 channel. \n';
            convert = true;
            is2channelAdded = true;
          }
        }
      } catch (err) {
        // Error
      }

      // Catch error here incase user left inputs.downmix empty.
      try {
        // Check if inputs.aac_stereo is set to true.
        if (inputs.aac_stereo === true) {
          // Check if codec_name for stream is NOT aac AND check if channel ammount is 2.
          if (
            file.ffProbeData.streams[i].codec_name !== 'aac'
            && file.ffProbeData.streams[i].channels === 2
          ) {
            ffmpegCommandInsert += `-c:a:${audioIdx} aac `;
            response.infoLog += '☒Audio track is 2 channel but is not AAC. Converting. \n';
            convert = true;
          }
        }
      } catch (err) {
        // Error
      }
      audioIdx += 1;
    }
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
