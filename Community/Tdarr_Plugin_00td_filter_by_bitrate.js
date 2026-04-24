const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_bitrate',
  Stage: 'Pre-processing',
  Name: 'Filter By Bitrate',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Only allow files to be transcoded which are within the lower and upper bounds (Kb) \n\n',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 10000,
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the upper bound bitrate in Kb for files which should be processed.',
    },
    {
      name: 'lowerBound',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the lower bound bitrate in Kb for files which should be processed.',
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

  if (
    file.bit_rate >= inputs.lowerBound * 1000
    && file.bit_rate <= inputs.upperBound * 1000
  ) {
    response.processFile = true;
    response.infoLog += '☑File bitrate is within filter limits. Moving to next plugin.';
  } else {
    response.processFile = false;
    response.infoLog += '☒File bitrate is not within filter limits. Breaking out of plugin stack.\n';
    return response;
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
