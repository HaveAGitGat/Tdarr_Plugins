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
      infoLog: ' Checking property value of mkv == input value of mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
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
      infoLog: ' Checking property value of mkv == input value of avi \n'
      + ' isConditionMet: false \n'
      + ' continueIfPropertyFound: false \n'
      + 'Continuing to next plugin  \n',
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
      infoLog: ' Checking property value of mkv == input value of mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
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
      infoLog: ' Checking property value of 1080p == input value of 720p \n'
      + ' Checking property value of 1080p == input value of 1080p \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
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
      infoLog: ' Checking property value of 1080p == input value of 721p \n'
      + ' Checking property value of 1080p == input value of 1081p \n'
      + ' isConditionMet: false \n'
      + ' continueIfPropertyFound: false \n'
      + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file',
        propertyValues: 'Source Folder/h264.mkv',
        continueIfPropertyFound: false,
        exactMatch: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of C:/Transcode/Source Folder/h264.mkv includes input value of Source Folder/h264.mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
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
      infoLog: ' Checking property value of mkv == input value of avi \n'
      + ' isConditionMet: false \n'
      + ' continueIfPropertyFound: true \n'
      + 'Breaking out of stack  \n',
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
      infoLog: ' Checking property value of mkv == input value of mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: true \n'
      + 'Continuing to next plugin  \n',
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
      infoLog: ' Checking property value of mkv == input value of mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: true \n'
      + 'Continuing to next plugin  \n',
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
      infoLog: ' Checking property value of 1080p == input value of 721p \n'
      + ' Checking property value of 1080p == input value of 1081p \n'
      + ' isConditionMet: false \n'
      + ' continueIfPropertyFound: true \n'
      + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file',
        propertyValues: 'Source Folder/h264.mkv',
        continueIfPropertyFound: true,
        exactMatch: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of C:/Transcode/Source Folder/h264.mkv includes input value of Source Folder/h264.mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: true \n'
      + 'Continuing to next plugin  \n',
    },
  },

  // check other conditions

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'mkv',
        condition: '==',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of mkv == input value of mkv \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'avi',
        condition: '==',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of mkv == input value of avi \n'
      + ' isConditionMet: false \n'
      + ' continueIfPropertyFound: false \n'
      + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '60',
        condition: '>',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of 64.9300765991211 > input value of 60 \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '70',
        condition: '>',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of 64.9300765991211 > input value of 70 \n'
        + ' isConditionMet: false \n'
        + ' continueIfPropertyFound: false \n'
        + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '60',
        condition: '>=',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of 64.9300765991211 >= input value of 60 \n'
      + ' isConditionMet: true \n'
      + ' continueIfPropertyFound: false \n'
      + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '70',
        condition: '>=',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of 64.9300765991211 >= input value of 70 \n'
        + ' isConditionMet: false \n'
        + ' continueIfPropertyFound: false \n'
        + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '60',
        condition: '<',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of 64.9300765991211 < input value of 60 \n'
        + ' isConditionMet: false \n'
        + ' continueIfPropertyFound: false \n'
        + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '70',
        condition: '<',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of 64.9300765991211 < input value of 70 \n'
        + ' isConditionMet: true \n'
        + ' continueIfPropertyFound: false \n'
        + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '60',
        condition: '<=',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of 64.9300765991211 <= input value of 60 \n'
        + ' isConditionMet: false \n'
        + ' continueIfPropertyFound: false \n'
        + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'file_size',
        propertyValues: '70',
        condition: '<=',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of 64.9300765991211 <= input value of 70 \n'
        + ' isConditionMet: true \n'
        + ' continueIfPropertyFound: false \n'
        + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'mk',
        condition: 'includes',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of mkv includes input value of mk \n'
        + ' isConditionMet: true \n'
        + ' continueIfPropertyFound: false \n'
        + 'Breaking out of stack  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'av',
        condition: 'includes',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of mkv includes input value of av \n'
        + ' isConditionMet: false \n'
        + ' continueIfPropertyFound: false \n'
        + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'mk',
        condition: 'not includes',

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: ' Checking property value of mkv not includes input value of mk \n'
        + ' isConditionMet: false \n'
        + ' continueIfPropertyFound: false \n'
        + 'Continuing to next plugin  \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyName: 'container',
        propertyValues: 'av',
        condition: 'not includes',

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: ' Checking property value of mkv not includes input value of av \n'
        + ' isConditionMet: true \n'
        + ' continueIfPropertyFound: false \n'
        + 'Breaking out of stack  \n',
    },
  },
];

void run(tests);
