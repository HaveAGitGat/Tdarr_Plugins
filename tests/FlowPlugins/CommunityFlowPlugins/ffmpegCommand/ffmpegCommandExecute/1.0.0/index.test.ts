import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

describe('ffmpegCommandExecute Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    // Reset CLI mock to success for each test
    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    CLI.mockImplementation(() => ({
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
    }));

    baseArgs = {
      inputs: {},
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:0'],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:1'],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: true,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
      ffmpegPath: '/usr/bin/ffmpeg',
      updateWorker: jest.fn(),
      logOutcome: jest.fn(),
      logFullCliOutput: false,
      workDir: '/tmp/work',
      deps: {
        fsextra: {
          ensureDirSync: jest.fn(),
        },
        parseArgsStringToArgv: jest.fn().mockImplementation((str) => str.split(' ').filter(Boolean)),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: {
          join: (...paths: string[]) => paths.join('/'),
          basename: (path: string) => path.split('/').pop() || '',
          extname: (path: string) => {
            const name = path.split('/').pop() || '';
            const dotIndex = name.lastIndexOf('.');
            return dotIndex > 0 ? name.substring(dotIndex) : '';
          },
        },
        gracefulfs: {},
        mvdir: jest.fn(),
        ncp: jest.fn(),
        axios: {},
        crudTransDBN: jest.fn(),
        configVars: {
          config: {
            serverIP: '127.0.0.1',
            serverPort: '8266',
          },
        },
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Execution', () => {
    it('should execute ffmpeg command with basic streams', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mp4');
      expect(result.variables.ffmpegCommand.init).toBe(false);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Processing file');
      expect(baseArgs.logOutcome).toHaveBeenCalledWith('tSuc');
    });

    it('should handle streams with no output args (copy codec)', async () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = [];
      baseArgs.variables.ffmpegCommand.streams[1].outputArgs = [];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Processing file');
    });

    it('should handle streams with output args', async () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:{outputIndex}', 'libx264'];
      baseArgs.variables.ffmpegCommand.streams[1].outputArgs = ['-c:{outputIndex}', 'aac'];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Processing file');
    });
  });

  describe('Stream Processing', () => {
    it('should filter out removed streams and set shouldProcess', async () => {
      baseArgs.variables.ffmpegCommand.streams[1].removed = true;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle placeholder replacements in output args', async () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:{outputIndex}', 'libx264'];
      baseArgs.variables.ffmpegCommand.streams[1].outputArgs = ['-filter:a:{outputTypeIndex}', 'volume=0.8'];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should throw error when no streams are mapped', async () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      await expect(plugin(baseArgs)).rejects.toThrow('No streams mapped for new file');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No streams mapped for new file');
    });

    it('should throw error when all streams are removed', async () => {
      baseArgs.variables.ffmpegCommand.streams.forEach((stream) => {
        // eslint-disable-next-line no-param-reassign
        stream.removed = true;
      });

      await expect(plugin(baseArgs)).rejects.toThrow('No streams mapped for new file');
    });
  });

  describe('Input and Output Arguments', () => {
    it('should handle overall input arguments', async () => {
      baseArgs.variables.ffmpegCommand.overallInputArguments = ['-threads', '4'];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle overall output arguments', async () => {
      baseArgs.variables.ffmpegCommand.overallOuputArguments = ['-movflags', '+faststart'];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });

    it('should handle stream input arguments', async () => {
      baseArgs.variables.ffmpegCommand.streams[0].inputArgs = ['-hwaccel', 'auto'];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Container Handling', () => {
    it('should use correct container extension', async () => {
      baseArgs.variables.ffmpegCommand.container = 'mkv';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mkv');
    });

    it('should handle different container types', async () => {
      const containerTypes = ['mp4', 'mkv', 'avi', 'mov'];

      // Test each container type individually
      await Promise.all(containerTypes.map(async (container) => {
        baseArgs.variables.ffmpegCommand.container = container;
        baseArgs.variables.ffmpegCommand.init = true; // Reset init flag for each iteration

        const result = await plugin(baseArgs);

        expect(result.outputFileObj._id).toContain(`.${container}`);
      }));
    });
  });

  describe('No Processing Needed', () => {
    it('should skip processing when not needed', async () => {
      baseArgs.variables.ffmpegCommand.shouldProcess = false;
      baseArgs.variables.ffmpegCommand.overallInputArguments = [];
      baseArgs.variables.ffmpegCommand.overallOuputArguments = [];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('No need to process file, already as required');
    });

    it('should process when shouldProcess is true', async () => {
      baseArgs.variables.ffmpegCommand.shouldProcess = true;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).not.toBe(baseArgs.inputFileObj._id);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when ffmpeg command is not initialized', async () => {
      baseArgs.variables.ffmpegCommand.init = false;

      const expectedError = 'FFmpeg command plugins not used correctly. '
        + 'Please use the "Begin Command" plugin before using this plugin. '
        + 'Afterwards, use the "Execute" plugin to execute the built FFmpeg command. '
        + 'Once the "Execute" plugin has been used, you need to use a new "Begin Command" '
        + 'plugin to start a new FFmpeg command.';

      await expect(plugin(baseArgs)).rejects.toThrow(expectedError);
    });

    it('should throw error when CLI fails', async () => {
      // Mock the CLI to return failure
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      CLI.mockImplementation(() => ({
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 1 }),
      }));

      await expect(plugin(baseArgs)).rejects.toThrow('FFmpeg failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running FFmpeg failed');
    });
  });

  describe('Index Calculation with Mixed Streams', () => {
    it('should handle complex stream scenarios with removed streams', async () => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: ['-c:{outputIndex}', 'libx264'],
          mapArgs: ['-map', '0:0'],
        },
        {
          index: 1,
          codec_name: 'subtitle',
          codec_type: 'subtitle',
          removed: true, // This should not affect output indexing
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
        },
        {
          index: 2,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: ['-filter:a:{outputTypeIndex}', 'volume=0.8'],
          mapArgs: ['-map', '0:2'],
        },
      ];

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.variables.ffmpegCommand.shouldProcess).toBe(true);
    });
  });
});
