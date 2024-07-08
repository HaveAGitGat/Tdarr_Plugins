const details = () => ({
  id: 'Tdarr_Plugin_00td_action_remove_audio_by_channel_count',
  Stage: 'Pre-processing',
  Name: 'Remove Audio Streams By Channel Count',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This plugin removes audio streams based on channel count. The output container is the same as the original.
  If the file only has one audio stream, the plugin will be skipped. If the number of audio streams to remove
  equals the total number of audio streams, the plugin will be skipped. This ensures there is always at least
  one audio stream in the file.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'channelCounts',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the the channel counts to remove.
        
        \\nExample:\\n
        8,6
        `,
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
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  if (inputs.channelCounts.trim() === '') {
    response.infoLog += 'No input entered in plugin, skipping';
    return response;
  }

  const audioStreams = file.ffProbeData.streams.filter((row) => row.codec_type === 'audio');

  if (audioStreams.length === 0) {
    response.infoLog += 'File has no audio streams, skipping plugin';
    return response;
  }

  if (audioStreams.length === 1) {
    response.infoLog += 'File only has 1 audio stream, skipping plugin';
    return response;
  }

  response.preset += ', -map 0 -c copy -max_muxing_queue_size 9999';

  const audioToRemove = [];
  const channelCounts = inputs.channelCounts.trim().split(',');

  for (let i = 0; i < channelCounts.length; i += 1) {
    const channelCount = parseInt(channelCounts[i], 10);
    for (let j = 0; j < audioStreams.length; j += 1) {
      if (channelCount === audioStreams[j].channels) {
        audioToRemove.push(audioStreams[j]);
      }
    }
  }

  if (audioToRemove.length === 0) {
    response.infoLog += 'No audio streams to remove!';
    return response;
  }

  if (audioToRemove.length === audioStreams.length) {
    response.infoLog += 'The number of audio streams to remove equals '
    + 'the total number of audio streams, skipping plugin';
    return response;
  }

  audioToRemove.forEach((row) => {
    response.preset += ` -map -0:${row.index} `;
    response.infoLog += ` Removing stream ${row.index} which has ${row.channels} channels.`;
  });

  response.processFile = true;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
