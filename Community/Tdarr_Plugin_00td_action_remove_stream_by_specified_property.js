const details = () => ({
  id: 'Tdarr_Plugin_00td_action_remove_stream_by_specified_property',
  Stage: 'Pre-processing',
  Name: 'Remove Streams By Specified Property',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This plugin removes streams based on the specified property.
  Checks FFprobe 'streams' and MediaInfo 'track' properties.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'propertyToCheck',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter one stream property to check.
        
        \\nExample:\\n
        codec_name
        `,
    },
    {
      name: 'valuesToRemove',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter values of the property above to remove. For example, if removing by codec_name, could enter ac3,aac:
        
        \\nExample:\\n
        ac3,aac
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

  if (inputs.propertyToCheck.trim() === '') {
    response.infoLog += 'No input propertyToCheck entered in plugin, skipping \n';
    return response;
  }

  const propertyToCheck = inputs.propertyToCheck.trim();

  if (inputs.valuesToRemove.trim() === '') {
    response.infoLog += 'No input valuesToRemove entered in plugin, skipping \n';
    return response;
  }

  const valuesToRemove = inputs.valuesToRemove.trim().split(',');

  response.preset += ', -map 0 -c copy -max_muxing_queue_size 9999';

  try {
    let streamToRemove = false;
    for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
      try {
        if (
          valuesToRemove.includes(String(file.ffProbeData.streams[i][propertyToCheck]))
          || valuesToRemove.includes(String(file.mediaInfo.track[i + 1][propertyToCheck]))
        ) {
          response.preset += ` -map -0:${i} `;
          response.infoLog += ` Removing stream ${i} which is has ${propertyToCheck}`
          + ` of ${file.ffProbeData.streams[i][propertyToCheck]} \n`;
          streamToRemove = true;
        }
      } catch (err) {
        response.infoLog += ` Error reading stream ${i} ${propertyToCheck} \n`;
      }
    }

    if (streamToRemove === true) {
      response.processFile = true;
      response.infoLog += ' Files has streams which need to be removed, processing \n';
    } else {
      response.infoLog += ' Files does not have streams which need to be removed \n';
    }
  } catch (err) {
    response.infoLog += ` Error checking streams:${err}`;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
