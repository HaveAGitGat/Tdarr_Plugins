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
      processFile: false, infoLog: '',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        resolutionsToProcess: '480p,720p',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File is in resolutionsToProcess. Moving to next plugin.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        resolutionsToProcess: '480p,1080p',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File is not in resolutionsToProcess. Breaking out of plugin stack.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        resolutionsToNotProcess: '480p,720p',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File is in resolutionsToNotProcess. Breaking out of plugin stack.',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        resolutionsToNotProcess: '480p,1080p',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File is not in resolutionsToNotProcess. Moving to next plugin.',
    },
  },
];

void run(tests);
