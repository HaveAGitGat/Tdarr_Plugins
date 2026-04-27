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
      processFile: false,
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File contains all required audio formats. \n',
    },
  },

  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        aac_stereo: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑File contains all required audio formats. \n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        aac_stereo: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 2 channel but is not AAC. Converting. \n'
        + '☒Audio track is 2 channel but is not AAC. Converting. \n'
        + '☒Audio track is 2 channel but is not AAC. Converting. \n',
      preset: ', -map 0 -c:v copy -c:a copy -c:a:0 aac -c:a:1 aac -c:a:2 aac  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:0 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 8;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n'
        + '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:0 language="eng" -map 0:2 -c:a:1 ac3 -ac 6 -metadata:s:a:1 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:1 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 8;
        file.ffProbeData.streams[3].channels = 6;
        file.ffProbeData.streams[4].channels = 6;
        file.ffProbeData.streams[5].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Anglais E-AC3 2.0" from 6 channel. \n'
      + '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Français E-AC3 2.0" from 6 channel. \n'
      + '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Anglais E-AC3 2.0" from 6 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:3 -c:a:2 aac -ac 2 -metadata:s:a:2 title="Anglais E-AC3 2.0" -metadata:s:a:2 language="eng" -map 0:4 -c:a:3 aac -ac 2 -metadata:s:a:3 title="Français E-AC3 2.0" -metadata:s:a:3 language="fre" -map 0:5 -c:a:4 aac -ac 2 -metadata:s:a:4 title="Anglais E-AC3 2.0" -metadata:s:a:4 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 8;
        file.ffProbeData.streams[3].channels = 8;
        file.ffProbeData.streams[4].channels = 6;
        file.ffProbeData.streams[5].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
        downmix_single_track: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Français E-AC3 2.0" from 6 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:4 -c:a:3 aac -ac 2 -metadata:s:a:3 title="Français E-AC3 2.0" -metadata:s:a:3 language="fre"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 8;
        file.ffProbeData.streams[3].channels = 8;
        file.ffProbeData.streams[4].channels = 8;
        file.ffProbeData.streams[5].channels = 8;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
        downmix_single_track: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n'
        + '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n'
        + '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n'
        + '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Français E-AC3 2.0 - 5.1" from 8 channel. \n'
        + '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:0 language="eng" -map 0:2 -c:a:1 ac3 -ac 6 -metadata:s:a:1 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:1 language="eng" -map 0:3 -c:a:2 ac3 -ac 6 -metadata:s:a:2 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:2 language="eng" -map 0:4 -c:a:3 ac3 -ac 6 -metadata:s:a:3 title="Français E-AC3 2.0 - 5.1" -metadata:s:a:3 language="fre" -map 0:5 -c:a:4 ac3 -ac 6 -metadata:s:a:4 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:4 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',

    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 8;
        file.ffProbeData.streams[2].channels = 8;
        file.ffProbeData.streams[3].channels = 8;
        file.ffProbeData.streams[4].channels = 8;
        file.ffProbeData.streams[5].channels = 8;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
        downmix_single_track: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 8 channel, no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 8 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:0 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },
  // DTS 6.1 (7 channel) - should downmix to 6ch (2ch created on requeue)
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 7;
        file.ffProbeData.streams[1].codec_name = 'dts';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 7 channel (6.1), no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 7 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:0 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  // DTS 6.1 (7 channel) with single track downmix
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 7;
        file.ffProbeData.streams[1].codec_name = 'dts';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
        downmix_single_track: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 7 channel (6.1), no 6 channel exists. Creating 6 channel "Anglais E-AC3 2.0 - 5.1" from 7 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 ac3 -ac 6 -metadata:s:a:0 title="Anglais E-AC3 2.0 - 5.1" -metadata:s:a:0 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },

  // DTS 6.1 (7 channel) with existing 6ch but no 2ch - should create 2ch from both 6ch and 7ch
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[1].channels = 7;
        file.ffProbeData.streams[1].codec_name = 'dts';
        file.ffProbeData.streams[2].channels = 6;
        file.ffProbeData.streams[3].channels = 6;
        file.ffProbeData.streams[4].channels = 6;
        file.ffProbeData.streams[5].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        aac_stereo: 'false',
        downmix: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio track is 7 channel (6.1), no 2 channel exists. Creating 2 channel "Anglais E-AC3 2.0" from 7 channel. \n'
        + '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Anglais E-AC3 2.0" from 6 channel. \n'
        + '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Anglais E-AC3 2.0" from 6 channel. \n'
        + '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Français E-AC3 2.0" from 6 channel. \n'
        + '☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel "Anglais E-AC3 2.0" from 6 channel. \n',
      preset: ', -map 0 -c:v copy -c:a copy -map 0:1 -c:a:0 aac -ac 2 -metadata:s:a:0 title="Anglais E-AC3 2.0" -metadata:s:a:0 language="eng" -map 0:2 -c:a:1 aac -ac 2 -metadata:s:a:1 title="Anglais E-AC3 2.0" -metadata:s:a:1 language="eng" -map 0:3 -c:a:2 aac -ac 2 -metadata:s:a:2 title="Anglais E-AC3 2.0" -metadata:s:a:2 language="eng" -map 0:4 -c:a:3 aac -ac 2 -metadata:s:a:3 title="Français E-AC3 2.0" -metadata:s:a:3 language="fre" -map 0:5 -c:a:4 aac -ac 2 -metadata:s:a:4 title="Anglais E-AC3 2.0" -metadata:s:a:4 language="eng"  -strict -2 -c:s copy -max_muxing_queue_size 9999 ',
    },
  },
];

void run(tests);
