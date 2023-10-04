const details = () => ({
  id: 'Tdarr_Plugin_00td_action_remove_stream_by_specified_property',
  Stage: 'Pre-processing',
  Name: 'Remove streams by specified property',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This plugin removes streams based on the specified property.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'codecTypeFilter',
      type: 'string',
      defaultValue: 'subtitle',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter values of the stream codec type to process. Nothing/empty input means all types of streams will be inspected for processing.
        For example, if removing by codec_name on video streams, enter video:
        
        \\nExample:\\n
        video,subtitle,audio
        `,
    },
    {
      name: 'propertyToCheck',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter one stream property to check for values.
        
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
    {
      name: 'removeIfPropertyMissing',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter one or more properties to check for its existance. If the property is missing or null, the stream will be removed.
        Useful for fixing corrupt streams. For example, if codec_name is missing, the stream will be removed:
        
        \\nExample:\\n
        codec_name
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

  const codecTypeFilter = inputs.codecTypeFilter.trim().split(',');

  const removeIfPropertyMissing = inputs.removeIfPropertyMissing.trim().split(',');

  // Debug lines
  // response.infoLog += `codecTypeFilter is ${codecTypeFilter} \n`;
  // response.infoLog += `removeIfPropertyMissing is ${removeIfPropertyMissing} \n`;

  response.preset += ', -map 0 -c copy -max_muxing_queue_size 9999';

  try {
    let streamToRemove = false;
    for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
      try {
        // Skip if the codec_type is filtered out
        if(codecTypeFilter.length != 0 && !codecTypeFilter.includes(String(file.ffProbeData.streams[i]['codec_type']))) {
          continue;
        }

        // Check if chosen non-empty properties are empty
        // If they are empty, set emptyValue to true
        let emptyValue = false;
        for (let j = 0; j < removeIfPropertyMissing.length; j += 1) {
          response.infoLog += `DEBUG: stream ${i} property for ${removeIfPropertyMissing[j]}
          is ${file.ffProbeData.streams[i][removeIfPropertyMissing[j]]} \n`;

          if (file.ffProbeData.streams[i][removeIfPropertyMissing[j]] === 'undefined' || file.ffProbeData.streams[i][removeIfPropertyMissing[j]] === null) {
            emptyValue = true;
            response.infoLog += ` Removing stream ${i} which is has ${removeIfPropertyMissing[j]} missing`;
            break
          }
        }

        // If the value to remove is present OR an empty value is found, remove the stream
        if ((valuesToRemove.includes(String(file.ffProbeData.streams[i][propertyToCheck]))) || emptyValue) {
          // Add to preset
          response.preset += ` -map -0:${i} `;

          // Log the old message if the reason is not empty values
          if(!emptyValue) {
            response.infoLog += ` Removing stream ${i} which is has ${propertyToCheck} or`
            + ` of ${file.ffProbeData.streams[i][propertyToCheck]} \n`;
          }

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
