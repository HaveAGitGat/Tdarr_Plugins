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
      preset: ', -map_metadata -1 -map 0:v  -map 0:a -c:v copy -c:a copy -c:s mov_text',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ File is already in h264!\n☒ File has title metadata\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map_metadata -1 -map 0:V  -map 0:a -c:v libx264 -preset medium -c:a aac -strict -2 -c:s mov_text',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ File is not in h264!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        FFmpeg_preset: 'fast',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map_metadata -1 -map 0:V  -map 0:a -c:v libx264 -preset fast -c:a aac -strict -2 -c:s mov_text',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ File is not in h264!\n',
    },
  },
];

void run(tests);
