/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: '☑File bitrate is within filter limits. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        upperBound: 500,
        lowerBound: 0,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: '☒File bitrate is not within filter limits. Breaking out of plugin stack.\n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        upperBound: 10000,
        lowerBound: 0,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: '☑File bitrate is within filter limits. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        upperBound: 10000,
        lowerBound: 9000,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: '☒File bitrate is not within filter limits. Breaking out of plugin stack.\n',
    },
  },
];

void run(tests);
