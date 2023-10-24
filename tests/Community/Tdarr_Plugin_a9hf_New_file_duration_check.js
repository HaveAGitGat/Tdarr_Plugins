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
      infoLog: 'New file has duration 5.312 s which is 100.000% of original file duration:  5.312 s',
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
          file.mediaInfo.track.filter((row) => row['@type'] === 'General')[0].Duration = 20;
          return file;
        })(),
      },
    },
    output: 'New file duration not within limits. New file has duration 5.312 s which is 26.560% of original file duration:  20 s. lowerBound is 35%',
    error: {
      shouldThrow: true,
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
          file.mediaInfo.track.filter((row) => row['@type'] === 'General')[0].Duration = 1;
          return file;
        })(),
      },
    },
    output: 'New file duration not within limits. New file has duration 5.312 s which is 531.200% of original file duration:  1 s. upperBound is 110%',
    error: {
      shouldThrow: true,
    },
  },
];

void run(tests);
