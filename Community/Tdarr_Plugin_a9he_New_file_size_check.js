const details = () => ({
  id: 'Tdarr_Plugin_a9he_New_file_size_check',
  Stage: 'Pre-processing',
  Name: 'New File Size Check',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Give an error if new file is not within the specified upper and lower bound limits \n\n',
  Version: '1.00',
  Tags: '',
  Inputs: [
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 110,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the upper bound % size for the new file. For example, if '110' is entered, 
        then if the new file size is greater than 110% the size of the original, an error will be given.`,
    },
    {
      name: 'lowerBound',
      type: 'number',
      defaultValue: 40,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the lower bound % size for the new file. For example, if '90' is entered, 
        then if the new file size is less than 90% of the original, an error will be given.`,
    },
  ],
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

  const ratio = parseInt((newSize / oldSize) * 100, 10);

  const sizeText = `New file has size ${newSize.toFixed(3)} MB which is ${ratio}% `
    + `of original file size:  ${oldSize.toFixed(3)} MB`;

  const getBound = (bound) => (bound / 100) * oldSize;

  const errText = 'New file size not within limits.';
  if (newSize > getBound(inputs.upperBound)) {
    // Item will be errored in UI
    throw new Error(`${errText} ${sizeText}. upperBound is ${inputs.upperBound}%`);
  } else if (newSize < getBound(inputs.lowerBound)) {
    // Item will be errored in UI
    throw new Error(`${errText} ${sizeText}. lowerBound is ${inputs.lowerBound}%`);
  } else {
    response.infoLog += sizeText;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
