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
      preset: ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ,-map 0:v -map 0:a -map 0:s? -map 0:d? -map 0:t? -c copy  -c:v:0 hevc_vaapi -b:v 758k -minrate 530k -maxrate 985k -bufsize 1M -max_muxing_queue_size 1024  ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☒ Video stream 0 is not HEVC, transcode required.\n'
        + ' ☑ Stream analysis complete, processing required.\n'
        + ' ',
      container: 'mp4',
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
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☑ Stream analysis complete, no processing required.\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        minBitrate: '4000',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ,-map 0:v -map 0:a -map 0:s? -map 0:d? -map 0:t? -c copy  ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: "☒ Input file's bitrate 1517 is lower than the minimum bitrate threshold of 4000. Skipping this plugin.\n"
        + '☑ Stream analysis complete, processing required.\n'
        + ' ',
      container: 'mp4',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        remuxOnly: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☒ RemuxOnly is enabled and file is not a remux. Unable to process.\n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.file = `remux ${file.file}`;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        remuxOnly: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ,-map 0:v -map 0:a -map 0:s? -map 0:d? -map 0:t? -c copy  -c:v:0 hevc_vaapi -b:v 3933k -minrate 2753k -maxrate 5112k -bufsize 1M -max_muxing_queue_size 1024  ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☒ Video stream 0 is not HEVC, transcode required.\n'
        + ' ☑ Stream analysis complete, processing required.\n'
        + ' ',
      container: 'mkv',
    },
  },
];

void run(tests);
