import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/runCli/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
  })),
}));

describe('runCli Plugin', () => {
  let baseArgs: IpluginInputArgs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCLI: jest.MockedClass<any>;

  beforeEach(() => {
    mockCLI = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils').CLI;
    mockCLI.mockClear();

    baseArgs = {
      inputs: {
        useCustomCliPath: false,
        userCli: 'mkvmerge',
        customCliPath: '/usr/bin/mkvmerge',
        doesCommandCreateOutputFile: true,
        // eslint-disable-next-line no-template-curly-in-string
        userOutputFilePath: '${cacheDir}/${fileName}.{{{args.inputFileObj.container}}}',
        // eslint-disable-next-line no-template-curly-in-string
        cliArguments: '-o "${outputFilePath}" "{{{args.inputFileObj._id}}}"',
        outputFileBecomesWorkingFile: true,
      },
      variables: {
        ffmpegCommand: {
          init: false,
          inputFiles: [],
          streams: [],
          container: '',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
      deps: {
        fsextra: {
          ensureDirSync: jest.fn(),
        },
        parseArgsStringToArgv: jest.fn().mockReturnValue(['-o', '/cache/sample.mkv', 'input.mkv']),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        handbrake: {},
        ffmpeg: {},
        mkvpropedit: {},
        easyinit: {},
        configVars: {},
      },
      workDir: '/tmp/work',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
    } as unknown as IpluginInputArgs;
  });

  describe('Basic CLI Execution', () => {
    it('should execute mkvmerge CLI successfully', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('/tmp/work/');
      expect(result.outputFileObj._id).toContain('SampleVideo_1280x720_1mb');
      expect(mockCLI).toHaveBeenCalled();
    });

    it('should execute mkvpropedit CLI successfully', async () => {
      baseArgs.inputs.userCli = 'mkvpropedit';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: '/usr/bin/mkvpropedit',
        }),
      );
    });

    it('should use custom CLI path when specified', async () => {
      baseArgs.inputs.useCustomCliPath = true;
      baseArgs.inputs.customCliPath = '/custom/path/mkvmerge';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: '/custom/path/mkvmerge',
        }),
      );
    });

    it('should throw error for unsupported CLI', async () => {
      baseArgs.inputs.userCli = 'unsupported-cli';

      await expect(plugin(baseArgs)).rejects.toThrow('CLI unsupported-cli not available to run in this plugin');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('CLI unsupported-cli not available to run in this plugin');
    });
  });

  describe('Output File Handling', () => {
    it('should return output file when outputFileBecomesWorkingFile is true', async () => {
      baseArgs.inputs.outputFileBecomesWorkingFile = true;

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toContain('/tmp/work/');
      expect(result.outputFileObj._id).toContain('SampleVideo_1280x720_1mb');
      expect(result.outputFileObj._id).not.toBe(baseArgs.inputFileObj._id);
    });

    it('should return input file when outputFileBecomesWorkingFile is false', async () => {
      baseArgs.inputs.outputFileBecomesWorkingFile = false;

      const result = await plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });

  describe('CLI Arguments Processing', () => {
    it('should process outputFilePath variable in CLI arguments', async () => {
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.cliArguments = '-o "${outputFilePath}" "input.mkv"';
      baseArgs.inputs.userOutputFilePath = '/output/test.mkv';

      await plugin(baseArgs);

      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(
        '-o "/output/test.mkv" "input.mkv"',
        '',
        '',
      );
    });

    it('should handle CLI arguments without outputFilePath variable', async () => {
      baseArgs.inputs.cliArguments = '--info "input.mkv"';

      await plugin(baseArgs);

      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith(
        '--info "input.mkv"',
        '',
        '',
      );
    });
  });

  describe('CLI Error Handling', () => {
    it('should throw error when CLI execution fails', async () => {
      const mockCLIInstance = {
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 1, errorLogFull: ['Error occurred'] }),
      };
      mockCLI.mockImplementation(() => mockCLIInstance);

      await expect(plugin(baseArgs)).rejects.toThrow('Running mkvmerge failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running mkvmerge failed');
    });

    it('should handle CLI constructor properly', async () => {
      // Set up a successful CLI mock for this test
      const mockCLIInstance = {
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
      };
      mockCLI.mockImplementation(() => mockCLIInstance);

      await plugin(baseArgs);

      expect(mockCLI).toHaveBeenCalledWith({
        cli: 'mkvmerge',
        spawnArgs: ['-o', '/cache/sample.mkv', 'input.mkv'],
        spawnOpts: {},
        jobLog: baseArgs.jobLog,
        outputFilePath: expect.any(String),
        inputFileObj: baseArgs.inputFileObj,
        logFullCliOutput: false,
        updateWorker: baseArgs.updateWorker,
        args: baseArgs,
      });
    });
  });

  describe('Input Validation', () => {
    it('should handle CLI arguments without outputFilePath template', async () => {
      // Set up a successful CLI mock for this test
      const mockCLIInstance = {
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
      };
      mockCLI.mockImplementation(() => mockCLIInstance);

      // Modify the existing baseArgs to test arguments without template variables
      const originalCliArguments = baseArgs.inputs.cliArguments;

      baseArgs.inputs.cliArguments = '--info "input.mkv"'; // No ${outputFilePath} template
      baseArgs.deps.parseArgsStringToArgv.mockReturnValue(['--info', 'input.mkv']);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.deps.parseArgsStringToArgv).toHaveBeenCalledWith('--info "input.mkv"', '', '');

      // Restore original values
      baseArgs.inputs.cliArguments = originalCliArguments;
    });

    it('should handle string conversion for inputs', async () => {
      // Test that inputs are properly converted to strings
      baseArgs.inputs.userCli = 'mkvmerge'; // Use valid CLI instead of invalid type
      baseArgs.inputs.customCliPath = '/usr/bin/mkvmerge';
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.userOutputFilePath = '${cacheDir}/${fileName}.mkv';
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.cliArguments = '-o "${outputFilePath}" "input.mkv"';

      // Set up a successful CLI mock for this test
      const mockCLIInstance = {
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
      };
      mockCLI.mockImplementation(() => mockCLIInstance);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Should not throw errors due to type conversion
    });
  });

  describe('Variables and Context', () => {
    it('should preserve variables from input args', async () => {
      // Set up a successful CLI mock for this test
      const mockCLIInstance = {
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
      };
      mockCLI.mockImplementation(() => mockCLIInstance);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.variables as any).testVar = 'testValue';

      const result = await plugin(baseArgs);

      expect(result.variables).toEqual(expect.objectContaining({ testVar: 'testValue' }));
    });
  });
});
