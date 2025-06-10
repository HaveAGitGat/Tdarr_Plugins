import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/apprise/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { CLI } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
const MockedCLI = CLI as jest.MockedClass<typeof CLI>;

describe('Apprise Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCLI: jest.Mocked<CLI>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock CLI instance
    mockCLI = {
      runCli: jest.fn(),
    } as unknown as jest.Mocked<CLI>;

    // Make the CLI constructor return our mock
    MockedCLI.mockImplementation(() => mockCLI);

    baseArgs = {
      inputs: {
        command: '-vv -t "Success" -b "Test message" "discord://test/webhook"',
        apprisePath: 'apprise',
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
      logFullCliOutput: false,
      updateWorker: jest.fn(),
      deps: {
        parseArgsStringToArgv: jest.fn().mockImplementation((command) => {
          // Simple implementation that handles quoted strings better
          const args = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < command.length; i += 1) {
            const char = command[i];
            if (char === '"' && (i === 0 || command[i - 1] !== '\\')) {
              inQuotes = !inQuotes;
            } else if (char === ' ' && !inQuotes) {
              if (current) {
                args.push(current);
                current = '';
              }
            } else {
              current += char;
            }
          }
          if (current) {
            args.push(current);
          }
          return args.filter(Boolean);
        }),
        fsextra: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: jest.fn(),
        gracefulfs: jest.fn(),
        mvdir: jest.fn(),
        ncp: jest.fn(),
        axios: jest.fn(),
        crudTransDBN: jest.fn(),
        configVars: {
          config: {
            serverIP: 'localhost',
            serverPort: '8265',
          },
        },
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Successful Execution', () => {
    it('should execute apprise command successfully with default settings', async () => {
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(MockedCLI).toHaveBeenCalledWith({
        cli: 'apprise',
        spawnArgs: ['-vv', '-t', 'Success', '-b', 'Test message', 'discord://test/webhook'],
        spawnOpts: {},
        jobLog: baseArgs.jobLog,
        outputFilePath: '',
        inputFileObj: baseArgs.inputFileObj,
        logFullCliOutput: baseArgs.logFullCliOutput,
        updateWorker: baseArgs.updateWorker,
        args: baseArgs,
      });
    });

    it('should handle custom apprise path', async () => {
      baseArgs.inputs.apprisePath = '/usr/local/bin/apprise';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: '/usr/local/bin/apprise',
        }),
      );
    });

    it('should handle complex command with multiple arguments', async () => {
      baseArgs.inputs.command = '-vv -t "Processing Complete" '
        + '-b "File {{{args.inputFileObj._id}}} processed successfully" '
        + '"discord://webhook1" "slack://token/channel"';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: [
            '-vv',
            '-t',
            'Processing Complete',
            '-b',
            'File {{{args.inputFileObj._id}}} processed successfully',
            'discord://webhook1',
            'slack://token/channel',
          ],
        }),
      );
    });

    it('should handle command with special characters', async () => {
      baseArgs.inputs.command = '-t "Success!" -b "File & folder processed @ 100%" "discord://test"';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: [
            '-t',
            'Success!',
            '-b',
            'File & folder processed @ 100%',
            'discord://test',
          ],
        }),
      );
    });
  });

  describe('Failed Execution', () => {
    it('should throw error when apprise command returns non-zero exit code', async () => {
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 1, errorLogFull: ['Error: Invalid webhook URL'] });

      await expect(plugin(baseArgs)).rejects.toThrow('Running Apprise failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running Apprise failed');
    });

    it('should handle CLI rejection', async () => {
      mockCLI.runCli.mockRejectedValue(new Error('CLI execution failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('CLI execution failed');
    });
  });

  describe('Input Validation', () => {
    it('should use default command when command is empty', async () => {
      baseArgs.inputs.command = '';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      // When command is empty, lib.loadDefaultValues will fill in the default
      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: [
            '-vv',
            '-t',
            'Success',
            '-b',
            'File {{{args.inputFileObj._id}}}',
            'discord://xxx/xxxx',
          ],
        }),
      );
    });

    it('should trim whitespace from apprise path', async () => {
      baseArgs.inputs.apprisePath = '   /usr/bin/apprise   ';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: '/usr/bin/apprise',
        }),
      );
    });

    it('should convert non-string inputs to strings', async () => {
      baseArgs.inputs.command = 123 as unknown;
      baseArgs.inputs.apprisePath = null as unknown;
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: 'null',
          spawnArgs: ['123'],
        }),
      );
    });
  });

  describe('Variable Template Handling', () => {
    it('should pass commands with variable templates unchanged', async () => {
      baseArgs.inputs.command = '-b "Processing {{{args.inputFileObj._id}}}" '
        + '"discord://{{{args.userVariables.global.webhook}}}"';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: [
            '-b',
            'Processing {{{args.inputFileObj._id}}}',
            'discord://{{{args.userVariables.global.webhook}}}',
          ],
        }),
      );
    });

    it('should handle multiple variable templates', async () => {
      baseArgs.inputs.command = '-t "{{{args.userVariables.library.title}}}" -b "File: {{{args.inputFileObj.file}}}" '
        + '"{{{args.userVariables.global.notification_url}}}"';
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      expect(MockedCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: [
            '-t',
            '{{{args.userVariables.library.title}}}',
            '-b',
            'File: {{{args.inputFileObj.file}}}',
            '{{{args.userVariables.global.notification_url}}}',
          ],
        }),
      );
    });
  });

  describe('CLI Configuration', () => {
    it('should configure CLI with correct parameters', async () => {
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 0, errorLogFull: [] });

      await plugin(baseArgs);

      expect(MockedCLI).toHaveBeenCalledWith({
        cli: 'apprise',
        spawnArgs: [
          '-vv',
          '-t',
          'Success',
          '-b',
          'Test message',
          'discord://test/webhook',
        ],
        spawnOpts: {},
        jobLog: baseArgs.jobLog,
        outputFilePath: '',
        inputFileObj: baseArgs.inputFileObj,
        logFullCliOutput: baseArgs.logFullCliOutput,
        updateWorker: baseArgs.updateWorker,
        args: baseArgs,
      });
      expect(mockCLI.runCli).toHaveBeenCalledTimes(1);
    });
  });
});
