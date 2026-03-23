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
        'Removing stream index 1 because codec_name of aac includes aac\n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Removing stream index 2 because codec_name of ac3 includes ac3\n',
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

      expect(baseArgs.jobLog).not.toHaveBeenCalled();
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
        'Removing stream index 1 because codec_name of aac includes aac\n',
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
});
