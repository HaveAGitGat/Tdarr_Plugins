import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/classic/runClassicTranscodePlugin/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the classic plugin runner
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/classicPlugins', () => ({
  runClassicPlugin: jest.fn(),
}));

// Mock the CLI utility
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

describe('runClassicTranscodePlugin 1.0.0', () => {
  let baseArgs: IpluginInputArgs;
  let mockRunClassicPlugin: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Ensure CLI mock is properly reset
    const mockCLI = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils').CLI;
    mockCLI.mockImplementation(() => ({
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
    }));

    mockRunClassicPlugin = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/classicPlugins').runClassicPlugin;

    baseArgs = {
      inputs: {
        pluginSourceId: 'Community:Tdarr_Plugin_MC93_Migz1FFMPEG',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      logOutcome: jest.fn(),
      deps: {
        parseArgsStringToArgv: jest.fn((str) => str.split(' ')),
        fsextra: {},
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        axios: {},
        os: {},
        configVars: {},
      },
      ffmpegPath: '/usr/bin/ffmpeg',
      handbrakePath: '/usr/bin/handbrake',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
    } as unknown as IpluginInputArgs;
  });

  describe('Successful Transcoding', () => {
    it.each([
      {
        name: 'FFmpeg',
        mockResult: {
          processFile: true,
          ffmpegMode: true,
          preset: '-c:v libx264 -crf 23,-c:a copy',
          container: 'mp4',
          transcodeSettingsLog: 'FFmpeg transcode settings applied',
        },
      },
      {
        name: 'HandBrake',
        mockResult: {
          processFile: true,
          handbrakeMode: true,
          preset: '--encoder x264 --quality 23',
          container: 'mp4',
          transcodeSettingsLog: 'HandBrake transcode settings applied',
        },
      },
    ])('should handle successful $name transcode', async ({ mockResult }) => {
      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(mockRunClassicPlugin).toHaveBeenCalledWith(baseArgs, 'transcode');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/tmp/output.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
    });
  });

  describe('Backwards Compatibility', () => {
    it.each([
      {
        name: 'handBrakeMode',
        oldProperty: 'handBrakeMode',
        newProperty: 'handbrakeMode',
        preset: '--encoder x264 --quality 23',
      },
      {
        name: 'FFmpegMode',
        oldProperty: 'FFmpegMode',
        newProperty: 'ffmpegMode',
        preset: '-c:v libx264 -crf 23,-c:a copy',
      },
    ])('should handle backwards compatibility for $name', async ({ oldProperty, newProperty, preset }) => {
      const mockResult = {
        processFile: true,
        [oldProperty]: true,
        preset,
        container: 'mp4',
        transcodeSettingsLog: 'Backwards compatibility test',
      } as Record<string, unknown>;

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      await plugin(baseArgs);

      expect(mockResult[newProperty]).toBe(true);
    });
  });

  describe('Custom CLI Configurations', () => {
    it('should handle custom CLI with array arguments', async () => {
      const mockResult = {
        processFile: true,
        custom: {
          cliPath: '/usr/bin/ffmpeg',
          args: ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4'],
          outputPath: '/tmp/custom_output.mp4',
        },
        preset: '',
        transcodeSettingsLog: 'Custom CLI configuration applied',
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/tmp/custom_output.mp4');
    });

    it('should handle custom CLI with string arguments', async () => {
      const mockResult = {
        processFile: true,
        custom: {
          cliPath: '/usr/bin/ffmpeg',
          args: '-i input.mp4 -c:v libx264 output.mp4',
          outputPath: '/tmp/custom_output.mp4',
        },
        preset: '',
        transcodeSettingsLog: 'Custom args as string',
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(
        '-i input.mp4 -c:v libx264 output.mp4',
        '',
        '',
      );
    });

    it.each([
      { cliPath: '/usr/bin/ffmpeg', expectedCli: 'ffmpeg' },
      { cliPath: '/usr/bin/handbrake', expectedCli: 'handbrake' },
      { cliPath: '/usr/bin/editready', expectedCli: 'editready' },
      { cliPath: '/usr/bin/av1an', expectedCli: 'av1an' },
    ])('should detect CLI type from custom cliPath: $expectedCli', async ({ cliPath, expectedCli }) => {
      const mockResult = {
        processFile: true,
        custom: {
          cliPath,
          args: ['--help'],
          outputPath: '/tmp/output.mp4',
        },
        preset: '',
        transcodeSettingsLog: 'Custom CLI detected',
      } as Record<string, unknown> & { cliToUse?: string };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      await plugin(baseArgs);

      expect(mockResult.cliToUse).toBe(expectedCli);
    });
  });

  describe('Error Handling', () => {
    it('should handle no result from classic plugin', async () => {
      mockRunClassicPlugin.mockResolvedValue({
        result: null,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'No result from classic plugin. Continuing to next flow plugin.',
      );
    });

    it('should handle plugin errors', async () => {
      const mockResult = {
        error: 'Plugin execution failed',
        processFile: true,
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Plugin /path/to/plugin failed: Plugin execution failed');
    });

    it('should handle processFile false', async () => {
      const mockResult = {
        processFile: false,
        transcodeSettingsLog: 'File does not need processing',
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should handle CLI execution failure', async () => {
      const mockResult = {
        processFile: true,
        ffmpegMode: true,
        preset: '-c:v libx264 -crf 23,-c:a copy',
        container: 'mp4',
        transcodeSettingsLog: 'FFmpeg transcode settings applied',
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      // Mock CLI failure
      const mockCLI = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils').CLI;
      mockCLI.mockImplementation(() => ({
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 1 }),
      }));

      await expect(plugin(baseArgs)).rejects.toThrow('Running /usr/bin/ffmpeg failed');
    });
  });

  describe('Container and Preset Handling', () => {
    it('should replace container extension correctly', async () => {
      const mockResult = {
        processFile: true,
        ffmpegMode: true,
        preset: '-c:v libx264 -crf 23,-c:a copy',
        container: 'mkv',
        transcodeSettingsLog: 'Container replacement test',
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/tmp/output.mkv');
    });

    it.each([
      {
        name: 'with <io> separator',
        preset: '-f mp4<io>-c:v libx264 -crf 23',
        expectedCalls: [
          ['-f mp4', '', ''],
          ['-c:v libx264 -crf 23', '', ''],
        ],
      },
      {
        name: 'without <io> separator',
        preset: '-f mp4,-c:v libx264 -crf 23',
        expectedCalls: [
          ['-f mp4', '', ''],
          ['-c:v libx264 -crf 23', '', ''],
        ],
      },
    ])('should handle preset $name', async ({ preset, expectedCalls }) => {
      const mockResult = {
        processFile: true,
        ffmpegMode: true,
        preset,
        container: 'mp4',
        transcodeSettingsLog: 'Preset handling test',
      };

      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expectedCalls.forEach((callArgs) => {
        expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(...callArgs);
      });
    });
  });
});
