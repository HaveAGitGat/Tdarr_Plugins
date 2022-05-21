/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map_metadata -1 -map 0 -c copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is already in h264! \n☑File has no subs \n☒File has title metadata \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH265_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Very Fast 1080p30"',
      container: '.mp4',
      handBrakeMode: true,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: '☒File is not in h264! \n',
    },
  },
];

run(tests);
