/* eslint max-len: 0 */
const _ = require('lodash');
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
      infoLog: 'File will be processed.File is not 10 bit.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = 'Main 10';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process10BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 10 bit but 10 bit video processing is not allowed. Skipping plugins.',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = 'Main 10';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process10BitVideo: true,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File video is 10 bit and 10 bit video processing is allowed. Continuing to plugins',
    },
  },

];

run(tests);
