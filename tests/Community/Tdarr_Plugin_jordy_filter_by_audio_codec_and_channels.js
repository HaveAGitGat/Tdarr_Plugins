/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  // Test 1: Basic functionality - match specific codec and channel count
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Ensure one audio stream is AAC stereo
        if (file.ffProbeData.streams[1].codec_type === 'audio') {
          file.ffProbeData.streams[1].codec_name = 'aac';
          file.ffProbeData.streams[1].channels = 2;
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: expect.stringContaining('meets audio codec and channel criteria'),
    },
  },
  
  // Test 2: File doesn't have matching codec
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to non-matching codec
        if (file.ffProbeData.streams[1].codec_type === 'audio') {
          file.ffProbeData.streams[1].codec_name = 'ac3';
          file.ffProbeData.streams[1].channels = 2;
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: expect.stringContaining('does not meet audio codec and channel criteria'),
    },
  },
  
  // Test 3: File has matching codec but wrong channel count
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to matching codec but wrong channels
        if (file.ffProbeData.streams[1].codec_type === 'audio') {
          file.ffProbeData.streams[1].codec_name = 'aac';
          file.ffProbeData.streams[1].channels = 6;
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: expect.stringContaining('does not meet audio codec and channel criteria'),
    },
  },
  
  // Test 4: Multiple audio streams with only one matching (should pass with requireAllStreams=false)
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        // First audio stream matches
        file.ffProbeData.streams[1].codec_name = 'aac';
        file.ffProbeData.streams[1].channels = 2;
        // Second audio stream doesn't match
        file.ffProbeData.streams[2].codec_name = 'ac3';
        file.ffProbeData.streams[2].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: expect.stringContaining('meets audio codec and channel criteria'),
    },
  },
  
  // Test 5: Multiple audio streams with only one matching (should fail with requireAllStreams=true)
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_2.json'));
        // First audio stream matches
        file.ffProbeData.streams[1].codec_name = 'aac';
        file.ffProbeData.streams[1].channels = 2;
        // Second audio stream doesn't match
        file.ffProbeData.streams[2].codec_name = 'ac3';
        file.ffProbeData.streams[2].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'true'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: expect.stringContaining('does not meet audio codec and channel criteria'),
    },
  },
  
  // Test 6: Using codecsToNotProcess and channelsToNotProcess
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to a codec that should be excluded
        if (file.ffProbeData.streams[1].codec_type === 'audio') {
          file.ffProbeData.streams[1].codec_name = 'aac';
          file.ffProbeData.streams[1].channels = 2;
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: '',
        channelsToProcess: '',
        codecsToNotProcess: 'aac',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: expect.stringContaining('does not meet audio codec and channel criteria'),
    },
  },
  
  // Test 7: Only filtering by channel count
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to a specific channel count
        if (file.ffProbeData.streams[1].codec_type === 'audio') {
          file.ffProbeData.streams[1].codec_name = 'aac';
          file.ffProbeData.streams[1].channels = 6;
        }
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: '',
        channelsToProcess: '6',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: expect.stringContaining('meets audio codec and channel criteria'),
    },
  },
  
  // Test 8: No audio streams
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Remove audio streams
        file.ffProbeData.streams = file.ffProbeData.streams.filter(
          stream => stream.codec_type !== 'audio'
        );
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false'
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: expect.stringContaining('No audio streams found'),
    },
  },
];

void run(tests);
