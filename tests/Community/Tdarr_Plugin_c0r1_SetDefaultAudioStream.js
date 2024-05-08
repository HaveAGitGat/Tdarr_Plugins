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
      infoLog: '☑ No 2 channel audio stream exists. \n ',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));

        file.ffProbeData.streams[1].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        channels: '6',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c copy -disposition:1 default -disposition:2 0 -disposition:3 0 -disposition:4 0 -disposition:5 0 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '☒ Matching audio stream is not set to default. \n'
        + '☒ Setting 6 channel matching audio stream to default. Remove default from all other audio streams \n',
      reQueueAfter: true,
    },
  },
];

void run(tests);
