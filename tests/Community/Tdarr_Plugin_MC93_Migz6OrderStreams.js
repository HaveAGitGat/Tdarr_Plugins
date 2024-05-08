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
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '☑ Streams are in expected order. \n ',
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
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '☑ Streams are in expected order. \n ',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:0 -map 0:3 -map 0:4 -map 0:5 -map 0:2 -map 0:1 -map 0:6  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '☒ Audio 6ch not second. \n'
        + '☒ Audio 2ch not first. \n'
        + '☒ Audio 2ch not first. \n'
        + '☒ Audio 2ch not first. \n'
        + '☒ Streams are out of order, reorganizing streams. Video, Audio, Subtitles. \n',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 6;
        const video = file.ffProbeData.streams.splice(0, 1)[0];
        file.ffProbeData.streams.push(video);
        const subs = file.ffProbeData.streams.splice(5, 1)[0];
        file.ffProbeData.streams.unshift(subs);
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:6 -map 0:3 -map 0:4 -map 0:5 -map 0:2 -map 0:1 -map 0:0  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '☒ Audio not second. \n'
        + '☒ Audio not second. \n'
        + '☒ Audio 6ch not second. \n'
        + '☒ Audio not second. \n'
        + '☒ Audio 2ch not first. \n'
        + '☒ Audio not second. \n'
        + '☒ Audio 2ch not first. \n'
        + '☒ Audio not second. \n'
        + '☒ Audio 2ch not first. \n'
        + '☒ Video not first. \n'
        + '☒ Streams are out of order, reorganizing streams. Video, Audio, Subtitles. \n',
      reQueueAfter: true,
    },
  },

];

void run(tests);
