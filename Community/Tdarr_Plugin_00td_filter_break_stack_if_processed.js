const details = () => ({
  id: 'Tdarr_Plugin_00td_filter_break_stack_if_processed',
  Stage: 'Pre-processing',
  Name: 'Filter - Break Out Of Plugin Stack If Processed',
  Type: 'Video',
  Operation: 'Filter',
  Description: `This plugin will break out of the plugin stack if the file has been processed
 (i.e. if a new file has been created). In general, place it before your transcode plugin
 (for example when trying to force h264 to h264 transcoding which is difficult to do with normal plugins)`,
  Version: '1.00',
  Tags: 'filter',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: true,
    infoLog: '',
  };

  if (file.file !== otherArguments.originalLibraryFile.file) {
    response.processFile = false;
    response.infoLog = 'File has been processed, breaking out of plugin stack.';
  } else {
    response.infoLog = 'File has not been processed yet. Continuing to next plugin.';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
