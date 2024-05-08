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
      preset: '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v h264_cuvid ,-map 0:v -map 0:a -map 0:s? -map -:d? -c copy -c:v:0 hevc_nvenc -preset medium -profile:v main10 -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -max_muxing_queue_size 4096  -b:v 967680 -maxrate 1257984 -minrate 677376  -bufsize 1205959 -map_metadata:g -1',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'No valid resolution selected, defaulting to 8KUHD.\n'
        + 'Video details: h264-720p \n'
        + '  1280x720x25@8 bits.\n'
        + 'Video bitrate is 1206Kbps, overall is 1591Kbps. Calculated target is 1613Kbps.\n'
        + '☒H264 Resolution is 720p, bitrate was 1206Kbps. HEVC target bitrate will be 968Kbps.\n'
        + '☒Transcoding to HEVC.',
    },
  }, {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        ffmpegPreset: 'veryslow',
        container: 'mkv',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v hevc_cuvid  ,-map 0:v -map 0:a -map 0:s? -map -:d? -c copy -c:v:0 hevc_nvenc -preset veryslow -profile:v main10 -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -max_muxing_queue_size 4096  -b:v 3207442 -maxrate 4717440 -minrate 2540160 -bufsize 3628800  -map_metadata:g -1',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'No valid resolution selected, defaulting to 8KUHD.\n'
        + 'Video details: hevc-1080p \n'
        + '  1920x1080x25@8 bits.\n'
        + 'Video bitrate is NaNKbps, overall is 3207Kbps. Calculated target is 3629Kbps.\n'
        + '☒HEVC Bitrate for 1080p could not be determined, \n'
        + '          using sensible default of 3207Kbps.\n'
        + '☒Transcoding to HEVC.',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        maxResolution: '720p',
        ffmpegPreset: 'veryslow',
        container: 'mkv',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v hevc_cuvid   -resize 1280x720 ,-map 0:v -map 0:a -map 0:s? -map -:d? -c copy -c:v:0 hevc_nvenc -preset veryslow -profile:v main10 -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -max_muxing_queue_size 4096  -b:v 1612800 -maxrate 2096640 -minrate 1128960 -bufsize 1612800  -map_metadata:g -1',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Resizing to 1280x720.\n'
        + 'Video details: hevc-1080p \n'
        + '  1920x1080x25@8 bits.\n'
        + 'Video bitrate is NaNKbps, overall is 3207Kbps. Calculated target is 1613Kbps.\n'
        + '☒HEVC Bitrate for 1080p could not be determined, \n'
        + '          using sensible default of 1613Kbps.\n'
        + '☒Transcoding to HEVC.',
    },
  },
  {
    input: {
      file: (() => {
        // modify so no processing needed
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[0].codec_name = 'hevc';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        maxResolution: '1080p',
        ffmpegPreset: 'veryslow',
        container: 'mkv',
        compressionFactor: '1',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v hevc_cuvid  ,-map 0:v -map 0:a -map 0:s? -map -:d? -c copy -c:v:0 hevc_nvenc -preset veryslow -profile:v main10 -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -max_muxing_queue_size 4096 ',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Video details: hevc-1080p \n'
        + '  1918x1080x25@8 bits.\n'
        + 'Video bitrate is 6454Kbps, overall is 8249Kbps. Calculated target is 51786Kbps.\n'
        + '☑HEVC Bitrate is within limits.\n',
    },
  },
];

void run(tests);
