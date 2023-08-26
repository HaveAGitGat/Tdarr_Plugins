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
      preset: '<io> -map 0 -dn -c:v libx265 -preset slow -x265-params crf=22:bframes=8:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3  -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is not hevc!\n'
        + '☑Preset set as slow\n'
        + '☑File is 720p, using CRF value of 22!\n'
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
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n☑File is already in hevc! \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        sdCRF: '21',
        hdCRF: '23',
        fullhdCRF: '24',
        uhdCRF: '29',
        bframe: '10',
        ffmpegPreset: 'medium',
        sdDisabled: 'false',
        uhdDisabled: 'false',
        force10bit: 'force10bit',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -map 0 -dn -c:v libx265 -preset medium -x265-params crf=23:bframes=10:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3  -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is not hevc!\n'
        + '☑Preset set as medium\n'
        + '☑File is 720p, using CRF value of 23!\n'
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
        sdCRF: '21',
        hdCRF: '23',
        fullhdCRF: '24',
        uhdCRF: '29',
        bframe: '10',
        ffmpegPreset: 'medium',
        sdDisabled: 'false',
        uhdDisabled: 'false',
        force10bit: 'force10bit',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -map 0 -dn -c:v libx265 -preset medium -x265-params crf=21:bframes=10:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3  -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is not hevc!\n'
        + '☑Preset set as medium\n'
        + '☑File is 480p, using CRF value of 21!\n'
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
        sdCRF: '21',
        hdCRF: '23',
        fullhdCRF: '24',
        uhdCRF: '29',
        bframe: '10',
        ffmpegPreset: 'medium',
        sdDisabled: 'true',
        uhdDisabled: 'false',
        force10bit: 'force10bit',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n☒File is SD and disabled, not processing\n',
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
        sdCRF: '21',
        hdCRF: '23',
        fullhdCRF: '24',
        uhdCRF: '29',
        bframe: '10',
        ffmpegPreset: 'medium',
        sdDisabled: 'false',
        uhdDisabled: 'false',
        force10bit: 'force10bit',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -map 0 -dn -c:v libx265 -preset medium -x265-params crf=29:bframes=10:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3  -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is not hevc!\n'
        + '☑Preset set as medium\n'
        + '☑File is 4KUHD, using CRF value of 29!\n'
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
        sdCRF: '21',
        hdCRF: '23',
        fullhdCRF: '24',
        uhdCRF: '29',
        bframe: '10',
        ffmpegPreset: 'medium',
        sdDisabled: 'false',
        uhdDisabled: 'true',
        force10bit: 'force10bit',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n☒File is 4k/UHD and disabled, not processing\n',
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
        sdCRF: '21',
        hdCRF: '23',
        fullhdCRF: '24',
        uhdCRF: '29',
        bframe: '10',
        ffmpegPreset: 'medium',
        sdDisabled: 'false',
        uhdDisabled: 'false',
        force10bit: 'force10bit',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -map 0 -dn -c:v libx265 -preset medium -x265-params crf=24:bframes=10:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3  -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is not hevc!\n'
        + '☑Preset set as medium\n'
        + '☑File is 1080p, using CRF value of 24!\n'
        + 'File is being transcoded!\n',
    },
  },
];

void run(tests);
