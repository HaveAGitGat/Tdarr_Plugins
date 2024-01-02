/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

// Date stuff for mkvpropedit
const intStatsDays = 7; // Use 1 week threshold for new stats
let statsThresString = new Date(new Date().setDate(new Date().getDate() - intStatsDays)).toUTCString();
statsThresString = `${statsThresString.slice(0, 22)}:00 GMT`;
let datStatsString = new Date().toUTCString();
datStatsString = `${datStatsString.slice(0, 22)}:00 GMT`;
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
  // Test 2
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[0].profile = 'High 10';
        file.mediaInfo.track[0].extra.JBDONEDATE = new Date().toISOString();
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
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_qsv -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -pix_fmt p010le  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -pix_fmt p010le  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_videotoolbox -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast -c:a copy -c:s copy -profile:v main10 -pix_fmt p010le  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
        file.mediaInfo.track[1].BitRate = 12059590;
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
      linux: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '      -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v hevc_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 6030k -minrate 4523k -maxrate 7538k -bufsize 12060k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -vf scale_qsv=format=p010le  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 12060kbps. \n'
          + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
          + '☒ The file is still above this new cutoff! Reconverting. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 6030k \n'
          + 'Minimum = 4523k \n'
          + 'Maximum = 7538k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      win32: {
        processFile: true,
        preset: '-fflags +genpts -hwaccel qsv -hwaccel_output_format qsv \n'
          + '      -init_hw_device qsv:hw_any,child_device_type=d3d11va -c:v hevc_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 6030k -minrate 4523k -maxrate 7538k -bufsize 12060k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -vf scale_qsv=format=p010le  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 12060kbps. \n'
          + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
          + '☒ The file is still above this new cutoff! Reconverting. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 6030k \n'
          + 'Minimum = 4523k \n'
          + 'Maximum = 7538k \n'
          + 'File Transcoding... \n',
        container: '.mkv',
      },
      darwin: {
        processFile: true,
        preset: '-fflags +genpts <io> -map 0 -c:v hevc_videotoolbox -b:v 6030k -minrate 4523k -maxrate 7538k -bufsize 12060k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -profile:v main10 -vf scale_qsv=format=p010le  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 12060kbps. \n'
          + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
          + '☒ The file is still above this new cutoff! Reconverting. \n'
          + '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n'
          + 'Container for output selected as mkv. \n'
          + 'Encode variable bitrate settings: \n'
          + 'Target = 6030k \n'
          + 'Minimum = 4523k \n'
          + 'Maximum = 7538k \n'
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
      infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
        + '\n'
        + `    Stats threshold: ${statsThresString}\n`
        + '\n'
        + `    Current stats date: ${datStatsString}\n`
        + '☑ File stats are upto date! - Continuing...\n'
        + '☑ It looks like the current video bitrate is 5000kbps. \n'
        + 'Reconvert_hevc is true & the file is already HEVC, VP9 or AV1. Using HEVC specific cutoff of 6000kbps. \n'
        + '☑ The file is NOT above this new cutoff. Exiting plugin. \n',
      container: '.mkv',
    },
  },
  // Test 5
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        file.container = 'mp4';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        encoder_speedpreset: 'fast',
        bitrate_cutoff: '3500',
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
        + '==WARNING== Failed to get an accurate video bitrate, falling back to old method to get OVERALL file bitrate of 3059kbps. Bitrate calculations for video encode will likely be inaccurate... \n'
        + '☑ Current bitrate is below set cutoff of 3500kbps. \n'
        + 'Cancelling plugin. \n',
      container: '.mp4',
    },
  },
  // Test 6
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.mediaInfo.track[0].extra.JBDONEDATE = new Date().toISOString();
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
          + '      -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:3 -map -0:4 -map -0:5 -map -0:6  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
          + '      -init_hw_device qsv:hw_any,child_device_type=d3d11va -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:3 -map -0:4 -map -0:5 -map -0:6  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:3 -map -0:4 -map -0:5 -map -0:6  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
  // Test 7
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.mediaInfo.track[0].extra.JBDONEDATE = new Date().toISOString();
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
          + '      -init_hw_device qsv:hw_any,child_device_type=vaapi -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -map -0:3 -map -0:4 -map -0:5  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
          + '      -init_hw_device qsv:hw_any,child_device_type=d3d11va -c:v h264_qsv<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -map -0:3 -map -0:4 -map -0:5  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
        preset: '-fflags +genpts -hwaccel videotoolbox<io> -map 0 -c:v hevc_videotoolbox<io> -map 0 -c:v hevc_qsv -load_plugin hevc_hw -b:v 3227k -minrate 2420k -maxrate 4034k -bufsize 6454k -preset fast  -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -map -0:3 -map -0:4 -map -0:5  -map_metadata:g -1 -metadata JBDONEDATE=2674800000',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "Checking file stats - If stats are older than 7 days we'll grab new stats.\n"
          + '\n'
          + `    Stats threshold: ${statsThresString}\n`
          + '\n'
          + `    Current stats date: ${datStatsString}\n`
          + '☑ File stats are upto date! - Continuing...\n'
          + '☑ It looks like the current video bitrate is 6454kbps. \n'
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
