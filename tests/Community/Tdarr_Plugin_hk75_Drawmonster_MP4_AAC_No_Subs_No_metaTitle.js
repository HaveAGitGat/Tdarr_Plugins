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
      preset: ',-map_metadata -1 -c:v copy -c:a copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒File has title metadata \n',
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
      processFile: true,
      preset: ', -c:v copy -c:a copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File has no title metadata \n'
        + '☑File has no subs \n'
        + '☒File is not in mp4 container! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.container = 'mp4';
        return file;
      })(),
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
      reQueueAfter: false,
      infoLog: '☑File has no title metadata \n'
        + '☑File has no subs \n'
        + '☑File is in mp4 container! \n'
        + '☑File meets conditions! \n',
    },
  },
];

void run(tests);
