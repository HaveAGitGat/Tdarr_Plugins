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
      preset: '-c:v h264_cuvid,-map 0 -dn -c:v hevc_nvenc -pix_fmt p010le -qmin 0 -cq:v 30 -b:v 964k -maxrate:v 2964k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is 720p!\n'
        + '☒File is not hevc!\n'
        + '☒File bitrate is 1205kb!\n'
        + 'File bitrate is LOWER than the Default Target Bitrate!\n'
        + '☒Target Bitrate set to 964kb!\n'
        + 'File is being transcoded!\n',
      maxmux: false,
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
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n☑File is already in hevc! \n',
      maxmux: false,
    },
  },
];

void run(tests);
