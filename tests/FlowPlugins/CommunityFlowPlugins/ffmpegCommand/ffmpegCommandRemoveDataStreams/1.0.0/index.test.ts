import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveDataStreams/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandRemoveDataStreams Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              removed: false,
              forceEncoding: false,
              mapArgs: ['-map', '0:0'],
              inputArgs: [],
              outputArgs: [],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              removed: false,
              forceEncoding: false,
              mapArgs: ['-map', '0:1'],
              inputArgs: [],
              outputArgs: [],
            },
            {
              index: 2,
              codec_name: 'bin_data',
              codec_type: 'data',
              removed: false,
              forceEncoding: false,
              mapArgs: ['-map', '0:2'],
              inputArgs: [],
              outputArgs: [],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      } as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Stream Removal', () => {
    it('should mark data streams as removed', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);

      // Check that data stream is marked as removed
      const dataStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'data',
      );
      expect(dataStream?.removed).toBe(true);

      // Check that video and audio streams are not marked as removed
      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'video',
      );
      const audioStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'audio',
      );
      expect(videoStream?.removed).toBe(false);
      expect(audioStream?.removed).toBe(false);
    });

    it('should handle multiple data streams', () => {
      // Add another data stream
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 3,
        codec_name: 'timed_id3',
        codec_type: 'data',
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:3'],
        inputArgs: [],
        outputArgs: [],
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that both data streams are marked as removed
      const dataStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'data',
      );
      expect(dataStreams).toHaveLength(2);
      expect(dataStreams[0].removed).toBe(true);
      expect(dataStreams[1].removed).toBe(true);
    });

    it('should not affect non-data streams', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Count streams by type and removal status
      const { streams } = result.variables.ffmpegCommand;
      const removedStreams = streams.filter((stream) => stream.removed);
      const notRemovedStreams = streams.filter((stream) => !stream.removed);

      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].codec_type).toBe('data');
      expect(notRemovedStreams).toHaveLength(2);
      expect(notRemovedStreams.find((s) => s.codec_type === 'video')).toBeDefined();
      expect(notRemovedStreams.find((s) => s.codec_type === 'audio')).toBeDefined();
    });

    it('should handle files with no data streams', () => {
      // Remove data stream from test setup
      baseArgs.variables.ffmpegCommand.streams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type !== 'data',
      );

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);

      // No streams should be marked as removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(0);
    });

    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.streams).toHaveLength(0);
    });
  });

  describe('FFmpeg Command Initialization', () => {
    it('should throw error when ffmpegCommand is not initialized', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });

    it('should throw error when ffmpegCommand is undefined', () => {
      (baseArgs.variables as Partial<IpluginInputArgs['variables']>).ffmpegCommand = undefined;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });
  });

  describe('Plugin Output Structure', () => {
    it('should return correct output structure and preserve references', () => {
      const result = plugin(baseArgs);

      expect(result).toHaveProperty('outputFileObj');
      expect(result).toHaveProperty('outputNumber');
      expect(result).toHaveProperty('variables');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });
  });

  describe('Edge Cases', () => {
    it('should handle already removed data streams and case sensitivity', () => {
      // Pre-mark a data stream as removed
      const dataStreamIndex = baseArgs.variables.ffmpegCommand.streams.findIndex(
        (stream) => stream.codec_type === 'data',
      );
      baseArgs.variables.ffmpegCommand.streams[dataStreamIndex].removed = true;

      // Add stream with different case
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 3,
        codec_name: 'metadata',
        codec_type: 'DATA' as 'data',
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:3'],
        inputArgs: [],
        outputArgs: [],
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Data stream should still be marked as removed
      const dataStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'data',
      );
      expect(dataStream?.removed).toBe(true);

      // Only the lowercase 'data' stream should be removed
      const upperCaseStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'DATA',
      );
      expect(upperCaseStream?.removed).toBe(false);
    });
  });
});
