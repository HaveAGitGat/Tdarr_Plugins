const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_bit_depth',
  Stage: 'Pre-processing',
  Name: 'Filter Bit Depth: 8,10,12 Bit Video',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Allow/disallow 8,10,12 bit video to be processed.',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'process8BitVideo',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Set true to allow 8 bit video to be processed.',
    },
    {
      name: 'process10BitVideo',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Set true to allow 10 bit video to be processed.',
    },
    {
      name: 'process12BitVideo',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Set true to allow 12 bit video to be processed.',
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

  // process8BitVideo
  // process10BitVideo
  // process12BitVideo

  const bitDepths = {
    8: 'Main',
    10: 'Main 10',
    12: 'Main 12',
  };

  let foundBitDepth = false;
  Object.keys(bitDepths).forEach((bitDepth) => {
    try {
      const fileHasSpecifiedBitDepth = file.ffProbeData.streams
        .filter((row) => row.bits_per_raw_sample === bitDepth).length > 0
      || file.ffProbeData.streams.filter((row) => row.profile === bitDepths[bitDepth]).length > 0;

      if (fileHasSpecifiedBitDepth) {
        foundBitDepth = true;
        response.infoLog += `File video is ${bitDepth} bit.`;
        if (inputs[`process${bitDepth}BitVideo`]) {
          response.processFile = true;
          response.infoLog += ` ${bitDepth} bit is allowed, will process.`;
        } else {
          response.infoLog += ` ${bitDepth} bit is not allowed, will not process.`;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  });

  if (!foundBitDepth) {
    response.infoLog += ' Unable to find file bit depth. Won\'t process.';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
