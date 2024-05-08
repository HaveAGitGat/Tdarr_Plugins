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
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'File has video in first stream\n File meets conditions!\n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));

        const audio = file.ffProbeData.streams[1];
        // eslint-disable-next-line prefer-destructuring
        file.ffProbeData.streams[1] = file.ffProbeData.streams[0];
        file.ffProbeData.streams[0] = audio;
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v? -map 0:a? -map 0:s? -map 0:d? -map 0:t? -c copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Video is not in the first stream',
    },
  },
];

void run(tests);
