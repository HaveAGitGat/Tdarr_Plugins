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
      processFile: false,
      preset: ', -map 0:v',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: 'Removing unwanted audio...\n'
        + 'Found unwanted: und: 1\n'
        + 'Found unwanted: und: 1\n'
        + 'No unwanted audio found!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: ', -map 0:v -map 0:1',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: 'Removing unwanted audio...\nAdded undefined: 1\nNo unwanted audio found!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        languages: 'fre',
        container: 'mp4',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v -map 0:4 -map 0:s? -c copy',
      container: 'mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Removing unwanted audio...\n'
        + 'Found wanted fre: 4\n'
        + 'Found unwanted audio\n'
        + 'It will be removed\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        languages: 'eng',
        container: 'mp4',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v -map 0:1 -map 0:2 -map 0:3 -map 0:5 -map 0:s? -c copy',
      container: 'mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Removing unwanted audio...\n'
        + 'Found wanted eng: 1\n'
        + 'Found wanted eng: 2\n'
        + 'Found wanted eng: 3\n'
        + 'Found wanted eng: 5\n'
        + 'Found unwanted audio\n'
        + 'It will be removed\n',
    },
  },
];

void run(tests);
