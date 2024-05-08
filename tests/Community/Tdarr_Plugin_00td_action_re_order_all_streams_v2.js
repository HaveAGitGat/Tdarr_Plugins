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
      infoLog: 'File is mp4 and already has the video stream in the correct order! Due to FFmpeg issues when reordering streams in mp4 files, other stream ordering will be skipped',
    },
  },
  {
    // orig
    // 0 vid h264
    // 1 flac eng
    // 2 ac3 eng
    // 3 eac3 eng
    // 4 aac fre
    // 5 aac eng
    // 6 sub fre

    // expect
    // 4 aac fre
    // 2 ac3 eng
    // 1 flac eng
    // 3 eac3 eng
    // 5 aac eng
    // 6 sub fre
    // 0 vid h264

    // console.log(streams.map(stream => {
    //   return {
    //     "index": stream.index,
    //     codec_name: stream.codec_name,
    //     codec_type: stream.codec_type,
    //     language: stream.tags.language,
    //   }
    // }))

    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        processOrder: 'codecs,channels,languages,streamTypes',
        languages: 'fre,eng',
        streamTypes: 'audio,subtitle,video',
        codecs: 'ac3,flac,eac3,aac',
        channels: '7.1,5.1,2,1',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io> -c copy -map 0:4 -map 0:2 -map 0:1 -map 0:3 -map 0:5 -map 0:6 -map 0:0',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: 'Streams are not in the correct order!',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        const s4 = file.ffProbeData.streams[4];

        // eslint-disable-next-line prefer-destructuring
        file.ffProbeData.streams[4] = file.ffProbeData.streams[5];
        file.ffProbeData.streams[5] = s4;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        processOrder: 'codecs,channels,languages,streamTypes',
        languages: 'eng,fre',
        streamTypes: 'video,audio,subtitle',
        codecs: 'flac,ac3,eac3,aac',
        channels: '7.1,5.1,2,1',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: 'Streams are in the correct order!',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.container = 'mp4';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        processOrder: 'codecs,channels,languages,streamTypes',
        languages: 'fre,eng',
        streamTypes: 'video,audio,subtitle',
        codecs: 'ac3,flac,eac3,aac',
        channels: '7.1,5.1,2,1',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: 'File is mp4 and already has the video stream in the correct order! Due to FFmpeg issues when reordering streams in mp4 files, other stream ordering will be skipped',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        const s0 = file.ffProbeData.streams[0];
        // eslint-disable-next-line prefer-destructuring
        file.ffProbeData.streams[0] = file.ffProbeData.streams[1];
        file.ffProbeData.streams[1] = s0;
        file.container = 'mp4';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        processOrder: 'codecs,channels,languages,streamTypes',
        languages: 'fre,eng',
        streamTypes: 'video,audio,subtitle',
        codecs: 'ac3,flac,eac3,aac',
        channels: '7.1,5.1,2,1',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0:v? -map 0:a? -map 0:s? -map 0:d? -map 0:t? -c copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: 'File is mp4 and contains video but video is not first stream, remuxing',
    },
  },
];

void run(tests);
