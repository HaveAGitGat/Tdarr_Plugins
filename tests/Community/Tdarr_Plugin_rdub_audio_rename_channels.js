/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

// Test suite for the Tdarr_Plugin_rdub_audio_rename_channels plugin
const pluginTests = [

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        // Simulate a video file with multiple audio streams
        file.fileMedium = 'video';
        file.ffProbeData.streams = [
          {
            codec_type: 'audio',
            channels: 8,
            tags: { title: '' },
          },
          {
            codec_type: 'audio',
            channels: 6,
            tags: { title: '' },
          },
          {
            codec_type: 'audio',
            channels: 2,
            tags: { title: '' },
          },
        ];
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ',  -metadata:s:a:0 title=7.1  -metadata:s:a:1 title=5.1  -metadata:s:a:2 title=2.0  -c copy -map 0 -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ Audio stream 0 has 8 channels. Renaming title to "7.1"\n'
        + '☑ Audio stream 1 has 6 channels. Renaming title to "5.1"\n'
        + '☑ Audio stream 2 has 2 channels. Renaming title to "2.0"\n'
        + '☒ File has audio tracks to rename. Renaming...\n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        // Simulate a video file with already renamed audio streams
        file.fileMedium = 'video';
        file.ffProbeData.streams = [
          {
            codec_type: 'audio',
            channels: 8,
            tags: { title: '7.1' },
          },
          {
            codec_type: 'audio',
            channels: 6,
            tags: { title: '5.1' },
          },
          {
            codec_type: 'audio',
            channels: 2,
            tags: { title: '2.0' },
          },
        ];
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☑ Audio stream 0 already has a renamed title: "7.1". Skipping further renaming.\n'
        + '☑ Audio stream 1 already has a renamed title: "5.1". Skipping further renaming.\n'
        + '☑ Audio stream 2 already has a renamed title: "2.0". Skipping further renaming.\n'
        + '☑ File has no need to rename audio streams.\n',
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH265_1.json'));
        // Simulate a non-video file
        file.fileMedium = 'audio';
        file.ffProbeData.streams = [];
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '☒ File is not a video. Skipping processing.\n',
    },
  },
];

void run(pluginTests);
