import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandEnsureAudioStream/1.0.0/index';
import { plugin as removeStreamByPropertyPlugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveStreamByProperty/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandEnsureAudioStream Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        audioEncoder: 'aac',
        language: 'en',
        channels: '2',
        enableBitrate: 'false',
        bitrate: '128k',
        enableSamplerate: 'false',
        samplerate: '48k',
      },
      variables: {
        ffmpegCommand: {
          init: true,
          shouldProcess: false,
          streams: JSON.parse(JSON.stringify(sampleH264.ffProbeData.streams.map(
            (stream: Record<string, unknown>, index: number) => ({
              ...stream,
              removed: false,
              outputArgs: [],
              inputArgs: [],
              index,
            }),
          ))),
        },
      } as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Audio Stream Addition', () => {
    it('should add AAC stereo stream when not present', () => {
      // Remove existing audio stream to test addition
      baseArgs.variables.ffmpegCommand.streams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type !== 'audio',
      );

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag und found. Skipping \n');

      const audioStreams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type === 'audio',
      );
      expect(audioStreams).toHaveLength(0);
    });

    it('should detect existing AAC stereo stream and not add duplicate', () => {
      // Mock a file that already has the desired stream
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'aac';
      baseArgs.variables.ffmpegCommand.streams[1].channels = 2;
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File already has und stream in aac, 2 channels \n');
    });

    it('should work with different audio encoders', () => {
      baseArgs.inputs.audioEncoder = 'ac3';
      baseArgs.variables.ffmpegCommand.streams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type !== 'audio',
      );

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(false);

      const audioStreams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type === 'audio',
      );
      expect(audioStreams).toHaveLength(0);
    });
  });

  describe('Language Matching', () => {
    it('should match streams with specific language tag', () => {
      baseArgs.inputs.language = 'en';
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'en' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding en stream in aac, 2 channels \n');
    });

    it('should fallback to undefined language when specified language not found', () => {
      baseArgs.inputs.language = 'fr';
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'en' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag fr found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'No streams with language tag und found. Skipping \n',
      );
    });

    it('should handle case-insensitive language matching', () => {
      baseArgs.inputs.language = 'EN';
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'en' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding en stream in aac, 2 channels \n');
    });
  });

  describe('Channel Count Logic', () => {
    it('should limit channels to highest available when requested channels exceed available', () => {
      baseArgs.inputs.channels = '8';
      baseArgs.variables.ffmpegCommand.streams[1].channels = 6; // 5.1 audio
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 8 is higher than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File already has und stream in aac, 6 channels \n');
    });

    it('should use requested channels when they are available', () => {
      baseArgs.inputs.channels = '2';
      baseArgs.variables.ffmpegCommand.streams[1].channels = 6; // 5.1 audio available
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'ac3'; // Different codec to force addition

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in aac, 2 channels \n');
    });

    it('should select stream with highest channel count when multiple streams available', () => {
      // Add another audio stream with fewer channels
      const lowerChannelStream = JSON.parse(JSON.stringify(baseArgs.variables.ffmpegCommand.streams[1]));
      lowerChannelStream.index = 2;
      lowerChannelStream.channels = 2;
      baseArgs.variables.ffmpegCommand.streams.push(lowerChannelStream);

      baseArgs.inputs.channels = '6';
      baseArgs.variables.ffmpegCommand.streams[1].channels = 6;
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };
      baseArgs.variables.ffmpegCommand.streams[2].tags = { language: 'und' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File already has und stream in aac, 6 channels \n');
    });
  });

  describe('Codec Name Mapping', () => {
    it('should map dca encoder to dts codec', () => {
      baseArgs.inputs.audioEncoder = 'dca';
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'dts';
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in dca, 2 channels \n');
    });

    it('should map libmp3lame encoder to mp3 codec', () => {
      baseArgs.inputs.audioEncoder = 'libmp3lame';
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'mp3';
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in libmp3lame, 2 channels \n');
    });

    it('should map libopus encoder to opus codec', () => {
      baseArgs.inputs.audioEncoder = 'libopus';
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'opus';
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in libopus, 2 channels \n');
    });
  });

  describe('Bitrate and Samplerate Options', () => {
    it('should add bitrate argument when enableBitrate is true', () => {
      baseArgs.inputs.enableBitrate = 'true';
      baseArgs.inputs.bitrate = '192k';
      baseArgs.inputs.language = 'und'; // Use the language that exists in sample
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'mp3'; // Different codec to force addition

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      const audioStreams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type === 'audio',
      );
      expect(audioStreams).toHaveLength(2); // Original + new one
      expect(audioStreams[1].outputArgs).toContain('-b:a:{outputTypeIndex}');
      expect(audioStreams[1].outputArgs).toContain('192k');
    });

    it('should add samplerate argument when enableSamplerate is true', () => {
      baseArgs.inputs.enableSamplerate = 'true';
      baseArgs.inputs.samplerate = '44100';
      baseArgs.inputs.language = 'und'; // Use the language that exists in sample
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'mp3'; // Different codec to force addition

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      const audioStreams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type === 'audio',
      );
      expect(audioStreams).toHaveLength(2); // Original + new one
      expect(audioStreams[1].outputArgs).toContain('-ar');
      expect(audioStreams[1].outputArgs).toContain('44100');
    });

    it('should add both bitrate and samplerate when both are enabled', () => {
      baseArgs.inputs.enableBitrate = 'true';
      baseArgs.inputs.bitrate = '320k';
      baseArgs.inputs.enableSamplerate = 'true';
      baseArgs.inputs.samplerate = '48000';
      baseArgs.inputs.language = 'und'; // Use the language that exists in sample
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'mp3'; // Different codec to force addition

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      const audioStreams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type === 'audio',
      );
      expect(audioStreams).toHaveLength(2); // Original + new one
      expect(audioStreams[1].outputArgs).toContain('-b:a:{outputTypeIndex}');
      expect(audioStreams[1].outputArgs).toContain('320k');
      expect(audioStreams[1].outputArgs).toContain('-ar');
      expect(audioStreams[1].outputArgs).toContain('48000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no audio streams', () => {
      baseArgs.variables.ffmpegCommand.streams = baseArgs.variables.ffmpegCommand.streams.filter(
        (stream: unknown) => (stream as { codec_type: string }).codec_type !== 'audio',
      );

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag und found. Skipping \n');
    });

    it('should handle streams without language tags', () => {
      delete baseArgs.variables.ffmpegCommand.streams[1].tags;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in aac, 2 channels \n');
    });

    it('should handle undefined language tags', () => {
      baseArgs.variables.ffmpegCommand.streams[1].tags = {};

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams with language tag en found. Skipping \n');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is <= than the highest available channel count (6). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in aac, 2 channels \n');
    });

    it('should handle mono to stereo conversion', () => {
      baseArgs.inputs.channels = '2';
      baseArgs.variables.ffmpegCommand.streams[1].channels = 1;
      baseArgs.variables.ffmpegCommand.streams[1].tags = { language: 'und' };
      baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'ac3'; // Different codec to force addition

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'The wanted channel count 2 is higher than the highest available channel count (1). \n',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Adding und stream in aac, 1 channels \n');
    });
  });

  describe('Different Audio Encoders', () => {
    const encoders = ['aac', 'ac3', 'eac3', 'dca', 'flac', 'libopus', 'mp2', 'libmp3lame', 'truehd'];

    encoders.forEach((encoder) => {
      it(`should work with ${encoder} encoder`, () => {
        baseArgs.inputs.audioEncoder = encoder;
        baseArgs.inputs.language = 'und'; // Use the language that exists in sample
        baseArgs.variables.ffmpegCommand.streams[1].codec_name = 'mp3'; // Different codec to force addition

        const result = plugin(baseArgs);

        expect(result.outputNumber).toBe(1);
        const audioStreams = baseArgs.variables.ffmpegCommand.streams.filter(
          (stream: unknown) => (stream as { codec_type: string }).codec_type === 'audio',
        );
        expect(audioStreams).toHaveLength(2); // Original + new one
        expect(audioStreams[1].outputArgs).toContain(encoder);
      });
    });
  });

  it('should keep a planned EAC3 stream when a downstream plugin removes DTS streams', () => {
    const { streams } = baseArgs.variables.ffmpegCommand;
    const sourceAudioStream = streams[1];
    sourceAudioStream.codec_name = 'dts';
    sourceAudioStream.tags = { language: 'eng' };
    baseArgs.inputs.audioEncoder = 'eac3';
    baseArgs.inputs.language = 'eng';
    baseArgs.inputs.channels = '2';

    plugin(baseArgs);
    const plannedStream = streams[2];

    baseArgs.inputs = {
      codecType: 'audio',
      propertyToCheck: 'codec_name',
      valuesToRemove: 'dts',
      condition: 'includes',
    };
    removeStreamByPropertyPlugin(baseArgs);

    expect(sourceAudioStream.removed).toBe(true);
    expect(plannedStream).toMatchObject({
      codec_name: 'eac3',
      channels: 2,
      removed: false,
    });
  });

  describe('Encoder Channel Limits', () => {
    const setupSource = (channels: number) => {
      const { streams } = baseArgs.variables.ffmpegCommand;
      streams[1].codec_name = 'dts';
      streams[1].channels = channels;
      streams[1].tags = { language: 'eng' };
      baseArgs.inputs.language = 'eng';
      return streams;
    };

    it('should reduce 8 channels to 6 for the eac3 encoder', () => {
      const streams = setupSource(8);
      baseArgs.inputs.audioEncoder = 'eac3';
      baseArgs.inputs.channels = '8';

      plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'eac3 supports at most 6 channels, reducing from 8. \n',
      );
      expect(streams[2]).toMatchObject({ codec_name: 'eac3', channels: 6 });
      expect(streams[2].outputArgs).toEqual(
        expect.arrayContaining(['-ac:{outputIndex}', '6']),
      );
    });

    it('should reduce 8 channels to 6 for the ac3 encoder', () => {
      const streams = setupSource(8);
      baseArgs.inputs.audioEncoder = 'ac3';
      baseArgs.inputs.channels = '8';

      plugin(baseArgs);

      expect(streams[2]).toMatchObject({ codec_name: 'ac3', channels: 6 });
    });

    it('should not reduce channels for encoders without a limit', () => {
      const streams = setupSource(8);
      baseArgs.inputs.audioEncoder = 'aac';
      baseArgs.inputs.channels = '8';

      plugin(baseArgs);

      expect(baseArgs.jobLog).not.toHaveBeenCalledWith(
        expect.stringContaining('supports at most'),
      );
      expect(streams[2]).toMatchObject({ codec_name: 'aac', channels: 8 });
    });

    it('should leave requests already within the encoder limit untouched', () => {
      const streams = setupSource(6);
      baseArgs.inputs.audioEncoder = 'eac3';
      baseArgs.inputs.channels = '6';

      plugin(baseArgs);

      expect(baseArgs.jobLog).not.toHaveBeenCalledWith(
        expect.stringContaining('supports at most'),
      );
      expect(streams[2]).toMatchObject({ codec_name: 'eac3', channels: 6 });
    });
  });

  describe('Removed Streams', () => {
    it('should ignore removed streams when looking for a source stream', () => {
      const { streams } = baseArgs.variables.ffmpegCommand;
      streams[1].tags = { language: 'eng' };
      streams[1].removed = true;
      baseArgs.inputs.language = 'eng';
      baseArgs.inputs.audioEncoder = 'eac3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'No streams with language tag eng found. Skipping \n',
      );
      expect(streams).toHaveLength(2);
    });

    it('should not treat a removed stream as already satisfying the requirement', () => {
      const { streams } = baseArgs.variables.ffmpegCommand;
      streams[1].codec_name = 'dts';
      streams[1].channels = 6;
      streams[1].tags = { language: 'eng' };
      streams.push({
        ...JSON.parse(JSON.stringify(streams[1])),
        index: 2,
        codec_name: 'aac',
        channels: 2,
        removed: true,
      });
      baseArgs.inputs.language = 'eng';
      baseArgs.inputs.audioEncoder = 'aac';
      baseArgs.inputs.channels = '2';

      plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Adding eng stream in aac, 2 channels \n',
      );
      expect(streams).toHaveLength(4);
      expect(streams[3]).toMatchObject({ codec_name: 'aac', channels: 2, removed: false });
    });
  });

  describe('Output Argument Scoping', () => {
    it('should scope -ac to the output stream index', () => {
      const { streams } = baseArgs.variables.ffmpegCommand;
      streams[1].codec_name = 'dts';
      streams[1].tags = { language: 'eng' };
      baseArgs.inputs.language = 'eng';
      baseArgs.inputs.channels = '2';

      plugin(baseArgs);

      expect(streams[2].outputArgs).toEqual(
        expect.arrayContaining(['-ac:{outputIndex}', '2']),
      );
      expect(streams[2].outputArgs).not.toContain('-ac');
    });
  });
});
