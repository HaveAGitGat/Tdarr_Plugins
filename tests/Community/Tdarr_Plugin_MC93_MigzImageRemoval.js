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
      handBrakeMode: false,
      container: '.mp4',
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: "☑File doesn't contain any unwanted image format streams.\n",
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[0].codec_name = 'mjpeg';
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c copy -max_muxing_queue_size 9999 -map -v:0 ',
      handBrakeMode: false,
      container: '.mkv',
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒File has image format stream, removing. \n',
    },
  },
];

void run(tests);
