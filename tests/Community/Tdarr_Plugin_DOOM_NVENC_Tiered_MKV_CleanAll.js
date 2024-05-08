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
      infoLog: '☒ Removing audio track in language und\n'
        + '☒ *** All audio tracks would have been removed.  Defaulting to keeping all tracks for this file.\n'
        + '☒ Transcoding to HEVC using NVidia NVENC\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ' -c:v h264_cuvid,-map 0 -map -0:d -c:v hevc_nvenc -qmin 0 -cq:v 30 -b:v 602k -maxrate:v 2602k -preset medium -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -c:a copy -c:s copy -max_muxing_queue_size 9999 -bf 5 -analyzeduration 2147483647 -probesize 2147483647',
      reQueueAfter: true,
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
      container: '.mkv',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☑ File is in HEVC codec and in MKV\n'
        + '☑ No video processing necessary\n'
        + '☑ No subtitle processing necessary\n'
        + '☑ No need to process file',
      processFile: false,
      preset: ',-map 0 -map -0:d -c:v copy -c:a copy -c:s copy -max_muxing_queue_size 9999 -bf 5 -analyzeduration 2147483647 -probesize 2147483647',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[0].bit_rate = undefined;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        target_bitrate_720p: '1500000',
      },
      otherArguments: {},
    },
    output: {
      container: '.mkv',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Removing audio track in language und\n'
        + '☒ *** All audio tracks would have been removed.  Defaulting to keeping all tracks for this file.\n'
        + '☒ Transcoding to HEVC using NVidia NVENC\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ' -c:v h264_cuvid,-map 0 -map -0:d -c:v hevc_nvenc -qmin 0 -cq:v 30 -b:v 1500k -maxrate:v 3500k -preset medium -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -c:a copy -c:s copy -max_muxing_queue_size 9999 -bf 5 -analyzeduration 2147483647 -probesize 2147483647',
      reQueueAfter: true,
    },
  },

];

void run(tests);
