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
      preset: ',-map 0 -c:v copy  -c:a copy  -c:a:0 ac3  -c:s copy -c:d copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ File has surround audio which is NOT in ac3! \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: { overwriteTracks: 'false' },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c:v copy  -c:a copy  -map 0:a:0 -c:a:1 ac3  -c:s copy -c:d copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ File has surround audio which is NOT in ac3! \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
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
      infoLog: '☑ All surround audio streams are in ac3! \n☑File meets conditions! \n',
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
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: '☑ All surround audio streams are in ac3! \n☑File meets conditions! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        const ac3Surround = _.cloneDeep(file.ffProbeData.streams[1]);
        ac3Surround.index = 2;
        ac3Surround.codec_name = 'ac3';
        file.ffProbeData.streams.push(ac3Surround);
        return file;
      })(),
      librarySettings: {},
      inputs: { overwriteTracks: 'false' },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: false,
      infoLog: '☑ All surround audio streams are in ac3! \n☑File meets conditions! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        const dtsSurround = _.cloneDeep(file.ffProbeData.streams[1]);
        dtsSurround.index = 2;
        dtsSurround.codec_name = 'dts';
        file.ffProbeData.streams.push(dtsSurround);
        return file;
      })(),
      librarySettings: {},
      inputs: { overwriteTracks: 'false' },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c:v copy  -c:a copy  -map 0:a:0 -c:a:2 ac3  -map 0:a:1 -c:a:3 ac3  -c:s copy -c:d copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ File has surround audio which is NOT in ac3! \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[1].channels = 2;
        const dtsSurround = _.cloneDeep(file.ffProbeData.streams[1]);
        dtsSurround.index = 2;
        dtsSurround.codec_name = 'dts';
        dtsSurround.channels = 6;
        file.ffProbeData.streams.push(dtsSurround);
        const aacStereo = _.cloneDeep(file.ffProbeData.streams[1]);
        aacStereo.index = 3;
        file.ffProbeData.streams.push(aacStereo);
        return file;
      })(),
      librarySettings: {},
      inputs: { overwriteTracks: 'false' },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c:v copy  -c:a copy  -map 0:a:1 -c:a:3 ac3  -c:s copy -c:d copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒ File has surround audio which is NOT in ac3! \n',
    },
  },
];

void run(tests);
