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
      preset: ', -c copy -map 0:v ',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☒File is not mkv \n',
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
      processFile: false,
      preset: ', -c copy -map 0:v  -map 0:a:0? -c:a:0 copy  -map 0:a:1? -c:a:1 copy  -map 0:a:2? -c:a:2 copy  -map 0:a:3? -c:a:3 copy  -map 0:a:4? -c:a:4 copy ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: "☑File doesn't contain audio tracks with the specified codec.\n",
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        input_codecs: 'aac',
        output_codec: 'eac3',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -c copy -map 0:v  -map 0:a:0? -c:a:0 copy  -map 0:a:1? -c:a:1 copy  -map 0:a:2? -c:a:2 copy  -map 0:a:3? -c:a:3 copy  -map 0:a:3? -c:a:4 eac3 -b:a:4 128k -metadata:s:a:4 title="" -metadata:s:a:4 copyright="henk_asac" -disposition:a:4 0 -map 0:a:4? -c:a:5 copy  -map 0:a:4? -c:a:6 eac3 -b:a:6 128k -metadata:s:a:6 title="" -metadata:s:a:6 copyright="henk_asac" -disposition:a:6 0 -map 0:s? ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        input_codecs: 'aac',
        output_codec: 'eac3',
        bitrate: '256',
        auto_adjust: 'false',
        position_new_audio: 'before',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -c copy -map 0:v  -map 0:a:0? -c:a:0 copy  -map 0:a:1? -c:a:1 copy  -map 0:a:2? -c:a:2 copy  -map 0:a:3? -c:a:3 eac3 -b:a:3 256k -metadata:s:a:3 title="" -metadata:s:a:3 copyright="henk_asac" -disposition:a:3 0 -map 0:a:3? -c:a:4 copy  -map 0:a:4? -c:a:5 eac3 -b:a:5 256k -metadata:s:a:5 title="" -metadata:s:a:5 copyright="henk_asac" -disposition:a:5 0 -map 0:a:4? -c:a:6 copy  -map 0:s? ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '',
    },
  },
];

void run(tests);
