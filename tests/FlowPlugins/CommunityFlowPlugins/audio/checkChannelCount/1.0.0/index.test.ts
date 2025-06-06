import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/audio/checkChannelCount/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('checkChannelCount Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: { channelCount: '2' },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Plugin Configuration', () => {
    it('should have correct plugin metadata', () => {
      const pluginDetails = details();

      expect(pluginDetails.name).toBe('Check Channel Count');
      expect(pluginDetails.description).toBe('Check streams for specified channel count');
      expect(pluginDetails.tags).toBe('audio');
      expect(pluginDetails.isStartPlugin).toBe(false);
      expect(pluginDetails.requiresVersion).toBe('2.11.01');
      expect(pluginDetails.icon).toBe('faQuestion');
    });

    it('should have correct input and output configuration', () => {
      const pluginDetails = details();

      expect(pluginDetails.inputs).toHaveLength(1);
      expect(pluginDetails.inputs[0]).toEqual({
        label: 'Channel Count',
        name: 'channelCount',
        type: 'number',
        defaultValue: '2',
        inputUI: {
          type: 'dropdown',
          options: ['1', '2', '3', '6', '8'],
        },
        tooltip: 'Specify channel count to check for',
      });

      expect(pluginDetails.outputs).toHaveLength(2);
      expect(pluginDetails.outputs).toEqual([
        { number: 1, tooltip: 'File has stream with specified channel count' },
        { number: 2, tooltip: 'File does not have stream with specified channel count' },
      ]);
    });
  });

  describe('Channel Count Detection', () => {
    it.each([
      {
        channels: 1, description: 'mono', sample: sampleAAC, modify: true,
      },
      {
        channels: 2, description: 'stereo', sample: sampleAAC, modify: false,
      },
      {
        channels: 6, description: '5.1 surround', sample: sampleH264, modify: false,
      },
    ])('should detect $description ($channels channel) audio', ({ channels, sample, modify }) => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sample)) as IFileObject;

      if (modify) {
        if (baseArgs.inputFileObj.ffProbeData.streams?.[1]) {
          baseArgs.inputFileObj.ffProbeData.streams[1].channels = channels;
        }
      }

      baseArgs.inputs.channelCount = channels.toString();

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Checking for ${channels} channels`);
    });

    it('should fail when channel count not found', () => {
      baseArgs.inputs.channelCount = '8';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 8 channels');
    });

    it('should check all streams and log channel counts', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      baseArgs.inputs.channelCount = '6';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 0 has undefined channels');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 1 has 6 channels');
    });
  });

  describe('Edge Cases', () => {
    it('should throw error when no streams exist', () => {
      delete baseArgs.inputFileObj.ffProbeData.streams;

      expect(() => plugin(baseArgs)).toThrow('File has no stream data');
    });

    it('should handle empty streams array', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle streams with undefined channel count', () => {
      baseArgs.inputFileObj.ffProbeData.streams = [{
        index: 0,
        codec_name: 'h264',
        codec_type: 'video',
        channels: undefined,
      }];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Stream 0 has undefined channels');
    });
  });
});
