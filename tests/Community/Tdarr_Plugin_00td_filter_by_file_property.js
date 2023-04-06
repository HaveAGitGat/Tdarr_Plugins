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
      processFile: false,
      infoLog: 'File property container of mkv being one of mkv,mp4 has been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'avi',
        continueIfPropertyFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File property container of mkv being one of avi has not been found, continuing to next plugin \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'mkv',
        continueIfPropertyFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File property container of mkv being one of mkv has been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'video_resolution',
        propertyValues: '720p,1080p',
        continueIfPropertyFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File property video_resolution of 1080p being one of 720p,1080p has been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'video_resolution',
        propertyValues: '721p,1081p',
        continueIfPropertyFound: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File property video_resolution of 1080p being one of 721p,1081p has not been found, continuing to next plugin \n',
    },
  },

  // // continueIfPropertyFound: true

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'avi',
        continueIfPropertyFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File property container of mkv being one of avi has not been found, breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'mkv',
        continueIfPropertyFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File property container of mkv being one of mkv has been found, continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'mkv,mp4',
        continueIfPropertyFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File property container of mkv being one of mkv,mp4 has been found, continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'video_resolution',
        propertyValues: '721p,1081p',
        continueIfPropertyFound: true,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File property video_resolution of 1080p being one of 721p,1081p has not been found, breaking out of stack  \n',
    },
  },
];

run(tests);
