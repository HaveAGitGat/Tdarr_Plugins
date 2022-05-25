/* eslint-disable max-len */
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
    tooltip: `Specify if downmix should be used to create extra audio tracks.
                    \\nI.e if you have an 8ch but no 2ch or 6ch, create the missing audio tracks from the 8 ch.
                    \\nLikewise if you only have 6ch, create the missing 2ch from it. Optional.
             \\nExample:\\n
             true

             \\nExample:\\n
             false`,
  },
  {
    name: 'downmix_language_aware',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if downmix should be language aware. If downmix is not set to true, this will have no effect.
                    \\nI.e if false : audio track 6 channels in english + audio track 2 channels in french => does nothing.
                    \\nI.e if true : audio track 6 channels in english + audio track 2 channels in french => creates an audio track 2 channels in english.
             \\nExample:\\n
             true

             \\nExample:\\n
             false`,
  },
  {
    name: 'debug',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if debug messages should be added to the response info.
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

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video. \n';
    response.processFile = false;
    return response;
  }

  // Set up inputs
  const aacStereo = inputs.aac_stereo;
  const { downmix } = inputs;
  const downmixLanguageAware = inputs.downmix_language_aware;
  const { debug } = inputs;
  if (debug) response.infoLog += `[DEBUG] Inputs: aac_stereo ${aacStereo}; downmix ${downmix}; downmixLanguageAware ${downmixLanguageAware}; debug ${inputs.debug} \n`;

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let convert = false;
  let has2Channel = false;
  let has6Channel = false;
  let has8Channel = false;
  let has6ChannelsAudioTrackToCreate = false;
  let has2ChannelsAudioTrackToCreate = false;
  const languagesAudioStreams = [];

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    // Go through all audio streams and check if 2,6 & 8 channel tracks exist or not.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
      const language = file.ffProbeData.streams[i].tags.language.toLowerCase();
      if (debug) response.infoLog += `[DEBUG] Audio track ${i}: language ${language}; channels ${file.ffProbeData.streams[i].channels}; codec ${file.ffProbeData.streams[i].codec_name}. \n`;
      let languageAudioStreams = languagesAudioStreams.find((ls) => ls.language === language);
      if (!languageAudioStreams) {
        languageAudioStreams = {
          language, hasChannel2: false, hasChannel6: false, hasChannel8: false,
        };
        languagesAudioStreams.push(languageAudioStreams);
      }
      switch (file.ffProbeData.streams[i].channels) {
        case 8:
          languageAudioStreams.channel8 = { index: i, codecName: file.ffProbeData.streams[i].codec_name };
          languageAudioStreams.hasChannel8 = true;
          has8Channel = true;
          break;
        case 6:
          languageAudioStreams.channel6 = { index: i, codecName: file.ffProbeData.streams[i].codec_name };
          languageAudioStreams.hasChannel6 = true;
          has6Channel = true;
          break;
        case 2:
        default:
          languageAudioStreams.channel2 = { index: i, codecName: file.ffProbeData.streams[i].codec_name };
          languageAudioStreams.hasChannel2 = true;
          has2Channel = true;
      }
    }
  }

  if ((downmix && !downmixLanguageAware) || aacStereo) {
    if (debug && downmix && !downmixLanguageAware) response.infoLog += `[DEBUG] Channels: hasChannel2 ${has2Channel}; hasChannel6 ${has6Channel}; hasChannel8 ${has8Channel}. \n`;
    for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (downmix && !downmixLanguageAware) {
          // eslint-disable-next-line no-loop-func
          const setUpDownmixCmd = (currentChannels, targetedChannels, hasTargetedChannels, encoder, targetedChannelsLayout) => {
            let hasToTranscode = false;
            if (file.ffProbeData.streams[i].channels === currentChannels && !hasTargetedChannels) {
              ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} ${encoder} -ac ${targetedChannels} -metadata:s:a:${audioIdx} title="${targetedChannelsLayout}" `;
              response.infoLog += `☒Audio track is ${currentChannels} channel, no ${targetedChannels} channel exists. Creating ${targetedChannels} channel from ${currentChannels} channel. \n`;
              convert = true;
              hasToTranscode = true;
            }
            return hasToTranscode;
          };
          if (!has2ChannelsAudioTrackToCreate) has6ChannelsAudioTrackToCreate = setUpDownmixCmd(8, 6, has6Channel, 'ac3', '5.1') || has6ChannelsAudioTrackToCreate;
          if (!has6ChannelsAudioTrackToCreate) has2ChannelsAudioTrackToCreate = setUpDownmixCmd(6, 2, has2Channel, 'aac', '2.0') || has2ChannelsAudioTrackToCreate;
        }

        if (
          aacStereo
          && file.ffProbeData.streams[i].channels === 2
          && file.ffProbeData.streams[i].codec_name !== 'aac'
        ) {
          ffmpegCommandInsert += `-c:a:${audioIdx} aac `;
          response.infoLog += '☒Audio track is 2 channel but is not AAC. Converting. \n';
          convert = true;
        }

        audioIdx += 1;
      }
    }
  }

  if (downmix && downmixLanguageAware) {
    for (let i = 0; i < languagesAudioStreams.length; i += 1) {
      if (debug) {
        response.infoLog += `[DEBUG] Language ${languagesAudioStreams[i].language}:`
          + ` hasChannel2 ${languagesAudioStreams[i].hasChannel2}${languagesAudioStreams[i].hasChannel2 ? ` {audio track ${languagesAudioStreams[i].channel2.index}}` : ''};`
          + ` hasChannel6 ${languagesAudioStreams[i].hasChannel6}${languagesAudioStreams[i].hasChannel6 ? ` {audio track ${languagesAudioStreams[i].channel6.index}}` : ''};`
          + ` hasChannel8 ${languagesAudioStreams[i].hasChannel8}${languagesAudioStreams[i].hasChannel8 ? ` {audio track ${languagesAudioStreams[i].channel8.index}}` : ''}. \n`;
      }

      // eslint-disable-next-line no-loop-func
      const setUpDownmixCmd = (currentChannels, targetedChannels, hasCurrentChannels, hasTargetedChannels, currentIndex, encoder, targetedChannelsLayout) => {
        let hasToTranscode = false;
        if (hasCurrentChannels && !hasTargetedChannels) {
          ffmpegCommandInsert += `-map 0:${currentIndex} -c:a:${audioIdx} ${encoder} -ac ${targetedChannels} -metadata:s:a:${audioIdx} title="${targetedChannelsLayout}" `;
          audioIdx += 1;
          response.infoLog += `☒Language ${languagesAudioStreams[i].language} has ${currentChannels} channels audio track but no ${targetedChannels} channels. Creating ${targetedChannels} channels audio track. \n`;
          convert = true;
          hasToTranscode = true;
        }
        return hasToTranscode;
      };
      if (!has2ChannelsAudioTrackToCreate) {
        has6ChannelsAudioTrackToCreate = setUpDownmixCmd(
          8,
          6,
          languagesAudioStreams[i].hasChannel8,
          languagesAudioStreams[i].hasChannel6,
          languagesAudioStreams[i].channel8?.index || {},
          'ac3',
          '5.1',
        )
          || has6ChannelsAudioTrackToCreate;
      }
      if (!has6ChannelsAudioTrackToCreate) {
        has2ChannelsAudioTrackToCreate = setUpDownmixCmd(
          '8 or 6',
          2,
          languagesAudioStreams[i].hasChannel6 || languagesAudioStreams[i].hasChannel8,
          languagesAudioStreams[i].hasChannel2,
          languagesAudioStreams[i].channel6?.index || languagesAudioStreams[i].channel8?.index || {},
          'aac',
          '2.0',
        )
          || has2ChannelsAudioTrackToCreate;
      }
    }
  }

  // Convert file if convert variable is set to true.
  response.processFile = convert;
  if (response.processFile) {
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} `
      + '-strict -2 -c:s copy -max_muxing_queue_size 9999 ';
    if (debug) response.infoLog += `[DEBUG] ffmpegCommand: ${response.preset} \n`;
  } else response.infoLog += '☑File contains all required audio formats. \n';

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
