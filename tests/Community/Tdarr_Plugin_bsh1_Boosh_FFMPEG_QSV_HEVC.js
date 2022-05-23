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
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 759k -minrate 569k -maxrate 949k -bufsize 1517k -preset slow  \n'
          + '     -c:a copy -c:s copy -max_muxing_queue_size 9999 ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current bitrate is 1517k. \n'
          + '\n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 759k \n'
          + 'Minimum = 569k \n'
          + 'Maximum = 949k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 759k -minrate 569k -maxrate 949k -bufsize 1517k -preset slow  \n'
          + '     -c:a copy -c:s copy -max_muxing_queue_size 9999 ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current bitrate is 1517k. \n'
          + '\n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 759k \n'
          + 'Minimum = 569k \n'
          + 'Maximum = 949k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        encoder_speedpreset: 'fast',
        enable_10bit: 'true',
      },
      otherArguments: {},
    },
    output: {
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv<io> -map 0 -c:v hevc_qsv -b:v 759k -minrate 569k -maxrate 949k -bufsize 1517k -preset fast  \n'
          + '     -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -pix_fmt p010le ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current bitrate is 1517k. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + '\n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 759k \n'
          + 'Minimum = 569k \n'
          + 'Maximum = 949k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 759k -minrate 569k -maxrate 949k -bufsize 1517k -preset fast  \n'
          + '     -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -pix_fmt p010le ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current bitrate is 1517k. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + '\n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 759k \n'
          + 'Minimum = 569k \n'
          + 'Maximum = 949k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        encoder_speedpreset: 'fast',
        enable_10bit: 'true',
        bitrate_cutoff: '2000',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ It looks like the current bitrate is 1517k. \n'
        + '☑ Current bitrate is below set cutoff of 2000k. Cancelling plugin. \n',
      container: '.mp4',
    },
  },
];

run(tests);
