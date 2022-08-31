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
      preset: '-hwaccel cuda ,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 28 -rc-lookahead 32 -bf 0 -a53cc 0 -c:a copy -c:s copy -pix_fmt p010le',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n' +
      'Optimal Bitrate = 2.7648\n' +
      'Stream Bitrate = 1.591143\n' +
      '☑Preset set as medium\n' +
      'File is being transcoded!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-hwaccel cuda ,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 28 -rc-lookahead 32 -bf 0 -a53cc 0 -c:a copy -c:s copy -pix_fmt p010le',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n' +
      'Optimal Bitrate = 6.21432\n' +
      'Stream Bitrate = 8.248746\n' +
      '☑Preset set as medium\n' +
      'File is being transcoded!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-hwaccel cuda ,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 28 -rc-lookahead 32 -bf 0 -a53cc 0 -c:a copy -c:s copy -pix_fmt p010le',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n' +
      'Optimal Bitrate = 6.21432\n' +
      'Stream Bitrate = 8.248746\n' +
      '☑Preset set as medium\n' +
      'File is being transcoded!\n',
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
      infoLog: '☑File is a video! \n' +
      'Optimal Bitrate = 6.2208\n' +
      'Stream Bitrate = 3.207441\n' +
      '☑File is already in hevc and is below optimal bitrate!\n',
    },
  },
];

run(tests);
