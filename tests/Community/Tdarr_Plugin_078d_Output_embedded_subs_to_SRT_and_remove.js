/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

// Use `echo` as a stand-in for ffmpeg so the plugin's await resolves successfully
// across Linux, macOS, and Windows CI runners without needing real media files.
const ffmpegStub = 'echo';
// A command guaranteed to fail, used to exercise the extraction-error path.
const ffmpegFailStub = 'this-command-does-not-exist';

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: ffmpegStub,
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_2.json').file,
        },
      },
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:6 -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Found sub to extract!',
    },
  },
  {
    input: {
      file: (() => {
        const sample = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        sample.ffProbeData.streams.push({
          index: 2,
          codec_name: 'mov_text',
          codec_type: 'subtitle',
          tags: {
            language: 'eng',
          },
        });
        return sample;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: ffmpegStub,
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_1.json').file,
        },
      },
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:2 -c copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Found sub to extract!',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: ffmpegStub,
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_1.json').file,
        },
      },
    },
    output: {
      processFile: false,
      preset: '',
      container: '',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'No subs in file to extract!',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_2.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: ffmpegFailStub,
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_2.json').file,
        },
      },
    },
    error: { shouldThrow: true },
    outputModify: (message) => (
      typeof message === 'string' && message.startsWith('Sub extraction failed, keeping embedded subs')
        ? 'Sub extraction failed, keeping embedded subs'
        : message
    ),
    output: 'Sub extraction failed, keeping embedded subs',
  },
];

void run(tests);
