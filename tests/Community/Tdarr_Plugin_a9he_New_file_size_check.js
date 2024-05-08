/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      },
    },
    output: {
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'New file has size 1.008 MB which is 100% of original file size:  1.008 MB',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        upperBound: '110',
        lowerBound: '35',
      },
      otherArguments: {
        originalLibraryFile: (() => {
          const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
          file.file_size = 3;
          return file;
        })(),
      },
    },
    output: 'New file size not within limits. New file has size 1.008 MB which is 33% of original file size:  3.000 MB. lowerBound is 35%',
    error: {
      shouldThrow: true,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        upperBound: '120',
        lowerBound: '35',
      },
      otherArguments: {
        originalLibraryFile: (() => {
          const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
          file.file_size = 0.1;
          return file;
        })(),
      },
    },
    output: 'New file size not within limits. New file has size 1.008 MB which is 1007% of original file size:  0.100 MB. upperBound is 120%',
    error: {
      shouldThrow: true,
    },
  },
];

void run(tests);
