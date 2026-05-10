import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/handbrake/handbrakeCustomArguments/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the lib module to avoid fs.realpathSync issue
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: jest.fn((inputs) => inputs),
}));

// Create a mock CLI that can be reset
const mockRunCli = jest.fn().mockResolvedValue({ cliExitCode: 0 });

// Mock the CLI module
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: mockRunCli,
  })),
}));

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('handbrakeCustomArguments Plugin v1.0.0', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        customArguments: '-Z "Fast 1080p30" --all-subtitles',
        jsonPreset: '',
        container: 'mkv',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
      updateWorker: jest.fn(),
      logOutcome: jest.fn(),
      logFullCliOutput: false,
      handbrakePath: '/usr/bin/HandBrakeCLI',
      workDir: '/tmp/work',
      deps: {
        parseArgsStringToArgv: jest.fn().mockReturnValue(['-Z', 'Fast 1080p30', '--all-subtitles']),
        fsextra: {
          ensureDirSync: jest.fn(),
        },
      },
    } as unknown as IpluginInputArgs;

    jest.clearAllMocks();
    mockRunCli.mockResolvedValue({ cliExitCode: 0 });
  });

  describe('Basic Functionality', () => {
    it('should process with custom arguments and default container', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mkv');
      expect(baseArgs.updateWorker).toHaveBeenCalled();
      expect(baseArgs.logOutcome).toHaveBeenCalledWith('tSuc');
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(
        '-Z "Fast 1080p30" --all-subtitles',
        '',
        '',
      );
    });

    it('should use original container when specified', async () => {
      baseArgs.inputs.container = 'original';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mp4'); // Original container from sample file
    });
  });

  describe('JSON Preset Handling', () => {
    it('should process with JSON preset', async () => {
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'Test Preset',
            VideoEncoder: 'x264',
          },
        ],
      };
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mkv');
    });

    it('should ignore custom arguments when JSON preset is provided', async () => {
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'Custom Test Preset',
            VideoEncoder: 'x265',
          },
        ],
      };
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);
      baseArgs.inputs.customArguments = '-Z "Very Fast"';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).not.toHaveBeenCalled();
    });

    it('should use custom arguments when JSON preset is empty', async () => {
      baseArgs.inputs.jsonPreset = '';
      baseArgs.inputs.customArguments = '-Z "Custom Preset"';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith('-Z "Custom Preset"', '', '');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when HandBrake fails', async () => {
      mockRunCli.mockResolvedValue({ cliExitCode: 1 });

      await expect(plugin(baseArgs)).rejects.toThrow('Running HandBrake failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running HandBrake failed');
    });

    it('should handle invalid JSON preset gracefully', async () => {
      baseArgs.inputs.jsonPreset = 'invalid json';

      await expect(plugin(baseArgs)).rejects.toThrow();
    });
  });

  describe('Container Options', () => {
    it.each([
      ['mp4', '.mp4'],
      ['m4v', '.m4v'],
      ['avi', '.avi'],
    ])('should handle %s container', async (container, expectedExtension) => {
      baseArgs.inputs.container = container;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain(expectedExtension);
    });
  });

  describe('Custom Arguments', () => {
    it('should handle complex custom arguments', async () => {
      baseArgs.inputs.customArguments = '-Z "Very Fast 1080p30" -e x265 --encoder-preset medium';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(
        '-Z "Very Fast 1080p30" -e x265 --encoder-preset medium',
        '',
        '',
      );
    });

    it('should handle empty custom arguments', async () => {
      baseArgs.inputs.customArguments = '';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith('', '', '');
    });
  });
});
