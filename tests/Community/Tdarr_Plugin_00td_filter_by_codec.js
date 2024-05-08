const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: { processFile: false, infoLog: '' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'h264',
      },
      otherArguments: {},
    },
    output: { processFile: true, infoLog: 'File is in codecsToProcess. Moving to next plugin.' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'h265',
      },
      otherArguments: {},
    },
    output: { processFile: false, infoLog: 'File is not in codecsToProcess. Breaking out of plugin stack.' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        codecsToNotProcess: 'h264',
      },
      otherArguments: {},
    },
    output: { processFile: false, infoLog: 'File is in codecsToNotProcess. Breaking out of plugin stack.' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        codecsToNotProcess: 'h265',
      },
      otherArguments: {},
    },
    output: { processFile: true, infoLog: 'File is not in codecsToNotProcess. Moving to next plugin.' },
  },
];

void run(tests);
