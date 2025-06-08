import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandStart/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('ffmpegCommandStart Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it('should initialize ffmpeg command structure with video file', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand).toBeDefined();
      expect(result.variables.ffmpegCommand.init).toBe(true);
      expect(result.variables.ffmpegCommand.container).toBe('mp4');
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.hardwareDecoding).toBe(false);
    });

    it('should initialize ffmpeg command structure with audio file', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand).toBeDefined();
      expect(result.variables.ffmpegCommand.init).toBe(true);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
    });

    it('should map all streams correctly', () => {
      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams).toHaveLength(2);
      expect(result.variables.ffmpegCommand.streams[0]).toMatchObject({
        index: 0,
        codec_name: 'h264',
        codec_type: 'video',
        removed: false,
        mapArgs: ['-map', '0:0'],
        inputArgs: [],
        outputArgs: [],
      });
      expect(result.variables.ffmpegCommand.streams[1]).toMatchObject({
        index: 1,
        codec_name: 'aac',
        codec_type: 'audio',
        removed: false,
        mapArgs: ['-map', '0:1'],
        inputArgs: [],
        outputArgs: [],
      });
    });

    it('should initialize empty arrays for command arguments', () => {
      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.inputFiles).toEqual([]);
      expect(result.variables.ffmpegCommand.overallInputArguments).toEqual([]);
      expect(result.variables.ffmpegCommand.overallOuputArguments).toEqual([]);
    });
  });

  describe('Stream Mapping', () => {
    it('should preserve all stream properties', () => {
      const result = plugin(baseArgs);
      const originalStreams = baseArgs.inputFileObj.ffProbeData.streams || [];
      const mappedStreams = result.variables.ffmpegCommand.streams;

      expect(mappedStreams).toHaveLength(originalStreams.length);

      mappedStreams.forEach((stream, index) => {
        expect(stream.index).toBe(originalStreams[index].index);
        expect(stream.codec_name).toBe(originalStreams[index].codec_name);
        expect(stream.codec_type).toBe(originalStreams[index].codec_type);
        expect(stream.removed).toBe(false);
        expect(stream.mapArgs).toEqual(['-map', `0:${originalStreams[index].index}`]);
        expect(stream.inputArgs).toEqual([]);
        expect(stream.outputArgs).toEqual([]);
      });
    });

    it('should handle audio file with multiple streams correctly', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams).toHaveLength(2);
      expect(result.variables.ffmpegCommand.streams[0]).toMatchObject({
        index: 0,
        codec_name: 'mp3',
        codec_type: 'audio',
        removed: false,
        mapArgs: ['-map', '0:0'],
      });
      expect(result.variables.ffmpegCommand.streams[1]).toMatchObject({
        index: 1,
        codec_name: 'mp3',
        codec_type: 'audio',
        removed: false,
        mapArgs: ['-map', '0:1'],
      });
    });

    it('should handle files with multiple streams of same type', () => {
      // Create test file with multiple audio streams
      const multiAudioFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (multiAudioFile.ffProbeData.streams) {
        multiAudioFile.ffProbeData.streams.push({
          index: 2,
          codec_name: 'ac3',
          codec_type: 'audio',
          bit_rate: 192000,
          channels: 6,
          sample_rate: '48000',
        });
      }

      baseArgs.inputFileObj = multiAudioFile;

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams).toHaveLength(3);
      expect(result.variables.ffmpegCommand.streams[2]).toMatchObject({
        index: 2,
        codec_name: 'ac3',
        codec_type: 'audio',
        removed: false,
        mapArgs: ['-map', '0:2'],
      });
    });
  });

  describe('Container Detection', () => {
    it('should detect MKV container from H264 sample', () => {
      const result = plugin(baseArgs);
      expect(result.variables.ffmpegCommand.container).toBe('mp4');
    });

    it('should detect MKV container from MP3 sample', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      const result = plugin(baseArgs);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
    });

    it('should detect MKV container from AAC sample', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleAAC)) as IFileObject;
      const result = plugin(baseArgs);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when streams is not an array (string)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseArgs.inputFileObj.ffProbeData.streams = 'invalid_json' as any;

      expect(() => plugin(baseArgs)).toThrow();
    });

    it('should throw error when streams is null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseArgs.inputFileObj.ffProbeData.streams = null as any;

      expect(() => plugin(baseArgs)).toThrow();
    });

    it('should throw error when streams is undefined', () => {
      delete baseArgs.inputFileObj.ffProbeData.streams;

      expect(() => plugin(baseArgs)).toThrow();
    });

    it('should handle empty streams array', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams).toEqual([]);
    });

    it('should handle case where ffProbeData is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.inputFileObj as any).ffProbeData = undefined;

      expect(() => plugin(baseArgs)).toThrow();
    });
  });

  describe('Variable Persistence', () => {
    it('should preserve existing variables', () => {
      baseArgs.variables = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ffmpegCommand: {} as any,
        flowFailed: false,
        user: { testVar: 'testValue' },
        queueTags: 'test',
      };

      const result = plugin(baseArgs);

      expect(result.variables.user).toEqual({ testVar: 'testValue' });
      expect(result.variables.queueTags).toBe('test');
      expect(result.variables.flowFailed).toBe(false);
    });

    it('should overwrite existing ffmpegCommand variable', () => {
      baseArgs.variables = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ffmpegCommand: { init: false, container: 'old' } as any,
        flowFailed: false,
        user: {},
      };

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.init).toBe(true);
      expect(result.variables.ffmpegCommand.container).toBe('mp4');
    });
  });

  describe('Integration with Different File Types', () => {
    it('should work with complex video files', () => {
      const complexFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      // Add subtitle stream
      if (complexFile.ffProbeData.streams) {
        complexFile.ffProbeData.streams.push({
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
          tags: { language: 'eng' },
        });
      }

      baseArgs.inputFileObj = complexFile;

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams).toHaveLength(3);
      expect(result.variables.ffmpegCommand.streams[2]).toMatchObject({
        index: 2,
        codec_name: 'subrip',
        codec_type: 'subtitle',
        removed: false,
        mapArgs: ['-map', '0:2'],
      });
    });

    it('should handle high stream count files', () => {
      const multiStreamFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;

      // Add multiple streams
      if (multiStreamFile.ffProbeData.streams) {
        for (let i = 2; i < 10; i += 1) {
          multiStreamFile.ffProbeData.streams.push({
            index: i,
            codec_name: 'aac',
            codec_type: 'audio',
            tags: { language: `lang${i}` },
          });
        }
      }

      baseArgs.inputFileObj = multiStreamFile;

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.streams).toHaveLength(10);

      // Check that all streams are mapped correctly
      result.variables.ffmpegCommand.streams.forEach((stream, index) => {
        expect(stream.index).toBe(index);
        expect(stream.mapArgs).toEqual(['-map', `0:${index}`]);
        expect(stream.removed).toBe(false);
      });
    });
  });
});
