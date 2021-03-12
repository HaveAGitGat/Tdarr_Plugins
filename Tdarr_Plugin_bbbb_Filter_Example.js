module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_bbbb_Filter_Example',
    Stage: 'Pre-processing',
    Name: 'Filter keywords ',
    Type: 'Video',
    Operation: 'Filter',
    Description: 'This plugin prevents processing files which contain keywords \n\n',
    Version: '1.00',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugin_bbbb_Filter_Example.js',
    Tags: '',
  };
};

module.exports.plugin = function plugin(file) {
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
