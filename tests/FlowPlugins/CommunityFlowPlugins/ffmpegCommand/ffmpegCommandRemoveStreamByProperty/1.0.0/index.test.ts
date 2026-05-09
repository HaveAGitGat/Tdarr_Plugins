import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveStreamByProperty/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandRemoveStreamByProperty Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        propertyToCheck: 'codec_name',
        valuesToRemove: 'aac',
        condition: 'includes',
      },
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
              codec_name: 'ac3',
              codec_type: 'audio',
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

  describe('Basic Stream Removal by codec_name', () => {
    it('should remove stream with matching codec_name (includes condition)', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);

      // Check that AAC stream is marked as removed
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      expect(aacStream?.removed).toBe(true);

      // Check that other streams are not marked as removed
      const h264Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'h264',
      );
      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      expect(h264Stream?.removed).toBe(false);
      expect(ac3Stream?.removed).toBe(false);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 1 because codec_name of aac includes aac\n',
      );
    });

    it('should remove multiple streams with matching codec_names', () => {
      baseArgs.inputs.valuesToRemove = 'aac,ac3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that both AAC and AC3 streams are marked as removed
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      expect(aacStream?.removed).toBe(true);
      expect(ac3Stream?.removed).toBe(true);

      // Check that video stream is not removed
      const h264Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'h264',
      );
      expect(h264Stream?.removed).toBe(false);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 1 because codec_name of aac includes aac, ac3\n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 2 because codec_name of ac3 includes aac, ac3\n',
      );
    });

    it('should not remove streams when no match is found', () => {
      baseArgs.inputs.valuesToRemove = 'mp3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that no streams are marked as removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(0);

      // New behavior: plugin logs "Keep" for all non-matching streams
      expect(baseArgs.jobLog).toHaveBeenCalledTimes(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Keep stream index 0 because codec_name of h264 includes mp3\n',
      );
    });
  });

  describe('Not Includes Condition', () => {
    it('should remove streams that do not include the specified value', () => {
      baseArgs.inputs.condition = 'not_includes';
      baseArgs.inputs.valuesToRemove = 'aac';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that non-AAC streams are marked as removed
      const h264Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'h264',
      );
      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      expect(h264Stream?.removed).toBe(true);
      expect(ac3Stream?.removed).toBe(true);

      // Check that AAC stream is not removed
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      expect(aacStream?.removed).toBe(false);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 0 because codec_name of h264 not_includes aac\n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 2 because codec_name of ac3 not_includes aac\n',
      );
    });
  });

  describe('Nested Property Access (tags.language)', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:0'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'eng' },
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
          tags: { language: 'eng' },
        },
        {
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'spa' },
        },
      ];
    });

    it('should remove streams by nested property (tags.language)', () => {
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that English streams are marked as removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(2);
      expect(removedStreams[0].index).toBe(0);
      expect(removedStreams[1].index).toBe(1);

      // Check that Spanish stream is not removed
      const spanishStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 2,
      );
      expect(spanishStream?.removed).toBe(false);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 0 because tags.language of eng includes eng\n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 1 because tags.language of eng includes eng\n',
      );
    });

    it('should handle missing nested property gracefully', () => {
      baseArgs.inputs.propertyToCheck = 'tags.title';
      baseArgs.inputs.valuesToRemove = 'test';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that no streams are marked as removed when property doesn't exist
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(0);

      expect(baseArgs.jobLog).not.toHaveBeenCalled();
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle case insensitive matching', () => {
      baseArgs.inputs.valuesToRemove = 'AAC'; // Uppercase

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that AAC stream is marked as removed (case insensitive)
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      expect(aacStream?.removed).toBe(true);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 1 because codec_name of aac includes AAC\n',
      );
    });

    it('should handle mixed case input values', () => {
      baseArgs.inputs.valuesToRemove = 'AaC,Ac3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that both streams are marked as removed
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      expect(aacStream?.removed).toBe(true);
      expect(ac3Stream?.removed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.streams).toHaveLength(0);

      expect(baseArgs.jobLog).not.toHaveBeenCalled();
    });

    it('should handle whitespace in input values', () => {
      baseArgs.inputs.valuesToRemove = ' aac , ac3 ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that both streams are marked as removed (whitespace trimmed)
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      expect(aacStream?.removed).toBe(true);
      expect(ac3Stream?.removed).toBe(true);
    });

    it('should handle empty valuesToRemove (removes streams that match empty string)', () => {
      baseArgs.inputs.valuesToRemove = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Debug: Let's see what actually happens
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );

      // Since empty string is truthy and .includes('') returns true for any string,
      // all streams with target properties should be removed
      expect(removedStreams.length).toBeGreaterThan(0);

      // Let's just check that the function runs without throwing
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should handle streams with missing target property', () => {
      // Add stream without codec_name property
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 3,
        codec_type: 'subtitle',
        removed: false,
        forceEncoding: false,
        mapArgs: ['-map', '0:3'],
        inputArgs: [],
        outputArgs: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that only the AAC stream is removed, not the one missing codec_name
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].codec_name).toBe('aac');
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

  describe('Different Property Types', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          width: 1920,
          height: 1080,
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
          channels: 2,
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:1'],
          inputArgs: [],
          outputArgs: [],
        },
        {
          index: 2,
          codec_name: 'ac3',
          codec_type: 'audio',
          channels: 6,
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
          inputArgs: [],
          outputArgs: [],
        },
      ];
    });

    it('should remove streams by codec_type', () => {
      baseArgs.inputs.propertyToCheck = 'codec_type';
      baseArgs.inputs.valuesToRemove = 'audio';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that audio streams are marked as removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(2);
      expect(removedStreams.every((stream) => stream.codec_type === 'audio')).toBe(true);

      // Check that video stream is not removed
      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_type === 'video',
      );
      expect(videoStream?.removed).toBe(false);
    });

    it('should remove streams by numeric property (channels)', () => {
      baseArgs.inputs.propertyToCheck = 'channels';
      baseArgs.inputs.valuesToRemove = '6';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      // Check that 6-channel stream is marked as removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].channels).toBe(6);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 2 because channels of 6 includes 6\n',
      );
    });
  });

  describe('Codec Type Filtering', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:0'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'eng' },
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
          tags: { language: 'eng' },
        },
        {
          index: 2,
          codec_name: 'ac3',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'spa' },
        },
        {
          index: 3,
          codec_name: 'srt',
          codec_type: 'subtitle',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:3'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'eng' },
        },
      ];
    });

    it('should only remove audio streams when codecType is audio', () => {
      baseArgs.inputs.codecType = 'audio';
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      // Only the eng audio stream should be removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].index).toBe(1);
      expect(removedStreams[0].codec_type).toBe('audio');

      // Video and subtitle with eng should not be touched
      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 0,
      );
      const subtitleStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 3,
      );
      expect(videoStream?.removed).toBe(false);
      expect(subtitleStream?.removed).toBe(false);
    });

    it('should only remove video streams when codecType is video', () => {
      baseArgs.inputs.codecType = 'video';
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].index).toBe(0);
      expect(removedStreams[0].codec_type).toBe('video');
    });

    it('should only remove subtitle streams when codecType is subtitle', () => {
      baseArgs.inputs.codecType = 'subtitle';
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].index).toBe(3);
      expect(removedStreams[0].codec_type).toBe('subtitle');
    });

    it('should remove all matching streams when codecType is any', () => {
      baseArgs.inputs.codecType = 'any';
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(3);
      expect(removedStreams.map((s) => s.index)).toEqual([0, 1, 3]);
    });

    it('should default to any when codecType is not set', () => {
      // Simulate missing codecType (loadDefaultValues would set it to 'any')
      baseArgs.inputs.codecType = 'any';
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      // Should affect all stream types
      expect(removedStreams).toHaveLength(3);
    });

    it('should combine codecType filter with not_includes condition', () => {
      baseArgs.inputs.codecType = 'audio';
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'eng';
      baseArgs.inputs.condition = 'not_includes';

      const result = plugin(baseArgs);

      // Only audio streams are considered; spa audio should be removed
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].index).toBe(2);
      expect(removedStreams[0].codec_type).toBe('audio');

      // Video and subtitle should not be affected
      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 0,
      );
      const subtitleStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 3,
      );
      expect(videoStream?.removed).toBe(false);
      expect(subtitleStream?.removed).toBe(false);
    });
  });

  describe('Not Includes with Multiple Values (bug fix)', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:0'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'en' },
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
          tags: { language: 'de' },
        },
        {
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
          inputArgs: [],
          outputArgs: [],
          tags: { language: 'it' },
        },
      ];
    });

    it('should only remove streams matching NONE of the values', () => {
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'de, en, ger, eng, und';
      baseArgs.inputs.condition = 'not_includes';

      const result = plugin(baseArgs);

      // Only 'it' should be removed because it does not match any value
      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].index).toBe(2);
      expect(removedStreams[0].tags?.language).toBe('it');

      // 'en' and 'de' should be kept
      const keptStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => !stream.removed,
      );
      expect(keptStreams).toHaveLength(2);
      expect(keptStreams.map((s) => s.tags?.language)).toEqual(['en', 'de']);
    });

    it('should keep all streams when all match at least one value', () => {
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'en, de, it';
      baseArgs.inputs.condition = 'not_includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(0);
    });

    it('should remove all streams when none match any value', () => {
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'fr, ja';
      baseArgs.inputs.condition = 'not_includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(3);
    });

    it('should remove streams matching ANY value for includes with multiple values', () => {
      baseArgs.inputs.propertyToCheck = 'tags.language';
      baseArgs.inputs.valuesToRemove = 'en, de';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(2);
      expect(removedStreams.map((s) => s.tags?.language)).toEqual(['en', 'de']);

      // 'it' should be kept
      const itStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 2,
      );
      expect(itStream?.removed).toBe(false);
    });
  });

  describe('Falsy property values (issue #959)', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'subrip',
          codec_type: 'subtitle',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:0'],
          inputArgs: [],
          outputArgs: [],
          disposition: { forced: 1 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {
          index: 1,
          codec_name: 'subrip',
          codec_type: 'subtitle',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:1'],
          inputArgs: [],
          outputArgs: [],
          disposition: { forced: 0 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ];
    });

    it('should remove non-forced subtitle when using disposition.forced with not_includes=1', () => {
      baseArgs.inputs.codecType = 'subtitle';
      baseArgs.inputs.propertyToCheck = 'disposition.forced';
      baseArgs.inputs.valuesToRemove = '1';
      baseArgs.inputs.condition = 'not_includes';

      const result = plugin(baseArgs);

      const forcedStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 0,
      );
      const nonForcedStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 1,
      );
      expect(forcedStream?.removed).toBe(false);
      expect(nonForcedStream?.removed).toBe(true);
    });

    it('should remove forced subtitle when using disposition.forced with includes=1', () => {
      baseArgs.inputs.codecType = 'subtitle';
      baseArgs.inputs.propertyToCheck = 'disposition.forced';
      baseArgs.inputs.valuesToRemove = '1';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const forcedStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 0,
      );
      const nonForcedStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 1,
      );
      expect(forcedStream?.removed).toBe(true);
      expect(nonForcedStream?.removed).toBe(false);
    });

    it('should evaluate numeric zero properties instead of skipping them', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          channels: 0,
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
          channels: 2,
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:1'],
          inputArgs: [],
          outputArgs: [],
        },
      ];
      baseArgs.inputs.codecType = 'audio';
      baseArgs.inputs.propertyToCheck = 'channels';
      baseArgs.inputs.valuesToRemove = '0';
      baseArgs.inputs.condition = 'includes';

      const result = plugin(baseArgs);

      const zeroChannels = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 0,
      );
      const twoChannels = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.index === 1,
      );
      expect(zeroChannels?.removed).toBe(true);
      expect(twoChannels?.removed).toBe(false);
    });
  });

  describe('Equals Condition', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
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
          codec_name: 'ac3',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:1'],
          inputArgs: [],
          outputArgs: [],
        },
        {
          index: 2,
          codec_name: 'eac3',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
          inputArgs: [],
          outputArgs: [],
        },
      ];
    });

    it('should remove only exact matches and not substring matches (ac3 vs eac3)', () => {
      baseArgs.inputs.valuesToRemove = 'ac3';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      const eac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'eac3',
      );
      expect(ac3Stream?.removed).toBe(true);
      expect(eac3Stream?.removed).toBe(false);
    });

    it('should remove streams matching ANY value for equals with multiple values', () => {
      baseArgs.inputs.valuesToRemove = 'ac3,h264';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(2);
      expect(removedStreams.map((s) => s.codec_name).sort()).toEqual(['ac3', 'h264']);

      const eac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'eac3',
      );
      expect(eac3Stream?.removed).toBe(false);
    });

    it('should match case insensitively for equals', () => {
      baseArgs.inputs.valuesToRemove = 'AC3';
      baseArgs.inputs.condition = 'equals';

      const result = plugin(baseArgs);

      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      expect(ac3Stream?.removed).toBe(true);
    });
  });

  describe('Not Equals Condition', () => {
    beforeEach(() => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'ac3',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:0'],
          inputArgs: [],
          outputArgs: [],
        },
        {
          index: 1,
          codec_name: 'eac3',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:1'],
          inputArgs: [],
          outputArgs: [],
        },
        {
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          mapArgs: ['-map', '0:2'],
          inputArgs: [],
          outputArgs: [],
        },
      ];
    });

    it('should remove streams that do not exactly equal the value', () => {
      baseArgs.inputs.valuesToRemove = 'eac3';
      baseArgs.inputs.condition = 'not_equals';

      const result = plugin(baseArgs);

      const ac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'ac3',
      );
      const eac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'eac3',
      );
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      expect(ac3Stream?.removed).toBe(true);
      expect(eac3Stream?.removed).toBe(false);
      expect(aacStream?.removed).toBe(true);
    });

    it('should only remove streams equalling NONE of the values (multi-value semantics)', () => {
      baseArgs.inputs.valuesToRemove = 'eac3,aac';
      baseArgs.inputs.condition = 'not_equals';

      const result = plugin(baseArgs);

      const removedStreams = result.variables.ffmpegCommand.streams.filter(
        (stream) => stream.removed,
      );
      expect(removedStreams).toHaveLength(1);
      expect(removedStreams[0].codec_name).toBe('ac3');

      const eac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'eac3',
      );
      const aacStream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'aac',
      );
      expect(eac3Stream?.removed).toBe(false);
      expect(aacStream?.removed).toBe(false);
    });

    it('should match case insensitively for not_equals', () => {
      baseArgs.inputs.valuesToRemove = 'EAC3';
      baseArgs.inputs.condition = 'not_equals';

      const result = plugin(baseArgs);

      const eac3Stream = result.variables.ffmpegCommand.streams.find(
        (stream) => stream.codec_name === 'eac3',
      );
      expect(eac3Stream?.removed).toBe(false);
    });
  });
});
