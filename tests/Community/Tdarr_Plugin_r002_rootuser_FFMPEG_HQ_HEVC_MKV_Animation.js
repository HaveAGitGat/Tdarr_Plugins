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
      preset: ',-map 0 -c:s copy -movflags use_metadata_tags -c:a aac -b:a 512k -c:v:0 libx265 -preset medium -x265-params crf=18:tune=animation:qcomp=0.7:aq-strength=1.1 -pix_fmt yuv420p10le -f matroska',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n'
        + '☒File is 720p but is not hevc!\n'
        + '☒File will be transcoded!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is a video! \n☑File is already in hevc! \n',
    },
  },
];

void run(tests);
