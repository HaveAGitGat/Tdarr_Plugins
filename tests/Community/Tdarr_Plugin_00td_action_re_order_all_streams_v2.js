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
      FFmpegMode: true,
      infoLog: 'Streams are in the correct order!',
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
      file: require('../sampleData/media/sampleH264_2.json'),
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
];

run(tests);
