import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkStreamsCount/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('checkStreamsCount Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: { streamType: 'audio', streamsTarget: '1' },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Plugin Details', () => {
    it('should provide selectable stream types', () => {
      const streamTypeInput = details().inputs.find((input) => input.name === 'streamType');
      const streamsTargetInput = details().inputs.find((input) => input.name === 'streamsTarget');

      expect(streamTypeInput?.inputUI.options).toEqual([
        'video',
        'audio',
        'subtitle',
        'attachment',
        'data',
      ]);
      expect(streamsTargetInput?.type).toBe('number');
      expect(streamsTargetInput?.inputUI.type).toBe('text');
    });
  });

  describe('Stream Count Detection', () => {
    it('should route to output 2 when the selected stream count equals the target', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 1 audio streams');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1 audio streams found');
    });

    it('should route to output 1 when the selected stream count is less than the target', () => {
      baseArgs.inputs.streamsTarget = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 2 audio streams');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1 audio streams found');
    });

    it('should route to output 3 when the selected stream count is more than the target', () => {
      baseArgs.inputFileObj.ffProbeData.streams?.push({
        index: 2,
        codec_name: 'ac3',
        codec_type: 'audio',
        sample_rate: '48000',
        channels: 6,
      });

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('2 audio streams found');
    });

    it('should count only the selected stream type among mixed stream types', () => {
      baseArgs.inputs.streamType = 'subtitle';
      baseArgs.inputs.streamsTarget = '2';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
        },
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
        },
        {
          index: 3,
          codec_name: 'ass',
          codec_type: 'subtitle',
        },
        {
          index: 4,
          codec_name: 'mjpeg',
          codec_type: 'attachment',
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('2 subtitle streams found');
    });

    it('should support attachment streams', () => {
      baseArgs.inputs.streamType = 'attachment';
      baseArgs.inputs.streamsTarget = '1';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
        },
        {
          index: 1,
          codec_name: 'ttf',
          codec_type: 'attachment',
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1 attachment streams found');
    });

    it('should handle zero selected streams', () => {
      baseArgs.inputs.streamType = 'data';
      baseArgs.inputs.streamsTarget = '0';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('0 data streams found');
    });

    it('should route empty stream arrays as less than a positive target', () => {
      baseArgs.inputs.streamsTarget = '1';
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('0 audio streams found');
    });
  });

  describe('Default Values', () => {
    it('should use the default stream type and target when inputs are empty', () => {
      baseArgs.inputs = {};
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 1 video streams');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1 video streams found');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when ffProbeData is missing', () => {
      (baseArgs.inputFileObj as Partial<typeof baseArgs.inputFileObj>).ffProbeData = undefined;

      expect(() => plugin(baseArgs)).toThrow('ffProbeData or ffProbeData.streams is not available.');
    });

    it('should throw error when ffProbeData.streams is missing', () => {
      (baseArgs.inputFileObj.ffProbeData as Partial<typeof baseArgs.inputFileObj.ffProbeData>).streams = undefined;

      expect(() => plugin(baseArgs)).toThrow('ffProbeData or ffProbeData.streams is not available.');
    });

    it('should throw error when stream data is not an array', () => {
      Object.assign(baseArgs.inputFileObj.ffProbeData, { streams: {} });

      expect(() => plugin(baseArgs)).toThrow('File has no valid stream data');
    });
  });
});
