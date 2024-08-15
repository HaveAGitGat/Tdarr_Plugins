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
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'No input propertyToCheck entered in plugin, skipping \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: '',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'No input propertyToCheck entered in plugin, skipping \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_tag',
        valuesToRemove: '',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'No input valuesToRemove entered in plugin, skipping \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_tag',
        valuesToRemove: '0x31637661',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:0 ',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 0 which is has codec_tag of 0x31637661 \n'
        + ' Files has streams which need to be removed, processing \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_tag',
        valuesToRemove: '0x31637661,0x6134706d',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:0  -map -0:1 ',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 0 which is has codec_tag of 0x31637661 \n'
        + ' Removing stream 1 which is has codec_tag of 0x6134706d \n'
        + ' Files has streams which need to be removed, processing \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_tag',
        valuesToRemove: 'random',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Files does not have streams which need to be removed \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_type',
        valuesToRemove: 'video',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:0 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 0 which is has codec_type of video \n'
        + ' Files has streams which need to be removed, processing \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_type',
        valuesToRemove: 'video,audio',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:0  -map -0:1  -map -0:2  -map -0:3  -map -0:4  -map -0:5 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 0 which is has codec_type of video \n'
        + ' Removing stream 1 which is has codec_type of audio \n'
        + ' Removing stream 2 which is has codec_type of audio \n'
        + ' Removing stream 3 which is has codec_type of audio \n'
        + ' Removing stream 4 which is has codec_type of audio \n'
        + ' Removing stream 5 which is has codec_type of audio \n'
        + ' Files has streams which need to be removed, processing \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'codec_type',
        valuesToRemove: 'random',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Files does not have streams which need to be removed \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'level',
        valuesToRemove: '41',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:0 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 0 which is has level of 41 \n'
        + ' Files has streams which need to be removed, processing \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        propertyToCheck: 'CodecID',
        valuesToRemove: 'A_AAC-2,S_TEXT/UTF8',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:4  -map -0:5  -map -0:6 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 4 which is has CodecID of undefined \n'
        + ' Removing stream 5 which is has CodecID of undefined \n'
        + ' Removing stream 6 which is has CodecID of undefined \n'
        + ' Files has streams which need to be removed, processing \n',
    },
  },
];

void run(tests);
