const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_stream_tag',
  Stage: 'Pre-processing',
  Name: 'Filter By Stream Tag',
  Type: 'Video',
  Operation: 'Filter',
  Description: `Filter by stream tag value. Will check all streams. Useful for when e.g. trying to force transcoding
  from hevc to hevc. In this circumstance, newly transcoded files can have say COPYRIGHT tag set to 'processed' using
  '-metadata:s:v:0 COPYRIGHT=processed' and this filter will then break out of the plugin stack cycling
  after transcoding.`,
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'tagName',
      type: 'string',
      defaultValue: 'COPYRIGHT',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the stream tag to check',
    },
    {
      name: 'tagValues',
      type: 'string',
      defaultValue: 'processed',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of tag values to check for.',
    },
    {
      name: 'exactMatch',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip:
      'Specify true if the property value must be an exact match,'
      + ' false if the property value must contain the value.',
    },
    {
      name: 'continueIfTagFound',
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
        'Specify whether to continue the plugin stack if the tag is found.',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const { strHasValue } = require('../methods/utils');
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    infoLog: '',
  };

  if (inputs.tagName.trim() === '') {
    response.infoLog += 'No input tagName entered in plugin, skipping \n';
    return response;
  }

  const tagName = inputs.tagName.trim();

  if (inputs.tagValues.trim() === '') {
    response.infoLog += 'No input tagValues entered in plugin, skipping \n';
    return response;
  }

  const tagValues = inputs.tagValues.trim().split(',');

  let streamContainsTag = false;
  try {
    try {
      for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
        if (strHasValue(tagValues, file.ffProbeData.streams[i]?.tags[tagName], inputs.exactMatch)) {
          streamContainsTag = true;
          break;
        }
      }
    } catch (err) {
    // eslint-disable-next-line no-console
      console.log(err);
    }

    const message = `A stream with tag name ${tagName} containing ${tagValues.join(',')} has`;

    if (inputs.continueIfTagFound === true) {
      if (streamContainsTag === true) {
        response.processFile = true;
        response.infoLog += `${message} been found, continuing to next plugin  \n`;
      } else {
        response.processFile = false;
        response.infoLog += `${message} not been found, breaking out of stack  \n`;
      }
    } else if (inputs.continueIfTagFound === false) {
      if (streamContainsTag === true) {
        response.processFile = false;
        response.infoLog += `${message} been found, breaking out of stack  \n`;
      } else {
        response.processFile = true;
        response.infoLog += `${message} not been found, continuing to next plugin \n`;
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    response.infoLog += err;
    response.processFile = false;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
