/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  // Test 1: No modification needed - file has no matching tracks
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        codecs: 'aac',
        channels: '5.1',
        languages: 'jpn',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '\n'
          + '🔵  Parameters: Codecs=aac, Channels=5.1, Languages=jpn\n'
          + '\n'
          + '🔵 Found 1 audio streams in file\n'
          + '🔵 Audio track 0: codec=aac, channels=6, language=und\n'
          + '✅ No matching audio tracks to remove\n',
    },
  },

  // Test 2: Remove AAC 5.1 tracks (any language)
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        codecs: 'aac',
        channels: '5.1',
        languages: '',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '\n'
          + '🔵  Parameters: Codecs=aac, Channels=5.1, Languages=any\n'
          + '\n'
          + '🔵 Found 5 audio streams in file\n'
          + '🔵 Audio track 0: codec=flac, channels=2, language=eng\n'
          + '🔵 Audio track 1: codec=ac3, channels=2, language=eng\n'
          + '🔵 Audio track 2: codec=eac3, channels=2, language=eng\n'
          + '🔵 Audio track 3: codec=aac, channels=2, language=fre\n'
          + '🔵 Audio track 4: codec=aac, channels=2, language=eng\n'
          + '✅ No matching audio tracks to remove\n',
    },
  },

  // Test 3: Remove AAC tracks with Japanese language
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        // Modify a stream to have Japanese language
        if (file.ffProbeData.streams[4].tags) {
          file.ffProbeData.streams[4].tags.language = 'jpn';
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecs: 'aac',
        channels: 'Any',
        languages: 'jpn',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:3  -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '\n'
          + '🔵  Parameters: Codecs=aac, Channels=Any, Languages=jpn\n'
          + '\n'
          + '🔵 Found 5 audio streams in file\n'
          + '🔵 Audio track 0: codec=flac, channels=2, language=eng\n'
          + '🔵 Audio track 1: codec=ac3, channels=2, language=eng\n'
          + '🔵 Audio track 2: codec=eac3, channels=2, language=eng\n'
          + '🔵 Audio track 3: codec=aac, channels=2, language=jpn\n'
          + '☒ Marking for removal: audio track 3\n'
          + '🔵 Audio track 4: codec=aac, channels=2, language=eng\n'
          + '✅ Will remove 1 audio track(s)\n',
    },
  },

  // Test 4: Multiple codecs and languages
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        // Add variety of audio tracks with different codecs and languages
        if (file.ffProbeData.streams[2].tags) {
          file.ffProbeData.streams[2].codec_name = 'ac3';
          file.ffProbeData.streams[2].tags.language = 'eng';
        }
        if (file.ffProbeData.streams[3].tags) {
          file.ffProbeData.streams[3].codec_name = 'opus';
          file.ffProbeData.streams[3].tags.language = 'kor';
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecs: 'ac3,opus',
        channels: '2',
        languages: 'eng,kor',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:a:1 -map -0:a:2  -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '\n'
          + '🔵  Parameters: Codecs=ac3,opus, Channels=2, Languages=eng,kor\n'
          + '\n'
          + '🔵 Found 5 audio streams in file\n'
          + '🔵 Audio track 0: codec=flac, channels=2, language=eng\n'
          + '🔵 Audio track 1: codec=ac3, channels=2, language=eng\n'
          + '☒ Marking for removal: audio track 1\n'
          + '🔵 Audio track 2: codec=opus, channels=2, language=kor\n'
          + '☒ Marking for removal: audio track 2\n'
          + '🔵 Audio track 3: codec=aac, channels=2, language=fre\n'
          + '🔵 Audio track 4: codec=aac, channels=2, language=eng\n'
          + '✅ Will remove 2 audio track(s)\n',
    },
  },

  // Test 5: Empty codecs input
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        codecs: '',
        channels: '5.1',
        languages: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '\n'
          + '🔵  Parameters: Codecs=aac, Channels=5.1, Languages=eng\n'
          + '\n'
          + '🔵 Found 1 audio streams in file\n'
          + '🔵 Audio track 0: codec=aac, channels=6, language=und\n'
          + '✅ No matching audio tracks to remove\n',
    },
  },

  // Test 6: Safety check - would remove all audio
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Make all audio tracks match our removal criteria
        file.ffProbeData.streams.forEach((stream) => {
          if (stream.codec_type && stream.codec_type.toLowerCase() === 'audio') {
            // eslint-disable-next-line no-param-reassign
            stream.codec_name = 'aac';
            // eslint-disable-next-line no-param-reassign
            stream.channels = 2;
            if (!stream.tags) {
              // eslint-disable-next-line no-param-reassign
              stream.tags = {};
            }
            // eslint-disable-next-line no-param-reassign
            stream.tags.language = 'eng';
          }
        });
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecs: 'aac',
        channels: '2',
        languages: 'eng',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: '\n'
          + '🔵  Parameters: Codecs=aac, Channels=2, Languages=eng\n'
          + '\n'
          + '🔵 Found 1 audio streams in file\n'
          + '🔵 Audio track 0: codec=aac, channels=2, language=eng\n'
          + '☒ Marking for removal: audio track 0\n'
          + '\n'
          + '⚠️ Cancelling plugin - all audio tracks would be removed\n',
    },
  },
];

void run(tests);
