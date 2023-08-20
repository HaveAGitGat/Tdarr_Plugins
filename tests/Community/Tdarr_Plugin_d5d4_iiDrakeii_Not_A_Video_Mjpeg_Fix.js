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
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: '☑File is a video Without Mjpeg! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[0].codec_name = 'mjpeg';
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: ',-map 0 -map -0:v:1 -c:v copy -c:a copy -c:s copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: '☒File is not a video but has Mjpeg Stream! \n'
        + '☑File is a video With Mjpeg! \n',
    },
  },
];

void run(tests);
