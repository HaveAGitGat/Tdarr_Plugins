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
      infoLog: "☑File doesn't contain subtitle or audio codecs which were unwanted or that require tagging.\n",
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        tag_subtitle_codecs: 'subrip',
        tag_audio_codecs: 'aac',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:3 -map -0:a:4 -map -0:s:0  -c copy -max_muxing_queue_size 4096',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒audio stream detected as unwanted. removing audio stream 0:a:3 - Français E-AC3 2.0 -  aac \n'
        + '☒audio stream detected as unwanted. removing audio stream 0:a:4 - Anglais E-AC3 2.0 -  aac \n'
        + '☒Subtitle stream detected as unwanted. removing subtitle stream 0:s:0 - Français - subrip. \n',
    },
  },
];

void run(tests);
