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
    tooltip: `Specify if any 2.0 audio tracks should be converted to aac for maximum compatibility with devices.
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
  {
    name: "codec",
    name: "codec_6channels",
    type: 'string',
    defaultValue: 'ac3',
    inputUI: {
      type: 'dropdown',
      options: [
        'aac'
        , 'ac3'
        , 'eac3'
        , 'dts'
        , 'flac'
        , 'mp2'
        , 'mp3'
        , 'truehd'
      ],
    },
    tooltip: `Specify the codec you'd like to transcode into for audio tracks with 6 channels.
              \\nExample:\\n
              eac3`,
  },
  {
    name: "codec",
    name: "codec_2channels",
    type: 'string',
    defaultValue: 'aac',
    inputUI: {
      type: 'dropdown',
      options: [
        'aac'
        , 'ac3'
        , 'eac3'
        , 'dts'
        , 'flac'
        , 'mp2'
        , 'mp3'
        , 'truehd'
      ],
    },
    tooltip: `Specify the codec you'd like to transcode into for audio tracks with 2 channels. Will be ignored if aac_stereo is set to true.
            \\nExample:\\n
            aac`,
  }
  ]
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

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video. \n';
    response.processFile = false;
    return response;
  }

  const safeToLowerCase = (stringInput, defaultValue = '') => stringInput?.toLowerCase() ?? defaultValue;
  const safeToLowerCaseLanguage = (language) => safeToLowerCase(language, 'und');
  const resolveEncoder = (encoder) => encoder === 'mp3' ? 'libmp3lame' : (encoder === 'dts' ? 'dca' : encoder);

  //Set up inputs.
  const aacStereo = inputs?.aac_stereo ?? false;
  const downmix = inputs?.downmix ?? false;
  const downmixSingleTrack = inputs?.downmix_single_track ?? false;
  const codec6channels = resolveEncoder(safeToLowerCase(inputs?.codec6channels, 'ac3'));
  const codec2channels = aacStereo ? 'aac' : resolveEncoder(safeToLowerCase(inputs?.codec2channels, 'aac'));

  // Set up required variables.
  let ffmpegCommandInsert = '';
  const audioStreams = file.ffProbeData.streams.filter(stream => safeToLowerCase(stream.codec_type) === 'audio');
  let convert = false;
  let is2channelAdded = false;
  let is6channelAdded = false;

  // Set up different kinds of downmixing.
  const audioStreamDownmixes = {
    from8chTo6ch: { currentChannels: 8, targetedChannels: 6, encoder: codec6channels, targetedChannelsLayout: '5.1' },
    from6chTo2ch: { currentChannels: 6, targetedChannels: 2, encoder: codec2channels, targetedChannelsLayout: '2.0' }
  };
  const addDownmixedAudioStream = (audioStream, audioStreamIndex, audioStreamDownmix, channelsAdded) => {
    let isStreamAdded = false;
    if (audioStream.channels === audioStreamDownmix.currentChannels && (!downmixSingleTrack || (downmixSingleTrack && !channelsAdded))) {
      // No downmixing if an audio stream is found with the targeted number of channels and the correct language.
      const downmixedStream = audioStreams.find(existingAudioStream => existingAudioStream.channels === audioStreamDownmix.targetedChannels && safeToLowerCaseLanguage(existingAudioStream.tags?.language) === safeToLowerCaseLanguage(audioStream.tags?.language));
      if (downmixedStream === undefined) {
        const addedStreamTitle = `${audioStreamDownmix.targetedChannelsLayout} from ${audioStream.tags?.title?.replace(/"/g, '') ?? ''}`;
        ffmpegCommandInsert += `-map 0:${audioStream.index} -c:a:${audioStreamIndex} ${audioStreamDownmix.encoder} -ac:a:${audioStreamIndex} ${audioStreamDownmix.targetedChannels} -metadata:s:a:${audioStreamIndex} title="${addedStreamTitle}" `;
        response.infoLog += `☒Creating ${audioStreamDownmix.targetedChannels} channel from ${audioStreamDownmix.currentChannels} channel for language ${safeToLowerCaseLanguage(audioStream.tags?.language)}. \n`;
        convert = true;
        isStreamAdded = true;
      }
    }
    return isStreamAdded;
  }

  // Go through each audio stream in the file.
  audioStreams.forEach((audioStream, audioStreamIndex) => {
    if (downmix) {
      is6channelAdded = addDownmixedAudioStream(audioStream, audioStreamIndex, audioStreamDownmixes.from8chTo6ch, is6channelAdded);
      is2channelAdded = addDownmixedAudioStream(audioStream, audioStreamIndex, audioStreamDownmixes.from6chTo2ch, is2channelAdded);
    }

    if (aacStereo && audioStream.channels === 2 && safeToLowerCase(audioStream.codec_name) !== 'aac') {
      ffmpegCommandInsert += `-c:a:${audioStreamIndex} aac `;
      response.infoLog += '☒Audio track is 2 channel but is not AAC. Converting. \n';
      convert = true;
    }
  });

  // Convert file if convert variable is set to true.
  response.processFile = convert;
  if (convert)
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} `
      + '-strict -2 -c:s copy -max_muxing_queue_size 9999 ';
  else
    response.infoLog += '☑File contains all required audio formats. \n';

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;