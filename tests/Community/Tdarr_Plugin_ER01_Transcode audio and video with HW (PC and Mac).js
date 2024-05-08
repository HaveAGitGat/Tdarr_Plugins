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
      win32: {
        container: '.mkv',
        processFile: true,
        preset: ', -sn -map 0:v -c:v hevc_qsv -load_plugin hevc_hw  -b:v 758k -minrate 530k -maxrate 985k -bufsize 1517k  -map 0:a -c:a copy  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Converting video, NOT resizing. 720p, h264  -->  720p, hevc.  bitrate = 1517 --> 758, multiplier 0.5. \n'
          + 'Not converting audio. \n'
          + '2 channels -     \n'
          + '6 channels - und  aac  \n'
          + '8 channels -    ',
      },
      linux: false,
      darwin: {
        container: '.mkv',
        processFile: true,
        preset: ', -sn -map 0:v -c:v hevc_videotoolbox -profile main  -b:v 758k -minrate 530k -maxrate 985k -bufsize 1517k  -map 0:a -c:a copy  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Converting video, NOT resizing. 720p, h264  -->  720p, hevc.  bitrate = 1517 --> 758, multiplier 0.5. \n'
          + 'Not converting audio. \n'
          + '2 channels -     \n'
          + '6 channels - und  aac  \n'
          + '8 channels -    ',
      },
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
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is processed already, nothing to do',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        resize: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.mkv',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is processed already, nothing to do',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        bitrate_cutoff: '6000',
      },
      otherArguments: {},
    },
    output: {
      win32: {
        container: '.mkv',
        processFile: true,
        preset: ', -sn -map 0:v -c:v hevc_qsv -load_plugin hevc_hw  -b:v 3933k -minrate 2753k -maxrate 5112k -bufsize 7866k  -map 0:a -c:a copy  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Converting video, NOT resizing. 1080p, h264  -->  1080p, hevc.  bitrate = 7866 --> 3933, multiplier 0.5. \n'
          + 'Not converting audio. \n'
          + '2 channels - eng  flac  \n'
          + '6 channels -     \n'
          + '8 channels -    ',
      },
      linux: false,
      darwin: {
        container: '.mkv',
        processFile: true,
        preset: ', -sn -map 0:v -c:v hevc_videotoolbox -profile main  -b:v 3933k -minrate 2753k -maxrate 5112k -bufsize 7866k  -map 0:a -c:a copy  ',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: 'Converting video, NOT resizing. 1080p, h264  -->  1080p, hevc.  bitrate = 7866 --> 3933, multiplier 0.5. \n'
          + 'Not converting audio. \n'
          + '2 channels - eng  flac  \n'
          + '6 channels -     \n'
          + '8 channels -    ',
      },
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        bitrate_cutoff: '8000',
      },
      otherArguments: {},
    },
    output: {
      container: '.mkv',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is processed already, nothing to do',
    },
  },
];

void run(tests);
