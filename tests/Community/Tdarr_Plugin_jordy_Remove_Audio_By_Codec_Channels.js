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
        languages: 'jpn'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: expect.stringContaining('No matching audio tracks to remove'),
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
        languages: ''
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: expect.stringContaining('-map 0 -map -0:a:'),
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: expect.stringContaining('Marking for removal'),
    },
  },
  
  // Test 3: Remove AAC tracks with Japanese language
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        // Modify a stream to have Japanese language
        if (file.ffProbeData.streams[3].tags) {
          file.ffProbeData.streams[3].tags.language = 'jpn';
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecs: 'aac',
        channels: 'Any',
        languages: 'jpn'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: expect.stringContaining('-map 0 -map -0:a:3'),
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: expect.stringContaining('Marking for removal'),
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
        languages: 'eng,kor'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: expect.stringContaining('-map 0 -map -0:a:1 -map -0:a:2'),
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: expect.stringContaining('Marking for removal'),
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
        languages: 'eng'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: expect.stringContaining('No codecs specified for removal'),
    },
  },
  
  // Test 6: Safety check - would remove all audio
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Make all audio tracks match our removal criteria
        file.ffProbeData.streams.forEach(stream => {
          if (stream.codec_type && stream.codec_type.toLowerCase() === 'audio') {
            stream.codec_name = 'aac';
            stream.channels = 2;
            if (!stream.tags) stream.tags = {};
            stream.tags.language = 'eng';
          }
        });
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecs: 'aac',
        channels: '2',
        languages: 'eng'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: expect.stringContaining('Cancelling plugin - all audio tracks would be removed'),
    },
  },
];

void run(tests);
