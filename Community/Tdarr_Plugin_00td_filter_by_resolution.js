const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_by_resolution',
  Stage: 'Pre-processing',
  Name: 'Filter By Resolution',
  Type: 'Video',
  Operation: 'Filter',
  Description: 'Only allow specified resolutions to be processed \n\n',
  Version: '1.00',
  Tags: 'filter',
  Inputs: [
    {
      name: 'resolutionsToProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter a comma separated list of resolutions to be processed.
         Leave blank if using resolutionsToNotProcess.
         480p,576p,720p,1080p,4KUHD,DCI4K,8KUHD,Other
         `,
    },
    {
      name: 'resolutionsToNotProcess',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter a comma separated list of resolutions to be not be processed.'
        + ' Leave blank if using resolutionsToProcess',
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

  if (!file.video_resolution) {
    throw new Error('File has no resolution!');
  }

  const fileResolution = file.video_resolution;

  if (inputs.resolutionsToProcess !== '') {
    const resolutions = inputs.resolutionsToProcess.split(',');
    if (resolutions.includes(fileResolution)) {
      response.processFile = true;
      response.infoLog += 'File is in resolutionsToProcess. Moving to next plugin.';
    } else {
      response.processFile = false;
      response.infoLog += 'File is not in resolutionsToProcess. Breaking out of plugin stack.';
    }
  }

  if (inputs.resolutionsToNotProcess !== '') {
    const resolutions = inputs.resolutionsToNotProcess.split(',');
    if (resolutions.includes(fileResolution)) {
      response.processFile = false;
      response.infoLog += 'File is in resolutionsToNotProcess. Breaking out of plugin stack.';
    } else {
      response.processFile = true;
      response.infoLog += 'File is not in resolutionsToNotProcess. Moving to next plugin.';
    }
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
