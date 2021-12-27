const lib = require('../methods/library');

const details = () => ({
  id: 'Tdarr_Plugin_f002_Filter_Example',
  Stage: 'Pre-processing',
  Name: 'Filter resolutions',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'This plugin prevents processing files with specified resolutions \n\n',
  Version: '1.00',
  Tags: '',
  Inputs: [],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: true,
    infoLog: '',
  };

  const resolutionsToSkip = [
    '1080p',
    '4KUHD',
  ];

  for (let i = 0; i < resolutionsToSkip.length; i += 1) {
    if (file.video_resolution === resolutionsToSkip[i]) {
      response.processFile = false;
      response.infoLog += `Filter preventing processing. File has resolution ${resolutionsToSkip[i]}`;
      break;
    }
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
