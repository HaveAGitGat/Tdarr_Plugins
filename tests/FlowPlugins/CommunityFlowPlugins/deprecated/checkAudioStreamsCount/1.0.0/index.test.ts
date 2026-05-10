import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/deprecated/checkAudioStreamsCount/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('checkAudioStreamsCount Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: { audioStreamsTarget: '1' },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Plugin Details', () => {
    it('should use a plain number input for stream count', () => {
      const streamCountInput = details().inputs.find((input) => input.name === 'audioStreamsTarget');

      expect(streamCountInput?.type).toBe('number');
      expect(streamCountInput?.inputUI.type).toBe('text');
    });
  });

  describe('Audio Stream Count Detection', () => {
    it('should route to output 2 when the audio stream count equals the target', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 1 audio streams');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1 audio streams found');
    });

    it('should route to output 1 when the audio stream count is less than the target', () => {
      baseArgs.inputs.audioStreamsTarget = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 2 audio streams');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1 audio streams found');
    });

    it('should route to output 3 when the audio stream count is more than the target', () => {
      baseArgs.inputs.audioStreamsTarget = '1';
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

    it('should count only audio streams among mixed stream types', () => {
      baseArgs.inputs.audioStreamsTarget = '2';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          width: 1920,
          height: 1080,
        },
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          sample_rate: '48000',
          channels: 2,
        },
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
        },
        {
          index: 3,
          codec_name: 'ac3',
          codec_type: 'audio',
          sample_rate: '48000',
          channels: 6,
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('2 audio streams found');
    });

    it('should handle zero audio streams', () => {
      baseArgs.inputs.audioStreamsTarget = '0';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('0 audio streams found');
    });

    it('should route empty stream arrays as less than a positive target', () => {
      baseArgs.inputs.audioStreamsTarget = '1';
      baseArgs.inputFileObj.ffProbeData.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('0 audio streams found');
    });
  });

  describe('Default Values', () => {
    it('should use the default target of 1 when the input is empty', () => {
      baseArgs.inputs = {};

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking for 1 audio streams');
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
