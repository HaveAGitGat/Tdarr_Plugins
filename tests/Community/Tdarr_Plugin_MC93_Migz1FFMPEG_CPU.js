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
      preset: ',-map 0 -c:v libx265 -b:v 758k -minrate 530k -maxrate 985k -bufsize 1517k -c:a copy -c:s copy -max_muxing_queue_size 9999 ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Container for output selected as mkv. \n'
        + 'Current bitrate = 1517 \n'
        + 'Bitrate settings: \n'
        + 'Target = 758 \n'
        + 'Minimum = 530 \n'
        + 'Maximum = 985 \n'
        + 'File is not hevc or vp9. Transcoding. \n',
      container: '.mkv',
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
      reQueueAfter: true,
      infoLog: 'File is already hevc or vp9 & in mkv. \n',
      container: '.mkv',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        enable_10bit: 'true',
        force_conform: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c:v libx265 -b:v 758k -minrate 530k -maxrate 985k -bufsize 1517k -c:a copy -c:s copy -max_muxing_queue_size 9999 -pix_fmt p010le ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Container for output selected as mp4. \n'
        + 'Current bitrate = 1517 \n'
        + 'Bitrate settings: \n'
        + 'Target = 758 \n'
        + 'Minimum = 530 \n'
        + 'Maximum = 985 \n'
        + 'File is not hevc or vp9. Transcoding. \n',
      container: '.mp4',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        enable_10bit: 'true',
        force_conform: 'true',
        bitrate_cutoff: '10000',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Current bitrate is below set bitrate cutoff of 10000. Nothing to do, cancelling plugin. \n',
      container: '.mp4',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        enable_10bit: 'true',
        force_conform: 'true',
        bitrate_cutoff: '1000',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c:v libx265 -b:v 758k -minrate 530k -maxrate 985k -bufsize 1517k -c:a copy -c:s copy -max_muxing_queue_size 9999 -pix_fmt p010le ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Container for output selected as mp4. \n'
        + 'Current bitrate = 1517 \n'
        + 'Bitrate settings: \n'
        + 'Target = 758 \n'
        + 'Minimum = 530 \n'
        + 'Maximum = 985 \n'
        + 'File is not hevc or vp9. Transcoding. \n',
      container: '.mp4',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        container: 'original',
        enable_10bit: 'true',
        force_conform: 'true',
        bitrate_cutoff: '1000',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',-map 0 -c:v libx265 -b:v 3933k -minrate 2753k -maxrate 5112k -bufsize 7866k -c:a copy -c:s copy -max_muxing_queue_size 9999 -map -0:d -pix_fmt p010le ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Container for output selected as mkv. \n'
        + 'Current bitrate = 7866 \n'
        + 'Bitrate settings: \n'
        + 'Target = 3933 \n'
        + 'Minimum = 2753 \n'
        + 'Maximum = 5112 \n'
        + 'File is not hevc or vp9. Transcoding. \n',
      container: '.mkv',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {
        container: 'mp4',
        force_conform: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -c copy ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is hevc or vp9 but is not in mp4 container. Remuxing. \n',
      container: '.mp4',
    },
  },
];

void run(tests);
