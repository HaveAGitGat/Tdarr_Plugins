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
      preset: ',-map 0:v -map 0:1 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 aac -ac 2 -max_muxing_queue_size 9999',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'The required channel count 2 is lower than the highest available channel count (6). Adding! \n',
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        audioCodec: 'eac3',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v -map 0:1 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 eac3 -ac 2 -max_muxing_queue_size 9999',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'The required channel count 2 is lower than the highest available channel count (6). Adding! \n',
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        audioCodec: 'eac3',
        channels: 6,
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v -map 0:1 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 eac3 -ac 6 -max_muxing_queue_size 9999',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'The required channel count 6 is lower than the highest available channel count (6). Adding! \n',
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        audioCodec: 'eac3',
        channels: 8,
        language: 'fr',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v -map 0:1 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 eac3 -ac 6 -max_muxing_queue_size 9999',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'The required channel count (8) is higher than the highest channel available in specified lang tag (6). Adding lower channel track. \n',
      handbrakeMode: false,
      ffmpegMode: true,
    },
  },
];

void run(tests);
