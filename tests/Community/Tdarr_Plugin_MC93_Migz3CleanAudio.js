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
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: "☑File doesn't contain audio tracks which are unwanted or that require tagging.\n",
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        language: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:3  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio stream 0:a:3 has unwanted language tag fre, removing. \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[3].tags.title = 'description';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        language: 'eng',
        commentary: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:2 -map -0:a:3  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio stream 0:a:2 detected as being descriptive, removing. \n'
        + '☒Audio stream 0:a:3 has unwanted language tag fre, removing. \n',
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[2].tags.title = 'description';
        file.ffProbeData.streams[3].tags.language = 'und';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        language: 'eng',
        commentary: 'true',
        tag_language: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:1 -map -0:a:2 -metadata:s:a:2 language=eng -map -0:a:3  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio stream 0:a:1 detected as being descriptive, removing. \n'
        + '☒Audio stream 0:a:2 has unwanted language tag und, removing. \n'
        + '☒Audio stream 0:a:2 detected as having no language, tagging as eng. \n'
        + '☒Audio stream 0:a:3 has unwanted language tag fre, removing. \n',
    },
  },
];

// https://github.com/HaveAGitGat/Tdarr_Plugins/issues/619
// A WebVTT subtitle stream (Matroska CodecID S_TEXT/WEBVTT, reported by ffprobe as codec_name
// "webvtt") makes ffmpeg fail outright with "Unknown/unsupported AVCodecID S_TEXT/WEBVTT" when
// swept up by this plugin's "-c copy". It should be dropped whenever the plugin already needs
// to touch the file for another reason - same scenario as the existing "language: eng" test,
// just with sample 2's subrip subtitle (stream 6) swapped for webvtt.
tests.push(
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        file.ffProbeData.streams[6].codec_name = 'webvtt';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        language: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:3 -map -0:6  -c copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☒Audio stream 0:a:3 has unwanted language tag fre, removing. \n',
    },
  },
  {
    // Regression guard: a WebVTT subtitle alone, with nothing else for the plugin to change,
    // should NOT trigger a conversion - this plugin only touches the file when it already has
    // another reason to (audio language/commentary/tagging). sampleH264_1 has no audio issues
    // under these inputs, so this should stay a no-op exactly like the first test in this file.
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams.push({
          index: 2,
          codec_name: 'webvtt',
          codec_long_name: 'WebVTT subtitle',
          codec_type: 'subtitle',
          tags: {
            language: 'eng',
          },
        });
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: "☑File doesn't contain audio tracks which are unwanted or that require tagging.\n",
    },
  },
);

void run(tests);
