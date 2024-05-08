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
      preset: ',-map 0:v -map 0:1 -map 0:s? -map 0:d? -c copy -c:a:0 aac -ac 2',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'No en streams. The required channel count 2 is lower than the highest available channel count (6).Adding it and removing others! \n',
      handbrakeMode: false,
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
      preset: ',-map 0:v -map 0:1 -map 0:s? -map 0:d? -c copy -c:a:0 eac3 -ac 2',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'No en streams. The required channel count 2 is lower than the highest available channel count (6).Adding it and removing others! \n',
      handbrakeMode: false,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        audioCodec: 'eac3',
        language: 'fr',
        channels: '6',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v -map 0:1 -map 0:s? -map 0:d? -c copy -c:a:0 eac3 -ac 6',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'No fr streams. The required channel count 6 is lower than the highest available channel count (6).Adding it and removing others! \n',
      handbrakeMode: false,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        audioCodec: 'aac',
        language: 'und',
        channels: '8',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'The best und stream already exists. It is the only audio stream. \n',
      handbrakeMode: false,
    },
  },
];

void run(tests);
