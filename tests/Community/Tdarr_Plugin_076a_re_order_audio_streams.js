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
      infoLog: '☑ Preferred language is already first audio track! \n',
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
      processFile: true,
      preset: ', -c copy -map 0:v  -map 0:a:3 -disposition:a:0 default -map 0:a:0  -map 0:a:1  -disposition:a:1 0  -map 0:a:2  -disposition:a:2 0  -disposition:a:3 0  -map 0:a:4  -disposition:a:4 0  -map 0:s? -map 0:d? ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ Desired audio lang is not first audio stream, moving! \n',
    },
  },
];

run(tests);
