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
      infoLog: '☑ File is already in h264, no need to transcode! \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH265_1.json'),
      librarySettings: {},
      inputs: {
        handbrake_preset: 'Very Fast 1080p30',
        output_container: '.mp4',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Very Fast 1080p30" -e nvenc_h264 --all-audio --all-subtitles',
      container: '.mp4',
      handBrakeMode: true,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: '☒ File is not in h264, transcoding! \n',
    },
  },
];

void run(tests);
