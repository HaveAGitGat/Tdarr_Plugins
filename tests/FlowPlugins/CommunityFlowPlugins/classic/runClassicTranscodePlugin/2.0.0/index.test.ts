import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/classic/runClassicTranscodePlugin/2.0.0/index';
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

describe('runClassicTranscodePlugin 2.0.0', () => {
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

  describe('Dual Output Behavior', () => {
    it.each([
      {
        scenario: 'processing done',
        mockResult: {
          processFile: true,
          ffmpegMode: true,
          preset: '-c:v libx264 -crf 23,-c:a copy',
          container: 'mp4',
          transcodeSettingsLog: 'FFmpeg transcode settings applied',
        },
        expectedOutput: 1,
        expectedFileId: '/tmp/output.mp4',
      },
      {
        scenario: 'processing not needed',
        mockResult: {
          processFile: false,
          transcodeSettingsLog: 'File does not need processing',
        },
        expectedOutput: 2,
        expectedFileId: undefined, // Should use input file
      },
      {
        scenario: 'no result from plugin',
        mockResult: null,
        expectedOutput: 2,
        expectedFileId: undefined, // Should use input file
      },
    ])('should return output $expectedOutput when $scenario', async ({
      mockResult,
      expectedOutput,
      expectedFileId,
    }) => {
      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(mockRunClassicPlugin).toHaveBeenCalledWith(baseArgs, 'transcode');
      expect(result.outputNumber).toBe(expectedOutput);

      if (expectedFileId) {
        expect(result.outputFileObj._id).toBe(expectedFileId);
      } else {
        expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      }

      if (expectedOutput === 2 && mockResult === null) {
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          'No result from classic plugin. Continuing to next flow plugin.',
        );
      } else if (expectedOutput === 2 && mockResult?.processFile === false) {
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          'Classic plugin does not need to process file. Continuing to next flow plugin.',
        );
      }
    });
  });

  describe('Successful Processing Scenarios', () => {
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
      {
        name: 'custom CLI',
        mockResult: {
          processFile: true,
          custom: {
            cliPath: '/usr/bin/ffmpeg',
            args: ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4'],
            outputPath: '/tmp/custom_output.mp4',
          },
          preset: '',
          transcodeSettingsLog: 'Custom CLI configuration applied',
        },
        expectedFileId: '/tmp/custom_output.mp4',
      },
    ])('should handle successful $name processing', async ({ mockResult, expectedFileId }) => {
      mockRunClassicPlugin.mockResolvedValue({
        result: mockResult,
        absolutePath: '/path/to/plugin',
        cacheFilePath: '/tmp/output.mp4',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe(expectedFileId || '/tmp/output.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
    });
  });

  describe('Error Handling', () => {
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
      },
      {
        name: 'without <io> separator',
        preset: '-f mp4,-c:v libx264 -crf 23',
      },
    ])('should handle preset $name', async ({ preset }) => {
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
    });
  });
});
