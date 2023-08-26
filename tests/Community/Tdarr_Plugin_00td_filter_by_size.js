/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File is within lower and upper bound size limits. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        upperBound: 0.5,
        lowerBound: 0,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File is not within lower and upper bound size limits. Breaking out of plugin stack.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        upperBound: 2,
        lowerBound: 0,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File is within lower and upper bound size limits. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        upperBound: 4,
        lowerBound: 2,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File is not within lower and upper bound size limits. Breaking out of plugin stack.',
    },
  },
];

void run(tests);
