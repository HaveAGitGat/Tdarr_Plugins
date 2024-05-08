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
      preset: ',-map_metadata -1 -map 0 -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is h264 720p! \n'
        + '☑File has no title and has no subs \n'
        + '☒File has title metadata \n',
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
      preset: '-Z "H.264 MKV 720p30"',
      container: '.mkv',
      handBrakeMode: true,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: '☒File is not h264 720p! \n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[0].width = 1280;
        file.ffProbeData.streams[0].height = 720;
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map_metadata -1 -map 0 -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File is h264 720p! \n'
        + '☑File has no title and has no subs \n'
        + '☒File has title metadata \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[0].width = 1280;
        file.ffProbeData.streams[0].height = 720;

        file.meta.Title = undefined;
        file.container = 'mkv';
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
      infoLog: '☑File is h264 720p! \n'
        + '☑File has no title and has no subs \n'
        + '☑File has no title metadata \n'
        + '☑File has no subs \n'
        + '☑File is in mkv container! \n'
        + '☑File meets conditions! \n',
    },
  },
];

void run(tests);
