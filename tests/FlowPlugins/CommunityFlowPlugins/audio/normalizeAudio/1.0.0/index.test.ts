import { plugin } from '../../../../../../FlowPluginsTs/CommunityFlowPlugins/audio/normalizeAudio/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn(),
  })),
}));

describe('normalizeAudio Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCLI: { runCli: jest.Mock };

  const createMockResponse = (loudnormValues: Record<string, string>, exitCode = 0) => ({
    cliExitCode: exitCode,
    errorLogFull: exitCode === 0 ? [
      'Some other output',
      `[Parsed_loudnorm_0 @ 0x123456] ${JSON.stringify(loudnormValues)}`,
      'More output',
    ] : ['FFmpeg error occurred'],
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    mockCLI = { runCli: jest.fn() };
    CLI.mockImplementation(() => mockCLI);

    baseArgs = {
      inputs: { i: '-23.0', lra: '7.0', tp: '-2.0' },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: '/path/to/input/file.mkv',
      },
      jobLog: jest.fn(),
      ffmpegPath: '/usr/bin/ffmpeg',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
      workDir: '/tmp/tdarr-workdir',
      deps: { fsextra: { ensureDirSync: jest.fn() } },
    } as unknown as IpluginInputArgs;
  });

  describe('Two-Pass Normalization', () => {
    it('should execute complete two-pass normalization with default parameters', async () => {
      const loudnormValues = {
        input_i: '-16.42',
        input_tp: '-0.23',
        input_lra: '11.32',
        input_thresh: '-26.83',
        target_offset: '0.59',
      };

      mockCLI.runCli
        .mockResolvedValueOnce(createMockResponse(loudnormValues))
        .mockResolvedValueOnce(createMockResponse({}, 0));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toMatch(/^\/tmp\/tdarr-workdir\/\d+\/file\.mkv$/);
      expect(mockCLI.runCli).toHaveBeenCalledTimes(2);

      // Verify first pass arguments
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      const firstCallArgs = CLI.mock.calls[0][0];
      expect(firstCallArgs.spawnArgs).toContain('-af');
      expect(firstCallArgs.spawnArgs).toContain('loudnorm=I=-23.0:LRA=7.0:TP=-2.0:print_format=json');

      // Verify second pass uses measured values
      const secondCallArgs = CLI.mock.calls[1][0];
      const loudnormFilter = secondCallArgs.spawnArgs.find((arg: string) => arg.includes('loudnorm='));
      expect(loudnormFilter).toContain('measured_i=-16.42');
      expect(loudnormFilter).toContain('linear=true');
      expect(secondCallArgs.spawnArgs).toContain('-c:a');
      expect(secondCallArgs.spawnArgs).toContain('aac');
    });

    it('should use custom loudnorm parameters', async () => {
      baseArgs.inputs = { i: '-16.0', lra: '11.0', tp: '-1.5' };

      mockCLI.runCli
        .mockResolvedValueOnce(createMockResponse({
          input_i: '-18.42',
          input_tp: '-2.23',
          input_lra: '9.32',
          input_thresh: '-28.83',
          target_offset: '1.59',
        }))
        .mockResolvedValueOnce(createMockResponse({}, 0));

      await plugin(baseArgs);

      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      const firstCallArgs = CLI.mock.calls[0][0];
      expect(firstCallArgs.spawnArgs).toContain('loudnorm=I=-16.0:LRA=11.0:TP=-1.5:print_format=json');
    });
  });

  describe('Error Handling', () => {
    it.each([
      {
        description: 'first pass fails',
        mockSetup: () => mockCLI.runCli.mockResolvedValueOnce(createMockResponse({}, 1)),
      },
      {
        description: 'second pass fails',
        mockSetup: () => mockCLI.runCli
          .mockResolvedValueOnce(createMockResponse({
            input_i: '-16.42', input_tp: '-0.23', input_lra: '11.32', input_thresh: '-26.83', target_offset: '0.59',
          }))
          .mockResolvedValueOnce(createMockResponse({}, 1)),
      },
    ])('should throw error when $description', async ({ mockSetup }) => {
      mockSetup();

      await expect(plugin(baseArgs)).rejects.toThrow('FFmpeg failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running FFmpeg failed');
    });

    it('should throw error when loudnorm output not found', async () => {
      mockCLI.runCli.mockResolvedValueOnce({
        cliExitCode: 0,
        errorLogFull: ['Some output without loudnorm data'],
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Failed to find loudnorm in report, please rerun');
    });

    it('should throw error when loudnorm JSON is malformed', async () => {
      mockCLI.runCli.mockResolvedValueOnce({
        cliExitCode: 0,
        errorLogFull: ['[Parsed_loudnorm_0 @ 0x123456] { malformed json'],
      });

      await expect(plugin(baseArgs)).rejects.toThrow();
    });
  });
});
