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
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: "File does not have any audio streams which aren't in aac \n",
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy  -c:a:0 aac -c:a:1 aac -c:a:2 aac',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: "File has audio streams which aren't in aac \n",
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
      librarySettings: {},
      inputs: {
        audioCodec: 'eac3',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy  -c:a:0 eac3 -c:a:1 eac3 -c:a:3 eac3 -c:a:4 eac3',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: "File has audio streams which aren't in eac3 \n",
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
];

void run(tests);
