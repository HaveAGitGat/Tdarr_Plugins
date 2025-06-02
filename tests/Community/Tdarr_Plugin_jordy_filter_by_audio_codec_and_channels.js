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
        file.ffProbeData.streams[1].codec_name = 'aac';
        file.ffProbeData.streams[1].channels = 2;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File meets audio codec and channel criteria. Moving to next plugin.\n'
      + 'Stream 1: codec=aac, channels=2\n',
    },
  },

  // Test 2: File doesn't have matching codec
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to non-matching codec
        file.ffProbeData.streams[1].codec_name = 'ac3';
        file.ffProbeData.streams[1].channels = 2;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File does not meet audio codec and channel criteria. Breaking out of plugin stack.\n'
      + 'Stream 1: codec=ac3, channels=2, matches=false\n',
    },
  },

  // Test 3: File has matching codec but wrong channel count
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to matching codec but wrong channels
        file.ffProbeData.streams[1].codec_name = 'aac';
        file.ffProbeData.streams[1].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File does not meet audio codec and channel criteria. Breaking out of plugin stack.\n'
      + 'Stream 1: codec=aac, channels=6, matches=false\n',
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
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File meets audio codec and channel criteria. Moving to next plugin.\n'
      + 'Stream 1: codec=aac, channels=2\n'
      + 'Stream 4: codec=aac, channels=2\n'
      + 'Stream 5: codec=aac, channels=2\n',
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
        requireAllStreams: 'true',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File does not meet audio codec and channel criteria. Breaking out of plugin stack.\n'
      + 'Stream 1: codec=aac, channels=2, matches=true\n'
      + 'Stream 2: codec=ac3, channels=6, matches=false\n'
      + 'Stream 3: codec=eac3, channels=2, matches=false\n'
      + 'Stream 4: codec=aac, channels=2, matches=true\n'
      + 'Stream 5: codec=aac, channels=2, matches=true\n',
    },
  },

  // Test 6: Using codecsToNotProcess and channelsToNotProcess
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to a codec that should be excluded
        file.ffProbeData.streams[1].codec_name = 'aac';
        file.ffProbeData.streams[1].channels = 2;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: '',
        channelsToProcess: '',
        codecsToNotProcess: 'aac',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'File does not meet audio codec and channel criteria. Breaking out of plugin stack.\n'
      + 'Stream 1: codec=aac, channels=2, matches=false\n',
    },
  },

  // Test 7: Only filtering by channel count
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Set audio stream to a specific channel count
        file.ffProbeData.streams[1].codec_name = 'aac';
        file.ffProbeData.streams[1].channels = 6;
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: '',
        channelsToProcess: '6',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      infoLog: 'File meets audio codec and channel criteria. Moving to next plugin.\n'
      + 'Stream 1: codec=aac, channels=6\n',
    },
  },

  // Test 8: No audio streams
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        // Remove audio streams
        file.ffProbeData.streams = file.ffProbeData.streams.filter(
          (stream) => stream.codec_type !== 'audio',
        );
        return file;
      })(),
      librarySettings: {},
      inputs: {
        codecsToProcess: 'aac',
        channelsToProcess: '2',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'No audio streams found. Breaking out of plugin stack.\n',
    },
  },

  // Test 9: No filter criteria provided
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        codecsToProcess: '',
        channelsToProcess: '',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'No filter criteria provided. At least one codec or channel filter must be specified. Breaking out of plugin stack.\n',
    },
  },

  // Test 10: Invalid channel numbers
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        codecsToProcess: '',
        channelsToProcess: 'invalid,0,-1',
        codecsToNotProcess: '',
        channelsToNotProcess: '',
        requireAllStreams: 'false',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      infoLog: 'Invalid channel numbers detected: NaN, 0, -1. Channel counts must be positive integers. Breaking out of plugin stack.\n',
    },
  },
];

void run(tests);
