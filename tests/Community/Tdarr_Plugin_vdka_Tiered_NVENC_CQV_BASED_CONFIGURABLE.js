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
      preset: '-c:v h264_cuvid,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset slow -cq 23 -rc-lookahead 32 -bf 0 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☑Preset set as slow\n'
        + '☑File is 720p, using CQ:V value of 23!\n'
        + '☒File is not hevc!\n'
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
      infoLog: '☑File is a video! \n☑File is already in hevc! \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        sdCQV: '22',
        hdCQV: '24',
        fullhdCQV: '26',
        uhdCQV: '29',
        bframe: '5',
        ffmpeg_preset: 'medium',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-c:v h264_cuvid,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 24 -rc-lookahead 32 -bf 5 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☑Preset set as medium\n'
        + '☑File is 720p, using CQ:V value of 24!\n'
        + '☒File is not hevc!\n'
        + 'File is being transcoded!\n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '480p';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        sdCQV: '22',
        hdCQV: '24',
        fullhdCQV: '26',
        uhdCQV: '29',
        bframe: '5',
        ffmpeg_preset: 'medium',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-c:v h264_cuvid,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 22 -rc-lookahead 32 -bf 5 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☑Preset set as medium\n'
        + '☑File is 480p, using CQ:V value of 22!\n'
        + '☒File is not hevc!\n'
        + 'File is being transcoded!\n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '1080p';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        sdCQV: '22',
        hdCQV: '24',
        fullhdCQV: '26',
        uhdCQV: '29',
        bframe: '5',
        ffmpeg_preset: 'medium',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-c:v h264_cuvid,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 26 -rc-lookahead 32 -bf 5 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☑Preset set as medium\n'
        + '☑File is 1080p, using CQ:V value of 26!\n'
        + '☒File is not hevc!\n'
        + 'File is being transcoded!\n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '4KUHD';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        sdCQV: '22',
        hdCQV: '24',
        fullhdCQV: '26',
        uhdCQV: '29',
        bframe: '5',
        ffmpeg_preset: 'medium',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-c:v h264_cuvid,-map 0 -dn -c:v hevc_nvenc -b:v 0 -preset medium -cq 29 -rc-lookahead 32 -bf 5 -a53cc 0 -c:a copy -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☑Preset set as medium\n'
        + '☑File is 4KUHD, using CQ:V value of 29!\n'
        + '☒File is not hevc!\n'
        + 'File is being transcoded!\n',
    },
  },
];

void run(tests);
