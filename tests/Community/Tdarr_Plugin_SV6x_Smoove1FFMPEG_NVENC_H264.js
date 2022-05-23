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
      infoLog: 'File is already H264 but file is not in mkv. Remuxing \n',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      container: '.mkv',
      preset: ', -map 0 -c copy ',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.container = 'mkv';
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File is already H264 and in mkv \n',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
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
      infoLog: 'Target bitrate could not be calculated. Skipping this plugin. \n',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      container: '.mkv',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[0].codec_name = 'hevc';
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'Container for output selected as mkv. \n'
        + 'Current bitrate = 1526 \n'
        + 'Bitrate settings: \n'
        + 'Target = 1526 \n'
        + 'Minimum = 1068 \n'
        + 'Maximum = 1983 \n'
        + 'File is not h264. Transcoding. \n',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      container: '.mkv',
      preset: 'undefined,-map 0 -c:v h264_nvenc -preset fast -crf 23 -tune film -b:v 1526k -minrate 1068k -maxrate 1983k -bufsize 1526k -c:a copy -c:s copy -max_muxing_queue_size 9999 -pix_fmt yuv420p ',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File is already H264 and in mp4 \n',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      container: '.mp4',
    },
  },
];

run(tests);
