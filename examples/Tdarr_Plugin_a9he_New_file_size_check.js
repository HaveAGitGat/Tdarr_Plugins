const details = () => ({
  id: 'Tdarr_Plugin_a9he_New_file_size_check',
  Stage: 'Pre-processing',
  Name: 'New File Size Check',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Give an error if new file is larger than the original \n\n',
  Version: '1.00',
  Tags: '',
  Inputs: [],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // Must return this object at some point in the function else plugin will fail.
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  const newSize = file.file_size;
  const oldSize = otherArguments.originalLibraryFile.file_size;
  if (newSize > oldSize) {
    // Item will be errored in UI
    throw new Error(`Error! New file has size ${newSize} which is larger than original file ${oldSize}`);
  } else if (newSize < oldSize) {
    response.infoLog += `New file has size ${newSize} which is smaller than original file ${oldSize}`;
  }
  // if file sizes are exactly the same then file has not been transcoded yet

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
