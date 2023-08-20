/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true, infoLog: 'File video is 8 bit. 8 bit is allowed, will process.',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 8 bit. 8 bit is not allowed, will not process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = '';
        file.ffProbeData.streams[0].bits_per_raw_sample = '8';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 8 bit. 8 bit is not allowed, will not process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = '';
        file.ffProbeData.streams[0].bits_per_raw_sample = '8';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: true,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File video is 8 bit. 8 bit is allowed, will process.',
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
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 10 bit. 10 bit is not allowed, will not process.',
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
        process8BitVideo: false,
        process10BitVideo: true,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File video is 10 bit. 10 bit is allowed, will process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = '';
        file.ffProbeData.streams[0].bits_per_raw_sample = '10';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 10 bit. 10 bit is not allowed, will not process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = '';
        file.ffProbeData.streams[0].bits_per_raw_sample = '10';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: true,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File video is 10 bit. 10 bit is allowed, will process.',
    },
  },
  //
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = 'Main 12';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 12 bit. 12 bit is not allowed, will not process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = 'Main 12';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: true,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File video is 12 bit. 12 bit is allowed, will process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = '';
        file.ffProbeData.streams[0].bits_per_raw_sample = '12';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File video is 12 bit. 12 bit is not allowed, will not process.',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].profile = '';
        file.ffProbeData.streams[0].bits_per_raw_sample = '12';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        process8BitVideo: false,
        process10BitVideo: false,
        process12BitVideo: true,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File video is 12 bit. 12 bit is allowed, will process.',
    },
  },
];

void run(tests);
