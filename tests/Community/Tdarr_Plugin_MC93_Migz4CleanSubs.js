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
      infoLog: "☑File doesn't contain subtitle tracks which are unwanted or that require tagging.\n",
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
      preset: ', -map 0 -map -0:s:0  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 has unwanted language tag fre, removing. \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));

        file.ffProbeData.streams[7] = _.cloneDeep(file.ffProbeData.streams[6]);
        file.ffProbeData.streams[6].tags.title = 'description';
        file.ffProbeData.streams[7].tags.language = 'und';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        language: 'eng,und',
        commentary: 'true',
        tag_language: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:s:0 -map -0:s:0 -metadata:s:s:1 language=eng  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Subtitle stream 0:s:0 has unwanted language tag fre, removing. \n'
        + '☒Subtitle stream 0:s:0 detected as being descriptive, removing. \n'
        + '☒Subtitle stream 0:s:1 has no language, tagging as eng. \n',
    },
  },
];

void run(tests);
