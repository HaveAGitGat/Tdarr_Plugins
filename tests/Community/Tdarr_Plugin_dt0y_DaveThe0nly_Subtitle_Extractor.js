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
      infoLog: 'Total subtitles found: 0\n',
      reQueueAfter: false,
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
      preset: '-y <io>  -map 0 -c copy -sn',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: 'Total subtitles found: 1\nfre is not wanted\n',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        extractSubtitles: 'fre',
        subtitleFormat: 'srt,ass,rand',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-y <io> -map 0:6 "C:/Transcode/Source Folder/h264.fre.srt" -map 0:6 "C:/Transcode/Source Folder/h264.fre.ass" -map 0:6 "C:/Transcode/Source Folder/h264.fre.rand" -map 0 -c copy -sn',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: 'Total subtitles found: 1\nExtracting sub: fre\n',
      reQueueAfter: false,
    },
  },
];

run(tests);
