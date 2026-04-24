const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_codec_tag_string',
  Stage: 'Pre-processing',
  Name: 'Filter By Codec Tag String',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Only allow files with specified codec tag strings to be processed \n\n',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'codecTagStringsToProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `
Enter a comma separated list of codec tag strings to be processed.
Leave blank if using codecTagStringsToNotProcess`,
    },
    {
      name: 'codecTagStringsToNotProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `
Enter a comma separated list of codec tag strings to be not be processed.
Leave blank if using codecTagStringsToProcess`,
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

  let fileCodecTagStrings = [];
  if (file.ffProbeData && file.ffProbeData.streams) {
    fileCodecTagStrings = file.ffProbeData.streams.map((row) => row.codec_tag_string);
  }

  const checkInclude = (inputArr) => {
    for (let i = 0; i < fileCodecTagStrings.length; i += 1) {
      if (inputArr.includes(fileCodecTagStrings[i])) {
        return true;
      }
    }
    return false;
  };

  if (inputs.codecTagStringsToProcess !== '') {
    const codecTagStrings = inputs.codecTagStringsToProcess.split(',');
    if (checkInclude(codecTagStrings)) {
      response.processFile = true;
      response.infoLog += 'File is in codecTagStringsToProcess. Moving to next plugin.';
    } else {
      response.processFile = false;
      response.infoLog += 'File is not in codecTagStringsToProcess. Breaking out of plugin stack.';
    }
  }

  if (inputs.codecTagStringsToNotProcess !== '') {
    const codecTagStrings = inputs.codecTagStringsToNotProcess.split(',');
    if (checkInclude(codecTagStrings)) {
      response.processFile = false;
      response.infoLog += 'File is in codecTagStringsToNotProcess. Breaking out of plugin stack.';
    } else {
      response.processFile = true;
      response.infoLog += 'File is not in codecTagStringsToNotProcess. Moving to next plugin.';
    }
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
