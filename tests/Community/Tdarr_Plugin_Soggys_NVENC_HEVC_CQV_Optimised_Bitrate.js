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
      preset: '-hwaccel cuda <io> -map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 28 -rc-lookahead 32 -bf 0 -a53cc 0 -c:a copy -c:s copy -pix_fmt p010le',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
      + 'Optimal Bitrate = 2.7648\n'
      + 'Stream Bitrate = 1.591143\n'
      + '☑Preset set as medium\n'
      + 'File is being transcoded!\n',
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
      preset: '-hwaccel cuda <io> -map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 28 -rc-lookahead 32 -bf 0 -a53cc 0 -c:a copy -c:s copy -pix_fmt p010le',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
      + 'Optimal Bitrate = 6.21432\n'
      + 'Stream Bitrate = 8.248746\n'
      + '☑Preset set as medium\n'
      + 'File is being transcoded!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        targetCodecCompression: 0.13,
        cqv: 29,
        bframe: 1,
        ten_bit: true,
        ffmpeg_preset: 'fast',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-hwaccel cuda <io> -map 0 -dn -c:v hevc_nvenc -b:v 0 -preset fast -cq 29 -rc-lookahead 32 -bf 1 -a53cc 0 -c:a copy -c:s copy -pix_fmt p010le',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + 'Optimal Bitrate = 2.9952\n'
        + 'Stream Bitrate = 1.591143\n'
        + '☑Preset set as fast\n'
        + 'File is being transcoded!\n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        targetCodecCompression: 0.11,
        cqv: 20,
        bframe: 5,
        ten_bit: false,
        ffmpeg_preset: 'slow',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-hwaccel cuda <io> -map 0 -dn -c:v hevc_nvenc -b:v 0 -preset slow -cq 20 -rc-lookahead 32 -bf 5 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + 'Optimal Bitrate = 2.5344\n'
        + 'Stream Bitrate = 1.591143\n'
        + '☑Preset set as slow\n'
        + 'File is being transcoded!\n',
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
      infoLog: '☑File is a video! \n'
      + 'Optimal Bitrate = 6.2208\n'
      + 'Stream Bitrate = 3.207441\n'
      + '☑File is already in hevc and is below optimal bitrate!\n',
    },
  },
];

run(tests);
