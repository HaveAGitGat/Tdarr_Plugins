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
      processFile: false,
      preset: '<io> -c:a flac -f flac',
      container: '.flac',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒File contains video!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleMP3_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '<io> -c:a flac -f flac',
      container: '.flac',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑No matching codecs found!\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleMP3_1.json')),
      librarySettings: {},
      inputs: {
        codecs: 'mp3',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -c:a flac -f flac',
      container: '.flac',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Found mp3 codec!\n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        // mock audio file with multiple streams
        file.ffProbeData.streams[0].codec_type = 'audio';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecs: 'ac3,eac3,aac',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -c:a flac -f flac',
      container: '.flac',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Found ac3 codec!\n',
    },
  },
];

void run(tests);
