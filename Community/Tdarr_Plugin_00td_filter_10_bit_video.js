const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_10_bit_video',
  Stage: 'Pre-processing',
  Name: 'Filter 10 bit video',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Allow/disallow 10 bit video to be processed.',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'process10BitVideo',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Set true to allow 10 bit video to be processed.',
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: true,
    infoLog: 'File will be processed.',
  };

  try {
    const streams10Bit = file.ffProbeData.streams.filter((row) => row.profile === 'Main 10');
    if (inputs.process10BitVideo === false && streams10Bit.length > 0) {
      response.processFile = false;
      response.infoLog = 'File video is 10 bit but 10 bit video processing is not allowed. Skipping plugins.';
    } else if (inputs.process10BitVideo === true && streams10Bit.length > 0) {
      response.infoLog = 'File video is 10 bit and 10 bit video processing is allowed. Continuing to plugins';
    } else if (streams10Bit.length === 0) {
      response.infoLog += 'File is not 10 bit.';
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
