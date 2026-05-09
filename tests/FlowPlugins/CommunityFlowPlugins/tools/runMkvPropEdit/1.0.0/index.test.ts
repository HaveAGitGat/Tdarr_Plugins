import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/runMkvPropEdit/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265 = require('../../../../../sampleData/media/sampleH265_1.json');

// Mock the CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({
      cliExitCode: 0,
    }),
  })),
}));

// Mock the lib methods
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: jest.fn((inputs) => inputs),
}));

describe('runMkvPropEdit Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockRunCli: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    const mockCLI = CLI as jest.MockedClass<typeof CLI>;
    mockRunCli = jest.fn().mockResolvedValue({ cliExitCode: 0 });
    mockCLI.mockImplementation(() => ({
      runCli: mockRunCli,
    }));

    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Successful execution', () => {
    it('should run mkvpropedit successfully on H264 file', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(mockRunCli).toHaveBeenCalledTimes(1);
    });

    it('should run mkvpropedit successfully on H265 file', async () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH265)) as IFileObject;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(mockRunCli).toHaveBeenCalledTimes(1);
    });

    it('should pass correct CLI arguments to mkvpropedit', async () => {
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith({
        cli: baseArgs.mkvpropeditPath,
        spawnArgs: ['--add-track-statistics-tags', baseArgs.inputFileObj._id],
        spawnOpts: {},
        jobLog: baseArgs.jobLog,
        outputFilePath: '',
        inputFileObj: baseArgs.inputFileObj,
        logFullCliOutput: baseArgs.logFullCliOutput,
        updateWorker: baseArgs.updateWorker,
        args: baseArgs,
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error when mkvpropedit returns non-zero exit code', async () => {
      mockRunCli.mockResolvedValueOnce({ cliExitCode: 1 });

      await expect(plugin(baseArgs)).rejects.toThrow('Running MKVPropEdit failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Running MKVPropEdit failed');
    });

    it('should propagate CLI execution errors', async () => {
      const cliError = new Error('CLI execution failed');
      mockRunCli.mockRejectedValueOnce(cliError);

      await expect(plugin(baseArgs)).rejects.toThrow('CLI execution failed');
    });
  });

  describe('Configuration options', () => {
    it('should handle different mkvpropedit paths', async () => {
      baseArgs.mkvpropeditPath = '/custom/path/mkvpropedit';
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: '/custom/path/mkvpropedit',
        }),
      );
    });

    it('should use correct file ID in CLI arguments', async () => {
      baseArgs.inputFileObj._id = '/path/to/video.mkv';
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnArgs: ['--add-track-statistics-tags', '/path/to/video.mkv'],
        }),
      );
    });

    it('should respect logFullCliOutput setting', async () => {
      baseArgs.logFullCliOutput = true;
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');

      await plugin(baseArgs);

      expect(CLI).toHaveBeenCalledWith(
        expect.objectContaining({
          logFullCliOutput: true,
        }),
      );
    });
  });
});
