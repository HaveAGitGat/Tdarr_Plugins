const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_file_property',
  Stage: 'Pre-processing',
  Name: 'Filter by file property',
  Type: 'Video',
  Operation: 'Filter',
  Description: `Filter by a top level file property.
  For example, container, video_resolution, video_codec_name, fileMedium.
  Click on a file name on the Tdarr tab or Search tab to see top-level file properties.
  `,
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'propertyName',
      type: 'string',
      defaultValue: 'container',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the file property to check',
    },
    {
      name: 'propertyValues',
      type: 'string',
      defaultValue: 'mkv,mp4',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of values to check for.',
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
      name: 'continueIfPropertyFound',
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
        'Specify whether to continue the plugin stack if the property is found.',
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const { strHasValue } = require('../methods/utils');
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    infoLog: '',
  };

  if (inputs.propertyName.trim() === '') {
    response.infoLog += 'No input propertyName entered in plugin, skipping \n';
    return response;
  }

  const propertyName = inputs.propertyName.trim();

  if (inputs.propertyValues.trim() === '') {
    response.infoLog += 'No input propertyValues entered in plugin, skipping \n';
    return response;
  }

  const propertyValues = inputs.propertyValues.trim().split(',');

  try {
    const fileContainsProperty = strHasValue(propertyValues, file[propertyName], inputs.exactMatch);

    const message = `File property ${propertyName} of ${file[propertyName]}`
    + ` being one of ${propertyValues.join(',')} has`;

    if (inputs.continueIfPropertyFound === true) {
      if (fileContainsProperty === true) {
        response.processFile = true;
        response.infoLog += `${message} been found, continuing to next plugin  \n`;
      } else {
        response.processFile = false;
        response.infoLog += `${message} not been found, breaking out of stack  \n`;
      }
    } else if (inputs.continueIfPropertyFound === false) {
      if (fileContainsProperty === true) {
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
