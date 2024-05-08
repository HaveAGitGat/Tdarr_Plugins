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
      processFile: true,
      preset: ', -map 0 -c copy -c:v:0 libx265 -preset:v slow -pix_fmt yuv420p10le -x265-params "crf=22:aq-mode=3"',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒File is not in hevc! \n',
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
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: '☑File is already in hevc! \n'
        + '☑ All audio streams are in aac! \n'
        + '☑File has no title metadata \n'
        + '☑File meets conditions! \n',
    },
  },
];

void run(tests);
