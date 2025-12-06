import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/runHealthCheck/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn(),
}));

// Mock fileUtils functions that are not supposed to be mocked according to instructions
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  getContainer: jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils').getContainer,
  getFileName: jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils').getFileName,
  getPluginWorkDir: jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils').getPluginWorkDir,
}));

const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

// Define interface for mock CLI
interface MockCLI {
  runCli: jest.MockedFunction<() => Promise<{ cliExitCode: number }>>;
}

describe('runHealthCheck Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCLI: MockCLI;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        type: 'quick',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      handbrakePath: '/usr/bin/HandBrakeCLI',
      ffmpegPath: '/usr/bin/ffmpeg',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
      originalLibraryFile: { DB: 'test-db' } as unknown as IpluginInputArgs['originalLibraryFile'],
      updateStat: jest.fn(),
      logOutcome: jest.fn(),
      workDir: '/tmp/work',
      deps: {
        fsextra: {
          ensureDirSync: jest.fn(),
          copySync: jest.fn(),
          moveSync: jest.fn(),
          removeSync: jest.fn(),
        },
      },
    } as unknown as IpluginInputArgs;

    // Mock CLI instance
    mockCLI = {
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
    };
    CLI.mockImplementation(() => mockCLI);

    jest.clearAllMocks();
  });

  describe('Quick Health Check', () => {
    it('should run quick health check with HandBrake', async () => {
      baseArgs.inputs.type = 'quick';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.healthCheck).toBe('Success');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running health check of type quick');
      expect(baseArgs.logOutcome).toHaveBeenCalledWith('hSuc');
    });

    it('should use HandBrake CLI for quick health check', async () => {
      baseArgs.inputs.type = 'quick';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith({
        cli: '/usr/bin/HandBrakeCLI',
        spawnArgs: [
          '-i',
          baseArgs.inputFileObj._id,
          '-o',
          expect.stringContaining('SampleVideo_1280x720_1mb.mp4'),
          '--scan',
        ],
        spawnOpts: {},
        jobLog: baseArgs.jobLog,
        outputFilePath: expect.stringContaining('SampleVideo_1280x720_1mb.mp4'),
        inputFileObj: baseArgs.inputFileObj,
        logFullCliOutput: false,
        updateWorker: baseArgs.updateWorker,
        args: baseArgs,
      });
    });
  });

  describe('Thorough Health Check', () => {
    it('should run thorough health check with FFmpeg', async () => {
      baseArgs.inputs.type = 'thorough';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.healthCheck).toBe('Success');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running health check of type thorough');
      expect(baseArgs.logOutcome).toHaveBeenCalledWith('hSuc');
    });

    it('should use FFmpeg CLI for thorough health check', async () => {
      baseArgs.inputs.type = 'thorough';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith({
        cli: '/usr/bin/ffmpeg',
        spawnArgs: [
          '-stats',
          '-v',
          'error',
          '-i',
          baseArgs.inputFileObj._id,
          '-f',
          'null',
          '-max_muxing_queue_size',
          '9999',
          expect.stringContaining('SampleVideo_1280x720_1mb.mp4'),
        ],
        spawnOpts: {},
        jobLog: baseArgs.jobLog,
        outputFilePath: expect.stringContaining('SampleVideo_1280x720_1mb.mp4'),
        inputFileObj: baseArgs.inputFileObj,
        logFullCliOutput: false,
        updateWorker: baseArgs.updateWorker,
        args: baseArgs,
      });
    });
  });

  describe('Statistics Update', () => {
    it('should update health check statistics when updateStat is available', async () => {
      const result = await plugin(baseArgs);

      expect(baseArgs.updateStat).toHaveBeenCalledWith('test-db', 'totalHealthCheckCount', 1);
      expect(result.outputNumber).toBe(1);
    });

    it('should not fail when updateStat is undefined', async () => {
      delete (baseArgs as Partial<IpluginInputArgs>).updateStat;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.healthCheck).toBe('Success');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when CLI fails', async () => {
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 1 });

      await expect(plugin(baseArgs)).rejects.toThrow('Running CLI failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running CLI failed');
      expect(baseArgs.logOutcome).toHaveBeenCalledWith('hErr');
    });

    it('should throw error when CLI returns non-zero exit code', async () => {
      mockCLI.runCli.mockResolvedValue({ cliExitCode: 255 });

      await expect(plugin(baseArgs)).rejects.toThrow('Running CLI failed');
    });

    it('should propagate CLI runtime errors', async () => {
      const error = new Error('CLI execution failed');
      mockCLI.runCli.mockRejectedValue(error);

      await expect(plugin(baseArgs)).rejects.toThrow('CLI execution failed');
    });
  });

  describe('File Path Handling', () => {
    it('should handle different file extensions', async () => {
      baseArgs.inputFileObj._id = '/path/to/video.mkv';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          outputFilePath: expect.stringContaining('video.mkv'),
        }),
      );
    });

    it('should handle file paths with spaces', async () => {
      baseArgs.inputFileObj._id = '/path/to/video file.mp4';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: expect.arrayContaining(['/path/to/video file.mp4']),
        }),
      );
    });

    it('should handle Windows-style paths', async () => {
      baseArgs.inputFileObj._id = 'C:\\Users\\Test\\video.mp4';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: expect.arrayContaining(['C:\\Users\\Test\\video.mp4']),
        }),
      );
    });
  });

  describe('Configuration Options', () => {
    it('should pass logFullCliOutput option to CLI', async () => {
      baseArgs.logFullCliOutput = true;

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          logFullCliOutput: true,
        }),
      );
    });

    it('should pass updateWorker function to CLI', async () => {
      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          updateWorker: baseArgs.updateWorker,
        }),
      );
    });

    it('should pass args object to CLI', async () => {
      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          args: baseArgs,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing handbrakePath for quick check', async () => {
      delete (baseArgs as Partial<IpluginInputArgs>).handbrakePath;
      baseArgs.inputs.type = 'quick';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: undefined,
        }),
      );
    });

    it('should handle missing ffmpegPath for thorough check', async () => {
      delete (baseArgs as Partial<IpluginInputArgs>).ffmpegPath;
      baseArgs.inputs.type = 'thorough';

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: undefined,
        }),
      );
    });

    it('should handle unknown health check type', async () => {
      baseArgs.inputs.type = 'unknown';

      await plugin(baseArgs);

      // Should default to HandBrake (quick check behavior)
      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: '/usr/bin/HandBrakeCLI',
          spawnArgs: expect.arrayContaining(['--scan']),
        }),
      );
    });
  });
});
