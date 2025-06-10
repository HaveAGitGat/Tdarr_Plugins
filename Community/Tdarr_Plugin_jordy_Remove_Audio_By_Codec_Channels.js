const details = () => ({
  id: 'Tdarr_Plugin_jordy_Remove_Audio_By_Codec_Channels',
  Stage: 'Pre-processing',
  Name: 'Remove Audio Tracks By Codec And Channels',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin will remove audio tracks from a file based on the codec,'
    + ' channel configuration, and language. It will only remove audio tracks that match the '
    + "specified codec and channel configuration.\n\nFor example, if you specify 'aac' and '5.1', "
    + 'it will remove all audio tracks that are AAC and have 6 channels.\n\n',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [
    {
      name: 'codecs',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter comma-separated list of audio codecs to remove.
                            \\nExample:\\n
                            aac
                            
                            \\nExample:\\n
                            ac3,opus
                            
                            \\nExample:\\n
                            aac,eac3,ac3`,
    },
    {
      name: 'channels',
      type: 'string',
      defaultValue: '5.1',
      inputUI: {
        type: 'dropdown',
        options: [
          'Any',
          '1', // Mono
          '2', // Stereo
          '5.1', // 6 channels
          '7.1', // 8 channels
        ],
      },
      tooltip: `Select the channel configuration to filter.
                            "Any" will remove matching codecs regardless of channel count.
                            \\nExample:\\n
                            5.1`,
    },
    {
      name: 'languages',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter comma-separated list of language tags to filter (leave blank to ignore language). 
                          Any languages listed will be removed.
                            Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                            \\nExample:\\n
                            eng
                            
                            \\nExample:\\n
                            jpn
                            
                            \\nExample:\\n
                            eng,fre,ger`,
    },
  ],
});

// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
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

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video. \n';
    return response;
  }

  // Parse inputs - make sure to handle all potential input formats
  const codecsToRemove = ((inputs.codecs || '').toLowerCase().split(',')
    .map((codec) => codec.trim())
    .filter((codec) => codec !== ''));

  // Check if codecs input is empty (after processing)
  if (codecsToRemove.length === 0) {
    response.infoLog += '⚠️ No codecs specified for removal. Plugin will not process the file.\n';
    response.processFile = false;
    return response;
  }

  const channelFilter = inputs.channels || 'Any';

  // Parse language tags as a comma-separated list (same handling as codecs)
  const languagesToFilter = (inputs.languages || '').toLowerCase()
    .split(',').map((lang) => lang.trim()).filter((lang) => lang !== '');

  // Log input parameters for debugging
  response.infoLog += `\n🔵  Parameters: Codecs=${codecsToRemove.join(',')}, Channels=${channelFilter},`
    + ` Languages=${languagesToFilter.length > 0 ? languagesToFilter.join(',') : 'any'}\n`;

  // Map channel selection to actual channel count
  const channelMap = {
    Any: null, // null means any channel count
    1: 1, // Mono
    2: 2, // Stereo
    5.1: 6, // 5.1 surround
    7.1: 8, // 7.1 surround
  };

  const targetChannelCount = channelMap[channelFilter];

  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let tracksToRemove = 0;
  let convert = false;

  // Get audio streams
  const audioStreams = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type && stream.codec_type.toLowerCase() === 'audio',
  );

  response.infoLog += `\n🔵 Found ${audioStreams.length} audio streams in file\n`;

  // Loop through all streams
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const stream = file.ffProbeData.streams[i];

    // Check if stream is audio
    if (stream.codec_type && stream.codec_type.toLowerCase() === 'audio') {
      // Get current stream properties
      const currentCodec = stream.codec_name ? stream.codec_name.toLowerCase() : '';
      const currentChannels = stream.channels || 0;

      // Get language
      let currentLanguage = '';
      if (stream.tags && stream.tags.language) {
        currentLanguage = stream.tags.language.toLowerCase();
      }

      // Debug info
      response.infoLog += `🔵 Audio track ${audioIdx}: codec=${currentCodec}, channels=${currentChannels},`
        + ` language=${currentLanguage || 'undefined'}\n`;

      // Check if stream matches our removal criteria
      const codecMatches = codecsToRemove.includes(currentCodec);
      const channelMatches = targetChannelCount === null || currentChannels === targetChannelCount;

      // Language matching: if language list is empty, match any language
      // Otherwise, check if the current language is in our filter list
      const languageMatches = languagesToFilter.length === 0
                                || (currentLanguage && languagesToFilter.includes(currentLanguage));

      if (codecMatches && channelMatches && languageMatches) {
        // Prepare to remove this stream
        ffmpegCommandInsert += `-map -0:a:${audioIdx} `;

        // Log details about the track being removed
        response.infoLog += `☒ Marking for removal: audio track ${audioIdx}\n`;

        tracksToRemove += 1;
        convert = true;
      }

      // Increment audio index counter
      audioIdx += 1;
    }
  }

  // Safety check - make sure we don't remove all audio tracks
  if (tracksToRemove >= audioStreams.length) {
    response.infoLog += '\n⚠️ Cancelling plugin - all audio tracks would be removed\n';
    response.processFile = false;
    return response;
  }

  // Process file if tracks need to be removed

  if (convert) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
    response.infoLog += `✅ Will remove ${tracksToRemove} audio track(s)\n`;
  } else {
    response.infoLog += '✅ No matching audio tracks to remove\n';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
