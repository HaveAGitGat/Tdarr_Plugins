/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  // Test 0
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
          + '        -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 1206kbps. \n'
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
          + '        -init_hw_device qsv=qsv:MFX_IMPL_hw -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 1206kbps. \n'
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
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset slow -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 1206kbps. \n'
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
  // Test 1
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
          + '        -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f mp4 -profile:v main10 -vf scale_qsv=format=p010le -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 1206kbps. \n'
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
          + '        -init_hw_device qsv=qsv:MFX_IMPL_hw -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f mp4 -profile:v main10 -vf scale_qsv=format=p010le -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 1206kbps. \n'
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
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox -b:v 603k -minrate 452k -maxrate 754k -bufsize 1206k -preset fast -c:a copy -c:s copy -max_muxing_queue_size 9999 -f mp4 -profile:v main10 -vf scale_qsv=format=p010le ',
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
  // Test 2
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[0].profile = 'High 10';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        container: 'mkv',
        encoder_speedpreset: 'fast',
      },
      otherArguments: {},
    },
    output: {
      linux: {
        processFile: true,
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_qsv -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska -profile:v main10 -pix_fmt p010le ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Input file is 10bit using High10. Disabling hardware decoding to avoid problems. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska -profile:v main10 -pix_fmt p010le ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Input file is 10bit using High10. Disabling hardware decoding to avoid problems. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_videotoolbox -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast -c:a copy -c:s copy -f matroska -profile:v main10 -pix_fmt p010le ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Input file is 10bit using High10. Disabling hardware decoding to avoid problems. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + '==ALERT== OS detected as MAC - This will use VIDEOTOOLBOX to encode which is NOT QSV\n'
          + 'cmds set in extra_qsv_options will be IGNORED!\n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
    },
  },
  // Test 3
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.mediaInfo.track[1].BitRate = 12000000;
        file.ffProbeData.streams[0].profile = 'Main 10';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        container: 'mkv',
        encoder_speedpreset: 'fast',
        reconvert_hevc: 'true',
        hevc_max_bitrate: '6000',
        bitrate_cutoff: '4000',
      },
      otherArguments: {},
    },
    output: {
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '        -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v hevc_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 6000k -minrate 4500k -maxrate 7500k -bufsize 12000k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska -profile:v main10 -vf scale_qsv=format=p010le -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 12000kbps. \n'
          + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
          + '☒ The file is still above this new cutoff! Reconverting. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 6000k \n'
          + 'Minimum = 4500k \n'
          + 'Maximum = 7500k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '        -init_hw_device qsv=qsv:MFX_IMPL_hw -c:v hevc_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 6000k -minrate 4500k -maxrate 7500k -bufsize 12000k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -f matroska -profile:v main10 -vf scale_qsv=format=p010le -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 12000kbps. \n'
          + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
          + '☒ The file is still above this new cutoff! Reconverting. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 6000k \n'
          + 'Minimum = 4500k \n'
          + 'Maximum = 7500k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_videotoolbox -b:v 6000k -minrate 4500k -maxrate 7500k -bufsize 12000k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -f matroska -profile:v main10 -vf scale_qsv=format=p010le',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 12000kbps. \n'
          + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
          + '☒ The file is still above this new cutoff! Reconverting. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 6000k \n'
          + 'Minimum = 4500k \n'
          + 'Maximum = 7500k \n'
          + '==ALERT== OS detected as MAC - This will use VIDEOTOOLBOX to encode which is NOT QSV\n'
          + 'cmds set in extra_qsv_options will be IGNORED!\n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
    },
  },
  // Test 4
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.mediaInfo.track[1].BitRate = 5000000;
        file.ffProbeData.streams[0].profile = 'Main 10';
        file.mediaInfo.track[0].extra.JBDONEDATE = new Date().toISOString();
        return file;
      })(),
      librarySettings: {},
      inputs: {
        container: 'mkv',
        encoder_speedpreset: 'fast',
        reconvert_hevc: 'true',
        hevc_max_bitrate: '6000',
        bitrate_cutoff: '4000',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ It looks like the current video bitrate is 5000kbps. \n'
        + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
        + '☑ The file is NOT above this new cutoff. Exiting plugin. \n',
      container: '.mkv',
    },
  },
  // Test 5
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[3].codec_name = 'hdmv_pgs_subtitle';
        file.ffProbeData.streams[4].codec_name = 'eia_608';
        file.ffProbeData.streams[5].codec_name = 'subrip';
        file.ffProbeData.streams[6].codec_name = 'timed_id3';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        encoder_speedpreset: 'fast',
        force_conform: 'true',
      },
      otherArguments: {},
    },
    output: {
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '        -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:3 -map -0:4 -map -0:5 -map -0:6 -f mp4 -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '        -init_hw_device qsv=qsv:MFX_IMPL_hw -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:3 -map -0:4 -map -0:5 -map -0:6 -f mp4 -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:3 -map -0:4 -map -0:5 -map -0:6 -f mp4',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Container for output selected as mp4. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mp4',
      },
    },
  },
  // Test 6
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[3].codec_name = 'mov_text';
        file.ffProbeData.streams[4].codec_name = 'eia_608';
        file.ffProbeData.streams[5].codec_name = 'timed_id3';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        container: 'mkv',
        encoder_speedpreset: 'fast',
        force_conform: 'true',
      },
      otherArguments: {},
    },
    output: {
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '        -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -map -0:3 -map -0:4 -map -0:5 -f matroska -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '        -init_hw_device qsv=qsv:MFX_IMPL_hw -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -map -0:3 -map -0:4 -map -0:5 -f matroska -vf "hwupload=extra_hw_frames=64,format=qsv" ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -map -0:3 -map -0:4 -map -0:5 -f matroska ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: '☑ It looks like the current video bitrate is 6454kbps. \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 3227k \n'
          + 'Minimum = 2420k \n'
          + 'Maximum = 4034k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
    },
  },
];

void run(tests);
