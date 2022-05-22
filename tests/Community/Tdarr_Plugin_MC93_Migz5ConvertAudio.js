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
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Plugin has not been configured, please configure required options. Skipping this plugin. \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        aac_stereo: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File contains all required audio formats. \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        aac_stereo: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 2 channel but is not AAC. Converting. \n'
        + '☒Audio track is 2 channel but is not AAC. Converting. \n'
        + '☒Audio track is 2 channel but is not AAC. Converting. \n',
      preset: ', -map 0 -c:v copy -c:a copy -c:a:0 aac -c:a:1 aac -c:a:2 aac  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel from 8 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="5.1"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

];

run(tests);
