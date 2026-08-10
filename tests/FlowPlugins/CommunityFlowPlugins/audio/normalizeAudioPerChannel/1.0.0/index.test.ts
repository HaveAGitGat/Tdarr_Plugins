import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/audio/normalizeAudioPerChannel/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn(),
  })),
}));

describe('normalizeAudioPerChannel Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCLI: { runCli: jest.Mock };

  const createMeasureResponse = (loudnormValues: Record<string, string>, exitCode = 0) => ({
    cliExitCode: exitCode,
    errorLogFull: exitCode === 0 ? [
      'Some other output',
      `[Parsed_loudnorm_0 @ 0x123456] ${JSON.stringify(loudnormValues)}`,
      'More output',
    ] : ['FFmpeg error occurred'],
  });

  const defaultLoudnorm = {
    input_i: '-16.42',
    input_tp: '-0.23',
    input_lra: '11.32',
    input_thresh: '-26.83',
    target_offset: '0.59',
  };

  const buildInputFileWithStreams = (audioChannelsList: number[]) => {
    const streams: object[] = [
      {
        index: 0,
        codec_type: 'video',
        codec_name: 'h264',
        channels: null,
      },
    ];
    audioChannelsList.forEach((channels, audioIdx) => {
      streams.push({
        index: audioIdx + 1,
        codec_type: 'audio',
        codec_name: 'aac',
        channels,
      });
    });
    return {
      ...JSON.parse(JSON.stringify(sampleH264)),
      _id: '/path/to/input/file.mkv',
      ffProbeData: { streams },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    mockCLI = { runCli: jest.fn() };
    CLI.mockImplementation(() => mockCLI);

    baseArgs = {
      inputs: {
        i: '-24.0',
        lraSurround: '15.0',
        lraStereo: '7.0',
        tp: '-2.0',
        bitrateStereo: '192',
        bitrateSurround: '384',
        maxGain: '15',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: buildInputFileWithStreams([6]),
      jobLog: jest.fn(),
      ffmpegPath: '/usr/bin/ffmpeg',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
      workDir: '/tmp/tdarr-workdir',
      deps: { fsextra: { ensureDirSync: jest.fn() } },
    } as unknown as IpluginInputArgs;
  });

  describe('Single surround track normalization', () => {
    it('should execute two-pass normalization for a single surround track', async () => {
      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(defaultLoudnorm))
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toMatch(/^\/tmp\/tdarr-workdir\/\d+\/file\.mkv$/);
      expect(mockCLI.runCli).toHaveBeenCalledTimes(2);
    });

    it('should use surround LRA and bitrate for a 6-channel track', async () => {
      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(defaultLoudnorm))
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      // Pass 1: should use surround LRA (15.0) and map 0:a:0
      const pass1Args = CLI.mock.calls[0][0].spawnArgs;
      expect(pass1Args).toContain('0:a:0');
      expect(pass1Args.join(' ')).toContain('LRA=15.0');

      // Pass 2: should use surround bitrate (384k)
      const pass2Args = CLI.mock.calls[1][0].spawnArgs;
      expect(pass2Args).toContain('384k');
      expect(pass2Args.join(' ')).toContain('LRA=15.0');
    });
  });

  describe('Single stereo track normalization', () => {
    it('should use stereo LRA and bitrate for a 2-channel track', async () => {
      baseArgs.inputFileObj = buildInputFileWithStreams([2]);

      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(defaultLoudnorm))
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      // Pass 1: should use stereo LRA (7.0)
      const pass1Args = CLI.mock.calls[0][0].spawnArgs;
      expect(pass1Args.join(' ')).toContain('LRA=7.0');

      // Pass 2: should use stereo bitrate (192k)
      const pass2Args = CLI.mock.calls[1][0].spawnArgs;
      expect(pass2Args).toContain('192k');
    });
  });

  describe('Multi-track normalization', () => {
    it('should process both stereo and surround tracks independently', async () => {
      // Two audio tracks: stereo (2ch) + surround (6ch)
      baseArgs.inputFileObj = buildInputFileWithStreams([2, 6]);

      const stereoLoudnorm = { ...defaultLoudnorm, input_i: '-18.00' };
      const surroundLoudnorm = { ...defaultLoudnorm, input_i: '-20.00' };

      mockCLI.runCli
        // pass 1 for track 0 (stereo)
        .mockResolvedValueOnce(createMeasureResponse(stereoLoudnorm))
        // pass 1 for track 1 (surround)
        .mockResolvedValueOnce(createMeasureResponse(surroundLoudnorm))
        // pass 2: apply normalization
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Expect 3 CLI calls: 2 measurement passes + 1 normalization pass
      expect(mockCLI.runCli).toHaveBeenCalledTimes(3);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      // Track 0 (stereo): should use LRA=7.0
      const track0Pass1Args = CLI.mock.calls[0][0].spawnArgs;
      expect(track0Pass1Args).toContain('0:a:0');
      expect(track0Pass1Args.join(' ')).toContain('LRA=7.0');

      // Track 1 (surround): should use LRA=15.0
      const track1Pass1Args = CLI.mock.calls[1][0].spawnArgs;
      expect(track1Pass1Args).toContain('0:a:1');
      expect(track1Pass1Args.join(' ')).toContain('LRA=15.0');

      // Pass 2 args should contain per-stream filter and bitrate selectors
      const pass2Args = CLI.mock.calls[2][0].spawnArgs;
      expect(pass2Args).toContain('-filter:a:0');
      expect(pass2Args).toContain('-filter:a:1');
      expect(pass2Args).toContain('-b:a:0');
      expect(pass2Args).toContain('-b:a:1');
      expect(pass2Args).toContain('192k');
      expect(pass2Args).toContain('384k');
    });
  });

  describe('Max gain protection', () => {
    it('should skip normalization for a track that requires too much gain', async () => {
      // input_i far below target → gain required will exceed maxGain=15
      const quietLoudnorm = { ...defaultLoudnorm, input_i: '-50.00' };

      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(quietLoudnorm))
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      // Pass 2 should copy the track instead of normalizing
      const pass2Args = CLI.mock.calls[1][0].spawnArgs;
      expect(pass2Args).toContain('-c:a:0');
      expect(pass2Args).toContain('copy');
      // Should NOT contain a filter for track 0
      expect(pass2Args).not.toContain('-filter:a:0');
    });

    it('should normalize tracks within maxGain and copy tracks that exceed it', async () => {
      baseArgs.inputFileObj = buildInputFileWithStreams([2, 6]);
      // Track 0 (stereo): gain = -24 - (-18) = 6 LU → within limit
      const stereoLoudnorm = { ...defaultLoudnorm, input_i: '-18.00' };
      // Track 1 (surround): gain = -24 - (-50) = 26 LU → exceeds limit of 15
      const surroundQuiet = { ...defaultLoudnorm, input_i: '-50.00' };

      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(stereoLoudnorm))
        .mockResolvedValueOnce(createMeasureResponse(surroundQuiet))
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      const pass2Args = CLI.mock.calls[2][0].spawnArgs;

      // Track 0 should be normalized (has -filter:a:0)
      expect(pass2Args).toContain('-filter:a:0');
      // Track 1 should be copied
      expect(pass2Args).toContain('-c:a:1');
      expect(pass2Args).toContain('copy');
      expect(pass2Args).not.toContain('-filter:a:1');
    });
  });

  describe('Bitrate input sanitization', () => {
    it('should strip trailing k from bitrate inputs to avoid 192kk output', async () => {
      baseArgs.inputs = {
        ...baseArgs.inputs,
        bitrateStereo: '192k',
        bitrateSurround: '384k',
      };
      baseArgs.inputFileObj = buildInputFileWithStreams([2, 6]);

      const stereoLoudnorm = { ...defaultLoudnorm, input_i: '-18.00' };
      const surroundLoudnorm = { ...defaultLoudnorm, input_i: '-20.00' };

      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(stereoLoudnorm))
        .mockResolvedValueOnce(createMeasureResponse(surroundLoudnorm))
        .mockResolvedValueOnce({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      const pass2Args = CLI.mock.calls[2][0].spawnArgs;

      // Should produce exactly 192k and 384k, not 192kk / 384kk
      expect(pass2Args).toContain('192k');
      expect(pass2Args).toContain('384k');
      const joinedArgs = pass2Args.join(' ');
      expect(joinedArgs).not.toContain('192kk');
      expect(joinedArgs).not.toContain('384kk');
    });
  });

  describe('No audio tracks', () => {
    it('should return input file unchanged when there are no audio streams', async () => {
      baseArgs.inputFileObj = {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: '/path/to/input/file.mkv',
        ffProbeData: {
          streams: [
            { index: 0, codec_type: 'video', codec_name: 'h264' },
          ],
        },
      };

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/path/to/input/file.mkv');
      expect(mockCLI.runCli).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No audio tracks found, skipping normalization');
    });
  });

  describe('Error handling', () => {
    it('should throw when pass 1 measurement fails', async () => {
      mockCLI.runCli.mockResolvedValueOnce({ cliExitCode: 1, errorLogFull: ['Error'] });

      await expect(plugin(baseArgs)).rejects.toThrow('FFmpeg measurement failed for audio track #0');
    });

    it('should throw when pass 2 normalization fails', async () => {
      mockCLI.runCli
        .mockResolvedValueOnce(createMeasureResponse(defaultLoudnorm))
        .mockResolvedValueOnce({ cliExitCode: 1, errorLogFull: ['Error'] });

      await expect(plugin(baseArgs)).rejects.toThrow('FFmpeg normalization failed');
    });

    it('should throw when loudnorm output is not found in pass 1', async () => {
      mockCLI.runCli.mockResolvedValueOnce({
        cliExitCode: 0,
        errorLogFull: ['Some output without loudnorm data'],
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Failed to find loudnorm data for track #0');
    });

    it('should throw when target_offset is missing from loudnorm output', async () => {
      mockCLI.runCli.mockResolvedValueOnce({
        cliExitCode: 0,
        errorLogFull: [
          '[Parsed_loudnorm_0 @ 0x123456] {"input_i": "-16.42", "input_lra": "11.32"}',
        ],
      });

      await expect(plugin(baseArgs)).rejects.toThrow(/Failed to find target_offset for track #0/);
    });
  });
});
