const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        audio_lang: 'und',
        sub_lang: 'eng,und',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      handBrakeMode: true,
      FFmpegMode: false,
      preset: '',
      reQueueAfter: false,
      infoLog: '☒No subtitles eligible for burn-in found. Skipping this plugin. \n',
      container: '.mp4',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
      librarySettings: {},
      inputs: {
        handbrake_preset: 'H.264 MKV 1080p30',
        extra_args: '-m',
        output_container: '.mkv',
        audio_lang: 'jpn',
        sub_lang: 'eng,und',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      handBrakeMode: true,
      FFmpegMode: false,
      preset: '',
      reQueueAfter: false,
      infoLog: '☒More than 1 audio language found. Skipping this plugin. \n',
      container: '.mkv',
    },
  },
];

run(tests);
