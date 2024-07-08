const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_size',
  Stage: 'Pre-processing',
  Name: 'Filter By Size',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Only allow files to be transcoded which are within the lower and upper bounds (MB) \n\n',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 100000,
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the upper bound size in MB for files which should be processed.'
        + ' Files above this size won\'t be processed.',
    },
    {
      name: 'lowerBound',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the lower bound size in MB for files which should be processed.'
        + ' Files below this size won\'t be processed.',
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

  const fileSize = file.file_size;
  if (fileSize >= inputs.lowerBound && fileSize <= inputs.upperBound) {
    response.processFile = true;
    response.infoLog += 'File is within lower and upper bound size limits. Moving to next plugin.';
  } else {
    response.infoLog += 'File is not within lower and upper bound size limits. Breaking out of plugin stack.';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
