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
      infoLog: 'No input entered in plugin, skipping',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        channelCounts: '8',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'File only has 1 audio stream, skipping plugin',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        channelCounts: '8',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'No audio streams to remove!',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        channelCounts: '2',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'The number of audio streams to remove equals the total number of audio streams, skipping plugin',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        channelCounts: '8,6',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy -max_muxing_queue_size 9999 -map -0:1  -map -0:2 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: ' Removing stream 1 which has 8 channels. Removing stream 2 which has 6 channels.',
    },
  },
];

void run(tests);
