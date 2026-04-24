/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: '☑ Preferred language is already first audio track! \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        preferred_language: 'fre',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -c copy -map 0:v?  -map 0:a:3 -disposition:a:0 default -map 0:a:0  -map 0:a:1  -disposition:a:1 0  -map 0:a:2  -disposition:a:2 0  -disposition:a:3 0  -map 0:a:4  -disposition:a:4 0  -map 0:s? -map 0:d? -map 0:t? ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ Desired audio lang is not first audio stream, moving! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[0].codec_type = 'audio';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        preferred_language: 'fre',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: '☑ Preferred language is already first audio track! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[0].codec_type = 'audio';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        preferred_language: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -c copy -map 0:v?  -map 0:a:1 -disposition:a:0 default -map 0:a:0  -disposition:a:1 0  -map 0:a:2  -disposition:a:2 0  -map 0:a:3  -disposition:a:3 0  -map 0:a:4  -disposition:a:4 0  -map 0:a:5  -disposition:a:5 0  -map 0:s? -map 0:d? -map 0:t? ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ Desired audio lang is not first audio stream, moving! \n',
    },
  },
];

void run(tests);
