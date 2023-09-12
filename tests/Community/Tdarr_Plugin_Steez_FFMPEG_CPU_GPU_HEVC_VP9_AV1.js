/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  // Base tests
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-fflags +genpts <io> -map 0 -c:v libx265 -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      processFile: true,
      preset: '-fflags +genpts <io> -map 0 -c:v libx265 -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -pix_fmt p010le  ',
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
  // Advanced tests
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        encoder_speedpreset: 'veryslow',
        codec: 'av1',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-fflags +genpts <io> -map 0 -c:v libsvtav1 -b:v 402k -minrate 302k -maxrate 503k -bufsize 1206k -preset 0  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Input file is not MKV so cannot use mkvpropedit to get new file stats. Continuing but file stats will likely be inaccurate...\n'
        + '☑ It looks like the current video bitrate is 1206kbps. \n'
        + 'Container for output selected as mkv. \n'
        + 'Encode variable bitrate settings: \n'
        + 'Target = 402k \n'
        + 'Minimum = 302k \n'
        + 'Maximum = 503k \n'
        + 'File Transcoding... \n',
      container: '.mkv',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        encoder_speedpreset: 'veryslow',
        codec: 'hevc',
        hardware_encoder: 'nvenc',
      },
      otherArguments: {},
    },
    output: {
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel nvdec -hwaccel_output_format nvdec -init_hw_device nvdec:hw_any<io> -map 0 -c:v hevc_nvenc -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel nvdec -hwaccel_output_format nvdec -init_hw_device nvdec:hw_any<io> -map 0 -c:v hevc_nvenc -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
        preset: '-fflags +genpts -hwaccel nvdec -hwaccel_output_format nvdec -init_hw_device nvdec:hw_any<io> -map 0 -c:v hevc_nvenc -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      }
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        encoder_speedpreset: 'veryslow',
        codec: 'hevc',
        hardware_encoder: 'qsv',
      },
      otherArguments: {},
    },
    output: {
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv -init_hw_device qsv:hw_any,child_device_type=d3d11va -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      }
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        encoder_speedpreset: 'veryslow',
        codec: 'hevc',
        hardware_encoder: 'vcn',
      },
      otherArguments: {},
    },
    output: {
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi<io> -map 0 -c:v hevc_vaapi -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
        preset: '-fflags +genpts -hwaccel d3d11va -hwaccel_output_format d3d11va -init_hw_device d3d11va=hw_any<io> -map 0 -c:v hevc_amf -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset veryslow  -c:a copy -c:s copy -max_muxing_queue_size 9999  ',
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
      }
    },
  },
];

void run(tests);
