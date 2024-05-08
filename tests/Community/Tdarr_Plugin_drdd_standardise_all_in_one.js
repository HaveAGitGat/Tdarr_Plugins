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
      container: '.mkv',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Will convert multi channel audio to AC3\n'
        + '☒ Transcoding to HEVC (software)\n'
        + 'Encoder configuration:\n'
        + '• Original Bitrate: 1517\n'
        + '• Target Bitrate: 1517\n'
        + '• Minimum Bitrate: 1061\n'
        + '• Maximum Bitrate: 1972\n',
      processFile: true,
      preset: ',-map 0 -map -0:d -c:v libx265 -b:v 1517k -minrate 1061k -maxrate 1972k -bufsize 1517k -c:a copy -c:a:0 ac3 -c:s copy -max_muxing_queue_size 4096',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        nvenc: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.mkv',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Will convert multi channel audio to AC3\n'
        + '☒ Transcoding to HEVC using NVidia NVENC\n'
        + 'Encoder configuration:\n'
        + '• Original Bitrate: 1517\n'
        + '• Target Bitrate: 1517\n'
        + '• Minimum Bitrate: 1061\n'
        + '• Maximum Bitrate: 1972\n',
      processFile: true,
      preset: '-c:v h264_cuvid,-map 0 -map -0:d -c:v hevc_nvenc -cq:v 19 -b:v 1517k -minrate 1061k -maxrate 1972k -bufsize 1517k -spatial_aq:v 1 -rc-lookahead:v 32 -c:a copy -c:a:0 ac3 -c:s copy -max_muxing_queue_size 4096',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        nvenc: 'false',
        qsv: 'true',
        wanted_subtitle_languages: 'eng,fre',
      },
      otherArguments: {},
    },
    output: {
      container: '.mkv',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Will convert multi channel audio to AC3\n'
        + '☒ Transcoding to HEVC using VAAPI\n'
        + 'Encoder configuration:\n'
        + '• Original Bitrate: 1517\n'
        + '• Target Bitrate: 1517\n'
        + '• Minimum Bitrate: 1061\n'
        + '• Maximum Bitrate: 1972\n'
        + '\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: '-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi,-map 0 -map -0:d -c:v hevc_vaapi -b:v 1517k -minrate 1061k -maxrate 1972k -bufsize 1517k -c:a copy -c:a:0 ac3 -c:s copy -max_muxing_queue_size 4096',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        wanted_subtitle_languages: 'eng,fre',
      },
      otherArguments: {},
    },
    output: {
      container: '.mkv',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☑ No multi channel audio found\n'
        + '☑ No audio processing necessary\n'
        + '☑ File is in HEVC codec and in MKV\n'
        + '☑ No video processing necessary\n'
        + '☑ No subtitle processing necessary\n'
        + '☑ No need to process file',
      processFile: false,
      preset: ',-map 0 -map -0:d -c:v copy -c:a copy -c:s copy -max_muxing_queue_size 4096',
      reQueueAfter: false,
    },
  },
];

void run(tests);
