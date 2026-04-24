const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_codec',
  Stage: 'Pre-processing',
  Name: 'Filter By Codec',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Only allow specified codecs to be processed \n\n',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'codecsToProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of codecs to be processed. Leave blank if using codecsToNotProcess',
    },
    {
      name: 'codecsToNotProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of codecs to be not be processed. Leave blank if using codecsToProcess',
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

  const fileCodec = file.video_codec_name !== '' ? file.video_codec_name : file.audio_codec_name;

  if (inputs.codecsToProcess !== '') {
    const codecs = inputs.codecsToProcess.split(',');
    if (codecs.includes(fileCodec)) {
      response.processFile = true;
      response.infoLog += 'File is in codecsToProcess. Moving to next plugin.';
    } else {
      response.processFile = false;
      response.infoLog += 'File is not in codecsToProcess. Breaking out of plugin stack.';
    }
  }

  if (inputs.codecsToNotProcess !== '') {
    const codecs = inputs.codecsToNotProcess.split(',');
    if (codecs.includes(fileCodec)) {
      response.processFile = false;
      response.infoLog += 'File is in codecsToNotProcess. Breaking out of plugin stack.';
    } else {
      response.processFile = true;
      response.infoLog += 'File is not in codecsToNotProcess. Moving to next plugin.';
    }
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
