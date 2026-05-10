const details = () => ({
  id: 'Tdarr_Plugin_jordy_filter_by_audio_codec_and_channels',
  Stage: 'Pre-processing',
  Name: 'Filter By Audio Codec And Channels',
  Type: 'Audio',
  Operation: 'Filter',
  Description: 'Only allow specified audio codecs with specific channel counts to be processed \n\n',
  Version: '1.00',
  Tags: 'filter,audio',
  Inputs: [
    {
      name: 'codecsToProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of audio codecs to be processed. Leave blank if using codecsToNotProcess',
    },
    {
      name: 'channelsToProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of channel counts to be processed '
        + '(1=mono, 2=stereo, 6=5.1, 8=7.1). Leave blank to ignore channel count.',
    },
    {
      name: 'codecsToNotProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of audio codecs to not be processed. '
        + 'Leave blank if using codecsToProcess',
    },
    {
      name: 'channelsToNotProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of channel counts to not be processed '
        + '(1=mono, 2=stereo, 6=5.1, 8=7.1). Leave blank to ignore channel count.',
    },
    {
      name: 'requireAllStreams',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip:
        'If true, all audio streams must match the criteria. '
        + 'If false, at least one stream must match.',
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
    infoLog: '',
  };

  // Check if file has audio streams
  if (!file.ffProbeData || !file.ffProbeData.streams) {
    response.infoLog += 'No streams data found. Breaking out of plugin stack.\n';
    return response;
  }

  // Get all audio streams
  const audioStreams = file.ffProbeData.streams.filter((stream) => stream.codec_type
    && stream.codec_type.toLowerCase() === 'audio');

  if (audioStreams.length === 0) {
    response.infoLog += 'No audio streams found. Breaking out of plugin stack.\n';
    return response;
  }

  // Parse inputs
  const codecsToProcess = inputs.codecsToProcess
    ? inputs.codecsToProcess.toLowerCase().split(',').map((item) => item.trim())
    : [];
  const channelsToProcess = inputs.channelsToProcess
    ? inputs.channelsToProcess.split(',').map((item) => parseInt(item.trim(), 10))
    : [];
  const codecsToNotProcess = inputs.codecsToNotProcess
    ? inputs.codecsToNotProcess.toLowerCase().split(',').map((item) => item.trim())
    : [];
  const channelsToNotProcess = inputs.channelsToNotProcess
    ? inputs.channelsToNotProcess.split(',').map((item) => parseInt(item.trim(), 10))
    : [];
  const requireAllStreams = inputs.requireAllStreams === 'true' || inputs.requireAllStreams === true;

  // Validate that at least one filter is provided
  if (codecsToProcess.length === 0 && channelsToProcess.length === 0
      && codecsToNotProcess.length === 0 && channelsToNotProcess.length === 0) {
    response.infoLog += 'No filter criteria provided. At least one codec or channel filter must be specified. '
      + 'Breaking out of plugin stack.\n';
    return response;
  }

  // Validate channel numbers
  const invalidChannels = [...channelsToProcess, ...channelsToNotProcess]
    .filter((ch) => Number.isNaN(ch) || ch <= 0);
  if (invalidChannels.length > 0) {
    response.infoLog += `Invalid channel numbers detected: ${invalidChannels.join(', ')}. `
      + 'Channel counts must be positive integers. Breaking out of plugin stack.\n';
    return response;
  }

  // Function to check if a stream matches criteria
  const streamMatchesCriteria = (stream) => {
    const codecName = stream.codec_name ? stream.codec_name.toLowerCase() : '';
    const channels = stream.channels || 0;

    // Check positive filters (codecs to process)
    if (codecsToProcess.length > 0 && !codecsToProcess.includes(codecName)) {
      return false;
    }

    // Check positive filters (channels to process)
    if (channelsToProcess.length > 0 && !channelsToProcess.includes(channels)) {
      return false;
    }

    // Check negative filters (codecs to not process)
    if (codecsToNotProcess.length > 0 && codecsToNotProcess.includes(codecName)) {
      return false;
    }

    // Check negative filters (channels to not process)
    if (channelsToNotProcess.length > 0 && channelsToNotProcess.includes(channels)) {
      return false;
    }

    return true;
  };

  // Check streams based on requireAllStreams setting
  const matchingStreams = audioStreams.filter(streamMatchesCriteria);
  const shouldProcess = requireAllStreams
    ? (matchingStreams.length === audioStreams.length)
    : (matchingStreams.length > 0);

  // Set response
  response.processFile = shouldProcess;

  if (shouldProcess) {
    response.infoLog += 'File meets audio codec and channel criteria. Moving to next plugin.\n';

    // Log matching streams for information
    matchingStreams.forEach((stream) => {
      response.infoLog += `Stream ${stream.index}: codec=${stream.codec_name}, channels=${stream.channels}\n`;
    });
  } else {
    response.infoLog += 'File does not meet audio codec and channel criteria. Breaking out of plugin stack.\n';

    // Log details about why file failed
    audioStreams.forEach((stream) => {
      const matches = streamMatchesCriteria(stream);
      response.infoLog += `Stream ${stream.index}: codec=${stream.codec_name}, `
        + `channels=${stream.channels}, matches=${matches}\n`;
    });
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
