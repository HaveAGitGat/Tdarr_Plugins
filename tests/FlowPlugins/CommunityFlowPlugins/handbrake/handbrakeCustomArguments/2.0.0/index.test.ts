import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/handbrake/handbrakeCustomArguments/2.0.0/index';
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

describe('handbrakeCustomArguments Plugin v2.0.0', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        useJsonPreset: false,
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
    it('should process with custom arguments when useJsonPreset is false', async () => {
      baseArgs.inputs.useJsonPreset = false;

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

  describe('JSON Preset Mode', () => {
    it('should process with JSON preset when useJsonPreset is true', async () => {
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'Test Preset',
            VideoEncoder: 'x264',
          },
        ],
      };
      baseArgs.inputs.useJsonPreset = true;
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mkv');
      expect(baseArgs.deps.parseArgsStringToArgv).not.toHaveBeenCalled();
    });

    it('should ignore custom arguments when useJsonPreset is true', async () => {
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'Custom Test Preset',
            VideoEncoder: 'x265',
          },
        ],
      };
      baseArgs.inputs.useJsonPreset = true;
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);
      baseArgs.inputs.customArguments = '-Z "Very Fast"';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).not.toHaveBeenCalled();
    });

    it('should use custom arguments when useJsonPreset is false', async () => {
      baseArgs.inputs.useJsonPreset = false;
      baseArgs.inputs.customArguments = '-Z "Custom Preset"';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith('-Z "Custom Preset"', '', '');
    });
  });

  describe('Boolean Input Handling', () => {
    it('should handle useJsonPreset as string "true"', async () => {
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'String True Test',
            VideoEncoder: 'x264',
          },
        ],
      };
      (baseArgs.inputs as { useJsonPreset: string }).useJsonPreset = 'true';
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).not.toHaveBeenCalled();
    });

    it('should handle useJsonPreset as string "false"', async () => {
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'String False Test',
            VideoEncoder: 'x264',
          },
        ],
      };
      (baseArgs.inputs as { useJsonPreset: string }).useJsonPreset = 'false';
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // String "false" is truthy in JavaScript, so it will actually use JSON preset path
      expect(baseArgs.deps.parseArgsStringToArgv).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when HandBrake fails', async () => {
      mockRunCli.mockResolvedValue({ cliExitCode: 1 });

      await expect(plugin(baseArgs)).rejects.toThrow('Running HandBrake failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running HandBrake failed');
    });

    it('should handle invalid JSON preset gracefully', async () => {
      baseArgs.inputs.useJsonPreset = true;
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
      baseArgs.inputs.useJsonPreset = false;
      baseArgs.inputs.customArguments = '-Z "Very Fast 1080p30" -e x265 --encoder-preset medium';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(
        '-Z "Very Fast 1080p30" -e x265 --encoder-preset medium',
        '',
        '',
      );
    });

    it('should handle empty custom arguments when useJsonPreset is false', async () => {
      baseArgs.inputs.useJsonPreset = false;
      baseArgs.inputs.customArguments = '';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith('', '', '');
    });
  });

  describe('Preset Path Handling', () => {
    it('should write preset file when using JSON preset', async () => {
      const { promises: fsp } = require('fs');
      const jsonPreset = {
        PresetList: [
          {
            PresetName: 'File Write Test',
            VideoEncoder: 'x264',
          },
        ],
      };
      baseArgs.inputs.useJsonPreset = true;
      baseArgs.inputs.jsonPreset = JSON.stringify(jsonPreset);

      await plugin(baseArgs);

      expect(fsp.writeFile).toHaveBeenCalledWith(
        `${baseArgs.workDir}/preset.json`,
        JSON.stringify(jsonPreset, null, 2),
      );
    });

    it('should not write preset file when using custom arguments', async () => {
      const { promises: fsp } = require('fs');
      baseArgs.inputs.useJsonPreset = false;

      await plugin(baseArgs);

      expect(fsp.writeFile).not.toHaveBeenCalled();
    });
  });
});
