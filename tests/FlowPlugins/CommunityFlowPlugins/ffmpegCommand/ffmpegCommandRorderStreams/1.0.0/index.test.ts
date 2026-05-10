import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRorderStreams/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandRorderStreams Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    const sampleFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;

    // Create mock ffmpegCommand with streams based on the sample file
    const mockStreams = sampleFile.ffProbeData.streams?.map((stream, index) => ({
      ...stream,
      removed: false,
      forceEncoding: false,
      inputArgs: [],
      outputArgs: [],
      mapArgs: ['-map', `0:${stream.index}`],
      typeIndex: index,
    })) || [];

    baseArgs = {
      inputs: {
        processOrder: 'codecs,channels,languages,streamTypes',
        languages: '',
        channels: '7.1,5.1,2,1',
        codecs: '',
        streamTypes: 'video,audio,subtitle',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: mockStreams,
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: sampleFile,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Stream Reordering', () => {
    it('should not change order when streams are already in correct order', () => {
      const originalOrder = JSON.stringify(baseArgs.variables.ffmpegCommand.streams);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(JSON.stringify(result.variables.ffmpegCommand.streams)).toBe(originalOrder);
    });

    it('should handle empty process order', () => {
      baseArgs.inputs.processOrder = '';
      const originalOrder = JSON.stringify(baseArgs.variables.ffmpegCommand.streams);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(JSON.stringify(result.variables.ffmpegCommand.streams)).toBe(originalOrder);
    });

    it('should preserve typeIndex property for each stream', () => {
      const result = plugin(baseArgs);

      result.variables.ffmpegCommand.streams.forEach((stream) => {
        expect(stream.typeIndex).toBeDefined();
        expect(typeof stream.typeIndex).toBe('number');
      });
    });
  });

  describe('Stream Type Reordering', () => {
    it('should reorder streams by type when specified', () => {
      // Create a mock scenario with mixed stream types
      const mixedStreams = [
        {
          index: 0,
          codec_name: 'srt',
          codec_type: 'subtitle',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          channels: 2,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
        {
          index: 2,
          codec_name: 'h264',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
          typeIndex: 2,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = mixedStreams;
      baseArgs.inputs.streamTypes = 'video,audio,subtitle';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].codec_type).toBe('video');
      expect(result.variables.ffmpegCommand.streams[1].codec_type).toBe('audio');
      expect(result.variables.ffmpegCommand.streams[2].codec_type).toBe('subtitle');
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle disabled stream type ordering', () => {
      baseArgs.inputs.streamTypes = '';
      const originalOrder = JSON.stringify(baseArgs.variables.ffmpegCommand.streams);

      const result = plugin(baseArgs);

      expect(JSON.stringify(result.variables.ffmpegCommand.streams)).toBe(originalOrder);
    });
  });

  describe('Channel Count Reordering', () => {
    it('should reorder audio streams by channel count', () => {
      const audioStreams = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          channels: 2,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'ac3',
          codec_type: 'audio',
          channels: 6,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
        {
          index: 2,
          codec_name: 'dts',
          codec_type: 'audio',
          channels: 8,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
          typeIndex: 2,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = audioStreams;
      baseArgs.inputs.channels = '7.1,5.1,2,1';
      baseArgs.inputs.processOrder = 'channels';

      const result = plugin(baseArgs);

      // 7.1 (8 channels) should come first, then 5.1 (6 channels), then 2 channels
      expect(result.variables.ffmpegCommand.streams[0].channels).toBe(8);
      expect(result.variables.ffmpegCommand.streams[1].channels).toBe(6);
      expect(result.variables.ffmpegCommand.streams[2].channels).toBe(2);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle streams without channel information', () => {
      const mixedStreams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          channels: 2,
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = mixedStreams;
      baseArgs.inputs.processOrder = 'channels';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Audio stream with 2 channels (matching '2' in the channels list) should come first
      expect(result.variables.ffmpegCommand.streams[0].codec_type).toBe('audio');
      expect(result.variables.ffmpegCommand.streams[0].channels).toBe(2);
      // Video stream without channels should come after
      expect(result.variables.ffmpegCommand.streams[1].codec_type).toBe('video');
    });

    it('should handle disabled channel ordering', () => {
      baseArgs.inputs.channels = '';
      const originalOrder = JSON.stringify(baseArgs.variables.ffmpegCommand.streams);

      const result = plugin(baseArgs);

      expect(JSON.stringify(result.variables.ffmpegCommand.streams)).toBe(originalOrder);
    });
  });

  describe('Language Reordering', () => {
    it('should reorder streams by language tags', () => {
      const streamsWithLangs = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          tags: { language: 'fre' },
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          tags: { language: 'eng' },
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
        {
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          tags: { language: 'spa' },
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
          typeIndex: 2,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = streamsWithLangs;
      baseArgs.inputs.languages = 'eng,fre,spa';
      baseArgs.inputs.processOrder = 'languages';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].tags?.language).toBe('eng');
      expect(result.variables.ffmpegCommand.streams[1].tags?.language).toBe('fre');
      expect(result.variables.ffmpegCommand.streams[2].tags?.language).toBe('spa');
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle streams without language tags', () => {
      const streamsWithoutLangs = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          tags: { language: 'eng' },
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = streamsWithoutLangs;
      baseArgs.inputs.languages = 'eng';
      baseArgs.inputs.processOrder = 'languages';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Stream with language should be reordered to front
      expect(result.variables.ffmpegCommand.streams[0].tags?.language).toBe('eng');
    });

    it('should handle disabled language ordering', () => {
      baseArgs.inputs.languages = '';
      const originalOrder = JSON.stringify(baseArgs.variables.ffmpegCommand.streams);

      const result = plugin(baseArgs);

      expect(JSON.stringify(result.variables.ffmpegCommand.streams)).toBe(originalOrder);
    });
  });

  describe('Codec Reordering', () => {
    it('should reorder streams by codec names', () => {
      const streamsWithCodecs = [
        {
          index: 0,
          codec_name: 'ac3',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
        {
          index: 2,
          codec_name: 'dts',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
          typeIndex: 2,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = streamsWithCodecs;
      baseArgs.inputs.codecs = 'aac,ac3,dts';
      baseArgs.inputs.processOrder = 'codecs';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams[0].codec_name).toBe('aac');
      expect(result.variables.ffmpegCommand.streams[1].codec_name).toBe('ac3');
      expect(result.variables.ffmpegCommand.streams[2].codec_name).toBe('dts');
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle disabled codec ordering', () => {
      baseArgs.inputs.codecs = '';
      const originalOrder = JSON.stringify(baseArgs.variables.ffmpegCommand.streams);

      const result = plugin(baseArgs);

      expect(JSON.stringify(result.variables.ffmpegCommand.streams)).toBe(originalOrder);
    });
  });

  describe('Complex Process Order', () => {
    it('should apply multiple reordering criteria in specified order', () => {
      const complexStreams = [
        {
          index: 0,
          codec_name: 'ac3',
          codec_type: 'audio',
          channels: 6,
          tags: { language: 'fre' },
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          channels: 2,
          tags: { language: 'eng' },
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
        {
          index: 2,
          codec_name: 'h264',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
          typeIndex: 2,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = complexStreams;
      baseArgs.inputs.processOrder = 'languages,streamTypes';
      baseArgs.inputs.languages = 'eng,fre';
      baseArgs.inputs.streamTypes = 'video,audio';

      const result = plugin(baseArgs);

      // Should process in order: languages first (eng, fre), then streamTypes (video, audio)
      // So expected order: video, eng audio, fre audio
      expect(result.variables.ffmpegCommand.streams[0].codec_type).toBe('video');
      expect(result.variables.ffmpegCommand.streams[1].tags?.language).toBe('eng');
      expect(result.variables.ffmpegCommand.streams[2].tags?.language).toBe('fre');
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle single process order item', () => {
      baseArgs.inputs.processOrder = 'streamTypes';
      baseArgs.inputs.streamTypes = 'video,audio';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams[0].codec_type).toBe('video');
    });
  });

  describe('Image Stream Handling', () => {
    it('should skip image streams due to ffmpeg bug', () => {
      const streamsWithImage = [
        {
          index: 0,
          codec_name: 'png',
          codec_long_name: 'PNG (Portable Network Graphics) image',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = streamsWithImage;
      baseArgs.inputs.processOrder = 'streamTypes';
      baseArgs.inputs.streamTypes = 'audio,video';

      const result = plugin(baseArgs);

      // Audio stream should be moved to front since it's in the streamTypes list
      // PNG stream should remain after due to ffmpeg bug handling (not moved)
      expect(result.variables.ffmpegCommand.streams[0].codec_name).toBe('aac');
      expect(result.variables.ffmpegCommand.streams[1].codec_name).toBe('png');
    });

    it('should skip streams with codec_long_name containing "image"', () => {
      const streamsWithImageLong = [
        {
          index: 0,
          codec_name: 'mjpeg',
          codec_long_name: 'Motion JPEG image',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
          typeIndex: 1,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = streamsWithImageLong;
      baseArgs.inputs.processOrder = 'streamTypes';
      baseArgs.inputs.streamTypes = 'audio,video';

      const result = plugin(baseArgs);

      // Audio stream should be moved to front since it's in the streamTypes list
      // MJPEG stream should remain after due to image handling (not moved)
      expect(result.variables.ffmpegCommand.streams[0].codec_name).toBe('aac');
      expect(result.variables.ffmpegCommand.streams[1].codec_name).toBe('mjpeg');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing ffmpegCommand initialization', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow('FFmpeg command plugins not used correctly');
    });

    it('should handle streams with missing codec_name', () => {
      const streamsWithMissingCodec = [
        {
          index: 0,
          codec_name: '',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:0'],
          typeIndex: 0,
        },
      ];

      baseArgs.variables.ffmpegCommand.streams = streamsWithMissingCodec;
      baseArgs.inputs.processOrder = 'codecs';
      baseArgs.inputs.codecs = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should not crash and handle gracefully
    });

    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams).toEqual([]);
    });
  });

  describe('Default Values', () => {
    it('should use default process order when not specified', () => {
      delete baseArgs.inputs.processOrder;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should not crash and use defaults from loadDefaultValues
    });

    it('should use default channel order when not specified', () => {
      delete baseArgs.inputs.channels;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should not crash and use defaults
    });

    it('should use default stream types when not specified', () => {
      delete baseArgs.inputs.streamTypes;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should not crash and use defaults
    });
  });
});
