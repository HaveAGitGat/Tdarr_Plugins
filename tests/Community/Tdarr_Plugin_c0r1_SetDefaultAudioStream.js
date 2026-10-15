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
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));

        // matching stream is default but a non-matching stream is also still default
        file.ffProbeData.streams[1].channels = 6;
        file.ffProbeData.streams[1].disposition.default = 1;
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
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));

        // matching stream is the only default audio stream
        file.ffProbeData.streams[1].channels = 6;
        file.ffProbeData.streams[1].disposition.default = 1;
        file.ffProbeData.streams[4].disposition.default = 0;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        channels: '6',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '☑ Default 6 channel audio stream already exists. \n ',
    },
  },
];

void run(tests);
