/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      preset: ', -map_metadata 0 -id3v2_version 3 -b:a 320k',
      container: '.mp3',
      handbrakeMode: false,
      ffmpegMode: true,
      processFile: false,
      reQueueAfter: true,
      infoLog: 'undefined☒Codec excluded \n ☑Codec not excluded \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleAAC_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      preset: ', -map_metadata 0 -id3v2_version 3 -b:a 320k',
      container: '.mp3',
      handbrakeMode: false,
      ffmpegMode: true,
      processFile: false,
      reQueueAfter: true,
      infoLog: 'undefined☒Codec excluded \n ☑Codec not excluded \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleMP3_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      preset: ', -map_metadata 0 -id3v2_version 3 -b:a 320k',
      container: '.mp3',
      handbrakeMode: false,
      ffmpegMode: true,
      processFile: false,
      reQueueAfter: true,
      infoLog: 'undefined☒Codec excluded \n ☒Codec excluded \n',
    },
  },
];

void run(tests);
