import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveSubtitles/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264WithSubtitles = require('../../../../../sampleData/media/sampleH264_2.json');
const sampleH264MultipleSubtitles = require('../../../../../sampleData/media/sampleH264_3.json');

describe('ffmpegCommandRemoveSubtitles Plugin', () => {
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
              codec_name: 'subrip',
              codec_type: 'subtitle',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264WithSubtitles)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Subtitle Stream Removal', () => {
    it('should mark subtitle streams as removed', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);

      // Check that subtitle stream is marked as removed
      const subtitleStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'subtitle',
      );
      expect(subtitleStream?.removed).toBe(true);

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

    it('should handle multiple subtitle streams', () => {
      // Add another subtitle stream
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 3,
        codec_name: 'ass',
        codec_type: 'subtitle',
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:3'],
        inputArgs: [],
        outputArgs: [],
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that both subtitle streams are marked as removed
      const subtitleStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'subtitle',
      );
      expect(subtitleStreams).toHaveLength(2);
      expect(subtitleStreams[0].removed).toBe(true);
      expect(subtitleStreams[1].removed).toBe(true);
    });

    it('should not affect non-subtitle streams', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Count streams by type and removal status
      const { streams } = result.variables.ffmpegCommand;
      const removedStreams = streams.filter((stream) => stream.removed);
      const notRemovedStreams = streams.filter((stream) => !stream.removed);

      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].codec_type).toBe('subtitle');
      expect(notRemovedStreams).toHaveLength(2);
      expect(notRemovedStreams.find((s) => s.codec_type === 'video')).toBeDefined();
      expect(notRemovedStreams.find((s) => s.codec_type === 'audio')).toBeDefined();
    });

    it('should handle files with no subtitle streams', () => {
      // Remove subtitle stream from test setup
      baseArgs.variables.ffmpegCommand.streams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type !== 'subtitle',
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

  describe('Different Subtitle Codecs', () => {
    it.each([
      'subrip',
      'ass',
      'ssa',
      'webvtt',
      'mov_text',
      'dvd_subtitle',
      'hdmv_pgs_subtitle',
    ])('should remove %s subtitle streams', (codec) => {
      baseArgs.variables.ffmpegCommand.streams[2].codec_name = codec;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      const subtitleStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'subtitle',
      );
      expect(subtitleStream?.removed).toBe(true);
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
    it('should handle already removed subtitle streams', () => {
      // Pre-mark a subtitle stream as removed
      const subtitleStreamIndex = baseArgs.variables.ffmpegCommand.streams.findIndex(
        (stream) => stream.codec_type === 'subtitle',
      );
      baseArgs.variables.ffmpegCommand.streams[subtitleStreamIndex].removed = true;

      // Add another subtitle stream
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 3,
        codec_name: 'ass',
        codec_type: 'subtitle',
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:3'],
        inputArgs: [],
        outputArgs: [],
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Both subtitle streams should be marked as removed
      const subtitleStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'subtitle',
      );
      expect(subtitleStreams).toHaveLength(2);
      expect(subtitleStreams[0].removed).toBe(true);
      expect(subtitleStreams[1].removed).toBe(true);
    });

    it('should handle mixed case codec types', () => {
      // Test with uppercase codec_type (edge case)
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 3,
        codec_name: 'subrip',
        codec_type: 'SUBTITLE' as 'subtitle',
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:3'],
        inputArgs: [],
        outputArgs: [],
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Only lowercase 'subtitle' should be removed
      const subtitleStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'subtitle',
      );
      const uppercaseStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'SUBTITLE',
      );

      expect(subtitleStreams[0].removed).toBe(true);
      expect(uppercaseStream?.removed).toBe(false);
    });

    it('should preserve all other stream properties', () => {
      const originalStream = JSON.parse(JSON.stringify(baseArgs.variables.ffmpegCommand.streams[2]));

      const result = plugin(baseArgs);

      const modifiedStream = result.variables.ffmpegCommand.streams[2];

      // All properties should be preserved except 'removed'
      expect(modifiedStream.index).toBe(originalStream.index);
      expect(modifiedStream.codec_name).toBe(originalStream.codec_name);
      expect(modifiedStream.codec_type).toBe(originalStream.codec_type);
      expect(modifiedStream.forceEncoding).toBe(originalStream.forceEncoding);
      expect(modifiedStream.mapArgs).toEqual(originalStream.mapArgs);
      expect(modifiedStream.inputArgs).toEqual(originalStream.inputArgs);
      expect(modifiedStream.outputArgs).toEqual(originalStream.outputArgs);
      // Only 'removed' should be different
      expect(modifiedStream.removed).toBe(true);
      expect(originalStream.removed).toBe(false);
    });
  });

  describe('Real World Scenarios', () => {
    it('should handle file with actual subtitle streams from sample data', () => {
      // Use actual sample data structure
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264WithSubtitles));

      // Initialize ffmpegCommand streams based on actual file data
      baseArgs.variables.ffmpegCommand.streams = sampleH264WithSubtitles.ffProbeData.streams.map((
        stream: { index: number; codec_name: string; codec_type: string },
      ) => ({
        index: stream.index,
        codec_name: stream.codec_name,
        codec_type: stream.codec_type,
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', `0:${stream.index}`],
        inputArgs: [],
        outputArgs: [],
      }));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that subtitle streams are removed
      const subtitleStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'subtitle',
      );
      expect(subtitleStreams.length).toBeGreaterThan(0);
      subtitleStreams.forEach((stream) => {
        expect(stream.removed).toBe(true);
      });

      // Check that non-subtitle streams are not removed
      const nonSubtitleStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type !== 'subtitle',
      );
      nonSubtitleStreams.forEach((stream) => {
        expect(stream.removed).toBe(false);
      });
    });

    it('should handle file with multiple subtitle streams', () => {
      // Use sample with multiple subtitle streams
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264MultipleSubtitles));

      // Initialize ffmpegCommand streams based on actual file data
      baseArgs.variables.ffmpegCommand.streams = sampleH264MultipleSubtitles.ffProbeData.streams.map((
        stream: { index: number; codec_name: string; codec_type: string },
      ) => ({
        index: stream.index,
        codec_name: stream.codec_name,
        codec_type: stream.codec_type,
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', `0:${stream.index}`],
        inputArgs: [],
        outputArgs: [],
      }));

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Verify multiple subtitle streams are all removed
      const subtitleStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.codec_type === 'subtitle',
      );

      expect(subtitleStreams.length).toBeGreaterThanOrEqual(2);
      subtitleStreams.forEach((stream) => {
        expect(stream.removed).toBe(true);
      });
    });
  });
});
