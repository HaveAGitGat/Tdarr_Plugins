/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      },
    },
    output: {
      processFile: true,
      infoLog: 'File has not been processed yet. Continuing to next plugin.',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: (() => {
          const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
          file.file += 'test';
          return file;
        })(),
      },
    },
    output: {
      processFile: false,
      infoLog: 'File has been processed, breaking out of plugin stack.',
    },
  },
];

void run(tests);
