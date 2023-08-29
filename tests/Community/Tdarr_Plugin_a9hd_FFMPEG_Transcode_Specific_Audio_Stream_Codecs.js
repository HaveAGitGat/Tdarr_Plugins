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
      reQueueAfter: false,
      infoLog: '☑ File does not have any streams that need to be transcoded! \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        codecs_to_transcode: 'aac',
        codec: 'eac3',
        bitrate: '640k',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -c copy  -map 0:v   -map 0:1 -c:1 eac3 -b:a 640k  -map 0:s? -map 0:d? -max_muxing_queue_size 9999',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: "☒ File has streams which aren't in desired codec! \n",
    },
  },
];

void run(tests);
