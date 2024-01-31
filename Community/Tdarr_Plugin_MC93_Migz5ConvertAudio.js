/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz5ConvertAudio',
  Stage: 'Pre-processing',
  Name: 'Migz-Convert audio streams',
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

  const safeToLowerCase = (stringInput) => stringInput?.toLowerCase() || '';

  //Set up inputs
  const aacStereo = inputs?.aac_stereo ?? false;
  const downmix = inputs?.downmix ?? false;
  const downmixSingleTrack = inputs?.downmix_single_track ?? false;

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
  const audioStreams = file.ffProbeData.streams.filters(stream => safeToLowerCase(stream.codec_type) === 'audio');
  let convert = false;
  let is2channelAdded = false;
  let is6channelAdded = false;

  const addDownmixedAudioStream = (audioStream, currentChannels, targetedChannels, channelsAdded, encoder, targetedChannelsLayout) => {
    let isStreamAdded = false;
    if (audioStream.channels === currentChannels && (!downmixSingleTrack || (downmixSingleTrack && !channelsAdded))) {
      downmixedStream = audioStreams.find(aStream => aStream.channels === targetedChannels && (aStream.tags?.language?.toLowerCase() ?? 'und') !== (audioStream.tags?.language?.toLowerCase() ?? 'und'));
      if (downmixedStream === undefined){
        ffmpegCommandInsert += `-map 0:${audioStream.index} -c:a:${audioIdx} ${encoder} -ac ${targetedChannels} -metadata:s:a:${audioIdx} title=${targetedChannelsLayout}_from_${safeToLowerCase(audioStream.tags?.title).replace(/ /g, "_")} `;
        response.infoLog += `☒Audio track is ${currentChannels} channel, no ${targetedChannels} channel exists. Creating ${targetedChannels} channel from ${currentChannels} channel. \n`;
        convert = true;
        isStreamAdded = true;
      }
    }
    return isStreamAdded;
  }

  // Go through each audio stream in the file.
  audioStreams.forEach(audioStream => {
    if (downmix) {
      is6channelAdded = addDownmixedAudioStream(audioStream, 8, 6, is6channelAdded, 'ac3', '5.1');
      is2channelAdded = addDownmixedAudioStream(audioStream, 6, 2, is2channelAdded, 'aac', '2.0');
    }

    if (aacStereo && safeToLowerCase(audioStream.codec_name) !== 'aac' && audioStream.channels === 2) {
      ffmpegCommandInsert += `-c:a:${audioIdx} aac `;
      response.infoLog += '☒Audio track is 2 channel but is not AAC. Converting. \n';
      convert = true;
    }

    ++audioIdx;
  });

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