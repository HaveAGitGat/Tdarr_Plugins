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
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '      -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
          + '☑ It looks like the current video bitrate is 1206kbps. \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 603k \n'
          + 'Minimum = 452k \n'
          + 'Maximum = 754k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '      -init_hw_device qsv:hw_any,child_device_type=d3d11va -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
          + '☑ It looks like the current video bitrate is 1206kbps. \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 603k \n'
          + 'Minimum = 452k \n'
          + 'Maximum = 754k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow -c:a copy -c:s copy -max_muxing_queue_size 9999 ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
          + '☑ It looks like the current video bitrate is 1206kbps. \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 603k \n'
          + 'Minimum = 452k \n'
          + 'Maximum = 754k \n'
          + '==ALERT== OS detected as MAC - This will use VIDEOTOOLBOX to encode which is NOT QSV\n'
          + 'cmds set in extra_qsv_options will be IGNORED!\n'
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
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '      -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -vf scale_qsv=format=p010le  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
          + '☑ It looks like the current video bitrate is 1206kbps. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 603k \n'
          + 'Minimum = 452k \n'
          + 'Maximum = 754k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '      -init_hw_device qsv:hw_any,child_device_type=d3d11va -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -vf scale_qsv=format=p010le  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
          + '☑ It looks like the current video bitrate is 1206kbps. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 603k \n'
          + 'Minimum = 452k \n'
          + 'Maximum = 754k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -vf scale_qsv=format=p010le ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
          + '☑ It looks like the current video bitrate is 1206kbps. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 603k \n'
          + 'Minimum = 452k \n'
          + 'Maximum = 754k \n'
          + '==ALERT== OS detected as MAC - This will use VIDEOTOOLBOX to encode which is NOT QSV\n'
          + 'cmds set in extra_qsv_options will be IGNORED!\n'
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
      infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
        + '☑ It looks like the current video bitrate is 1206kbps. \n'
        + '☑ Current bitrate is below set cutoff of 2000kbps. \n'
        + 'Cancelling plugin. \n',
      container: '.mp4',
    },
  },
];

void run(tests);
