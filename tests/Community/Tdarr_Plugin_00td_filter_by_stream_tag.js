/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'A stream with tag name COPYRIGHT containing processed has not been found, continuing to next plugin \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'processed',
        continueIfTagFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'A stream with tag name COPYRIGHT containing processed has not been found, continuing to next plugin \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'processed',
        continueIfTagFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'A stream with tag name COPYRIGHT containing processed has been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[1].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'proc,processed',
        continueIfTagFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'A stream with tag name COPYRIGHT containing proc,processed has been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'proc,proce',
        continueIfTagFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'A stream with tag name COPYRIGHT containing proc,proce has not been found, continuing to next plugin \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'proc,proce',
        continueIfTagFound: false,
        exactMatch: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'A stream with tag name COPYRIGHT containing proc,proce has been found, breaking out of stack  \n',
    },
  },

  // continueIfTagFound: true

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'processed',
        continueIfTagFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'A stream with tag name COPYRIGHT containing processed has not been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'processed',
        continueIfTagFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'A stream with tag name COPYRIGHT containing processed has been found, continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[1].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'proc,processed',
        continueIfTagFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'A stream with tag name COPYRIGHT containing proc,processed has been found, continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'proc,proce',
        continueIfTagFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'A stream with tag name COPYRIGHT containing proc,proce has not been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.ffProbeData.streams[0].tags.COPYRIGHT = 'processed';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        tagName: 'COPYRIGHT',
        tagValues: 'proc,proce',
        continueIfTagFound: true,
        exactMatch: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'A stream with tag name COPYRIGHT containing proc,proce has been found, continuing to next plugin  \n',
    },
  },
];

void run(tests);
