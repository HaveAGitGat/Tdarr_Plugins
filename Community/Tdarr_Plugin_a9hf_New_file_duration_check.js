// eslint-disable-next-line import/no-unresolved

const details = () => ({
  id: 'Tdarr_Plugin_a9hf_New_file_duration_check',
  Stage: 'Pre-processing',
  Name: 'New File Duration Check',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Give an error if new file is not within the specified upper and lower bound duration limits.
  Make sure MediaInfo scan is enabled in library settings \n\n`,
  Version: '1.02',
  Tags: '',
  Inputs: [
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 100.5,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the upper bound % for the new file duration. For example, if '110' is entered, 
        then if the new file duration is 11% larger than the original, an error will be given.`,
    },
    {
      name: 'lowerBound',
      type: 'number',
      defaultValue: 99.5,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the lower bound % for the new file duration. For example, if '90' is entered, 
        then if the new file duration is less than 90% of the original, an error will be given.`,
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

  let newData = 0.0;
  let oldData = 0.0;

  const getData = (obj) => {
    try {
      return Number(obj.mediaInfo.track.filter((row) => row['@type'] === 'General')[0].Duration);
    } catch (err) {
      // err
    }
    return 0;
  };

  newData = getData(file);
  oldData = getData(otherArguments.originalLibraryFile);

  const ratio = ((newData / oldData) * 100.0).toFixed(3);

  const dataText = `New file has duration ${newData} s which is ${ratio}% `
    + `of original file duration:  ${oldData} s`;

  const getBound = (bound) => (bound / 100.0) * oldData;

  const errText = 'New file duration not within limits.';
  if (newData > getBound(inputs.upperBound)) {
    // Item will be errored in UI
    throw new Error(`${errText} ${dataText}. upperBound is ${inputs.upperBound}%`);
  } else if (newData < getBound(inputs.lowerBound)) {
    // Item will be errored in UI
    throw new Error(`${errText} ${dataText}. lowerBound is ${inputs.lowerBound}%`);
  } else {
    response.infoLog += dataText;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
