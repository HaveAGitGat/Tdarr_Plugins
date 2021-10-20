module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_bbbc_Filter_Example',
    Stage: 'Pre-processing',
    Name: 'Filter resolutions',
    Type: 'Video',
    Operation: 'Filter',
    Description: 'This plugin prevents processing files with specified resolutions \n\n',
    Version: '1.00',
    Link: '',
    Tags: '',
  };
};

module.exports.plugin = function plugin(file) {
  const response = {
    processFile: true,
    infoLog: '',
  };

  const resolutionsToSkip = [
    "1080p",
    '4KUHD'
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
