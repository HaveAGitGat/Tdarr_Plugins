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
      preset: '  <io> -map 0 -c copy -c:v libx265  -cq:v 19 -b:v 795571.5361445782 -minrate 556900.0753012047 -maxrate 1034242.9969879518 -bufsize 1591143.0722891565 -spatial_aq:v 1 -rc-lookahead:v 32 -max_muxing_queue_size 9999 ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Container for output selected as mkv. \n'
        + 'Current bitrate = 1591143.0722891565 \n'
        + 'Bitrate settings: \n'
        + 'Target = 795571.5361445782 \n'
        + 'Minimum = 556900.0753012047 \n'
        + 'Maximum = 1034242.9969879518 \n'
        + 'File is not in hevc. Transcoding. \n',
      container: '.mkv',
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
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is already hevc and in mkv. \n',
      container: '.mkv',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        target_codec: 'hevc',
        target_bitrate_multiplier: 0.75,
        try_use_gpu: true,
        container: 'mkv',
        bitrate_cutoff: 0,

        enable_10bit: false,
        bframes_enabled: false,
        bframes_value: 5,
        force_conform: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '  <io> -map 0 -c copy -c:v libx265  -cq:v 19 -b:v 1193357.3042168673 -minrate 835350.1129518071 -maxrate 1551364.4954819276 -bufsize 1591143.0722891565 -spatial_aq:v 1 -rc-lookahead:v 32 -max_muxing_queue_size 9999 ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Container for output selected as mkv. \n'
        + 'Current bitrate = 1591143.0722891565 \n'
        + 'Bitrate settings: \n'
        + 'Target = 1193357.3042168673 \n'
        + 'Minimum = 835350.1129518071 \n'
        + 'Maximum = 1551364.4954819276 \n'
        + 'File is not in hevc. Transcoding. \n',
      container: '.mkv',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        target_codec: 'h264',
        target_bitrate_multiplier: 0.75,
        try_use_gpu: true,
        container: 'mkv',
        bitrate_cutoff: 0,
        enable_10bit: false,
        bframes_enabled: false,
        bframes_value: 5,
        force_conform: false,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -map 0 -c copy ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is in h264 but is not in mkv container. Remuxing. \n',
      container: '.mkv',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        target_codec: 'hevc',
        target_bitrate_multiplier: 0.75,
        try_use_gpu: true,
        container: 'mkv',
        bitrate_cutoff: 10000000,

        enable_10bit: false,
        bframes_enabled: false,
        bframes_value: 5,
        force_conform: false,

      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Current bitrate is below set cutoff of 10000000. Cancelling plugin. \n',
      container: '.mkv',
    },
  },
];

void run(tests);
