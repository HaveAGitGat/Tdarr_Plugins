// eslint-disable-next-line import/no-unresolved
const loadDefaultValues = require('../methods/loadDefaultValues');

const details = () => ({
  id: 'Tdarr_Plugin_a9hf_New_file_duration_check',
  Stage: 'Pre-processing',
  Name: 'New file duration check',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Give an error if new file is not within the specified upper and lower bound duration limits.
  Make sure MediaInfo scan is enabled in library settings \n\n`,
  Version: '1.00',
  Tags: '',
  Inputs: [
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 101,
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
      defaultValue: 99,
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
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = loadDefaultValues(inputs, details);
  // Must return this object at some point in the function else plugin will fail.
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  let newData = 0;
  let oldData = 0;

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

  const ratio = parseInt((newData / oldData) * 100, 10);

  const dataText = `New file has duration ${newData} s which is ${ratio}% `
    + `of original file duration:  ${oldData} s`;

  const getBound = (bound) => (bound / 100) * oldData;

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
