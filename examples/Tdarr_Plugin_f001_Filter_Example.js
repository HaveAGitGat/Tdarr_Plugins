const details = () => ({
  id: 'Tdarr_Plugin_f001_Filter_Example',
  Stage: 'Pre-processing',
  Name: 'Filter Keywords',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'This plugin prevents processing files which contain keywords \n\n',
  Version: '1.00',
  Tags: '',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // Must return this object at some point in the function else plugin will fail.

  const response = {
    processFile: true,
    infoLog: '',
  };

  const keywords = [
    'Low quality',
  ];

  for (let i = 0; i < keywords.length; i += 1) {
    if (file.file.includes(keywords[i])) {
      response.processFile = false;
      response.infoLog += `Filter preventing processing. File title contains keyword ${keywords[i]}`;
      break;
    }
  }

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
