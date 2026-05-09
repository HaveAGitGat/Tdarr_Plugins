/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
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
      infoLog: '☒ No subtitle tracks in desired language! \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
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
      infoLog: '☑ Preferred language is already first subtitle track! \n',
    },

  }, {
    input: {
      file: require('../sampleData/media/sampleH264_3.json'),
      librarySettings: {},
      inputs: {
        preferred_language: 'fre',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -c copy  -map 0:v -map 0:a  -map 0:s:1 -disposition:s:0 default -map 0:s:0  -disposition:s:1 0  -map 0:d? -map 0:t? ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ Desired subtitle lang is not first subtitle stream, moving! \n',
    },
  },
];

void run(tests);
