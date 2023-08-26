/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
      librarySettings: {},
      inputs: {
        minModifiedDaysOld: 1,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File modified date old enough. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        minModifiedDaysOld: 9999,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'Skipping, file modified date not old enough',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        minModifiedDaysOld: 1,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File modified date old enough. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        minModifiedDaysOld: 9999,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'Skipping, file modified date not old enough',
    },
  },
];

void run(tests);
