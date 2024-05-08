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
        codecTagStringsToProcess: 'avc1,rand',
      },
      otherArguments: {},
    },
    output: { processFile: true, infoLog: 'File is in codecTagStringsToProcess. Moving to next plugin.' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        codecTagStringsToNotProcess: 'avc1,rand',
      },
      otherArguments: {},
    },
    output: { processFile: false, infoLog: 'File is in codecTagStringsToNotProcess. Breaking out of plugin stack.' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH265_1.json'),
      librarySettings: {},
      inputs: {
        codecTagStringsToProcess: 'avc1,rand',
      },
      otherArguments: {},
    },
    output: { processFile: false, infoLog: 'File is not in codecTagStringsToProcess. Breaking out of plugin stack.' },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH265_1.json'),
      librarySettings: {},
      inputs: {
        codecTagStringsToNotProcess: 'avc1,rand',
      },
      otherArguments: {},
    },
    output: { processFile: true, infoLog: 'File is not in codecTagStringsToNotProcess. Moving to next plugin.' },
  },
];

void run(tests);
