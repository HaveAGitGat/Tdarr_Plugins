import { plugin, details } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/comskip/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
  })),
}));

// Mock fileExists
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => {
  const actual = jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
  return {
    ...actual,
    fileExists: jest.fn().mockResolvedValue(false),
  };
});

// Mock fs promises
const mockReadFile = jest.fn().mockResolvedValue('');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    readFile: (...fnArgs: unknown[]) => mockReadFile(...fnArgs),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockFileExists: jest.Mock;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockCLI: jest.MockedClass<any>;

describe('Comskip Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCLI = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils').CLI;
    mockCLI.mockImplementation(() => ({
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0, errorLogFull: [] }),
    }));
    mockFileExists = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils').fileExists;

    baseArgs = {
      inputs: {
        comskipPath: 'comskip',
        useCustomIni: false,
        customIniPath: '/config/comskip.ini',
        container: 'mkv',
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
      inputFileObj: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        ffProbeData: {
          ...JSON.parse(JSON.stringify(sampleH264)).ffProbeData,
          format: {
            ...JSON.parse(JSON.stringify(sampleH264)).ffProbeData?.format,
            duration: '3600',
          },
        },
      } as IFileObject,
      jobLog: jest.fn(),
      deps: {
        fsextra: {
          ensureDirSync: jest.fn(),
        },
        parseArgsStringToArgv: jest.fn().mockReturnValue([]),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: {
          join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
          joinSafe: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
        },
        configVars: getConfigVars(),
      },
      workDir: '/tmp/work',
      ffmpegPath: '/usr/bin/ffmpeg',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
    } as unknown as IpluginInputArgs;
  });

  describe('Details', () => {
    it('should have correct plugin details', () => {
      const pluginDetails = details();

      expect(pluginDetails.name).toBe('Comskip - Detect and Remove Commercials');
      expect(pluginDetails.outputs).toHaveLength(2);
      expect(pluginDetails.outputs[0].tooltip).toBe('Commercials detected and removed');
      expect(pluginDetails.outputs[1].tooltip).toBe('No commercials detected');
      expect(pluginDetails.inputs).toHaveLength(4);
    });
  });

  describe('No commercials detected', () => {
    it('should return output 2 when no EDL or TXT file is generated', async () => {
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'No EDL or TXT file generated - no commercials detected.',
      );
    });

    it('should return output 2 when EDL file has no commercial entries', async () => {
      // First call (EDL) exists, second call (TXT) doesn't matter
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('');

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should return output 2 when TXT file has no commercial entries', async () => {
      // EDL doesn't exist, TXT exists but is empty
      mockFileExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('');

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('TXT file fallback', () => {
    it('should parse TXT file when no EDL file exists', async () => {
      // EDL doesn't exist, TXT exists
      mockFileExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue(
        'FILE PROCESSING COMPLETE  20489 FRAMES AT  2996\n'
        + '-------------------\n'
        + '1\t2820\n'
        + '19078\t20489\n',
      );

      // Second CLI call (ffmpeg) succeeds
      const exitCodes = [0, 0];
      let callCount = 0;
      mockCLI.mockImplementation(() => ({
        runCli: jest.fn().mockImplementation(() => {
          const code = exitCodes[callCount];
          callCount += 1;
          return Promise.resolve({ cliExitCode: code, errorLogFull: [] });
        }),
      }));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found 2 commercial segment(s) to remove.');
    });

    it('should prefer EDL over TXT when both exist', async () => {
      // EDL exists
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

      const exitCodes = [0, 0];
      let callCount = 0;
      mockCLI.mockImplementation(() => ({
        runCli: jest.fn().mockImplementation(() => {
          const code = exitCodes[callCount];
          callCount += 1;
          return Promise.resolve({ cliExitCode: code, errorLogFull: [] });
        }),
      }));

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found 1 commercial segment(s) to remove.');
      // fileExists should only be called once (for EDL), not for TXT
      expect(mockFileExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('Comskip execution', () => {
    it('should run comskip with correct arguments', async () => {
      mockFileExists.mockResolvedValue(false);

      await plugin(baseArgs);

      expect(mockCLI).toHaveBeenCalledWith(
        expect.objectContaining({
          cli: 'comskip',
        }),
      );
    });

    it('should include custom ini path when enabled', async () => {
      baseArgs.inputs.useCustomIni = true;
      baseArgs.inputs.customIniPath = '/my/comskip.ini';
      mockFileExists.mockResolvedValue(false);

      await plugin(baseArgs);

      // Verify comskip was called (first CLI call)
      const comskipCall = mockCLI.mock.calls[0][0];
      expect(comskipCall.cli).toBe('comskip');
      expect(comskipCall.spawnArgs).toContain('--ini');
      expect(comskipCall.spawnArgs).toContain('/my/comskip.ini');
    });

    it('should throw error when comskip fails with exit code > 1', async () => {
      const mockCLIInstance = {
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 2, errorLogFull: ['Error'] }),
      };
      mockCLI.mockImplementation(() => mockCLIInstance);

      await expect(plugin(baseArgs)).rejects.toThrow('Comskip failed with exit code 2');
    });

    it('should accept comskip exit code 1 (sometimes used for commercials found)', async () => {
      const exitCodes = [1, 0];
      let callCount = 0;
      mockCLI.mockImplementation(() => ({
        runCli: jest.fn().mockImplementation(() => {
          const code = exitCodes[callCount];
          callCount += 1;
          return Promise.resolve({ cliExitCode: code, errorLogFull: [] });
        }),
      }));
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Variables and context', () => {
    it('should preserve variables from input args', async () => {
      mockFileExists.mockResolvedValue(false);

      baseArgs.variables.user.testKey = 'testValue';

      const result = await plugin(baseArgs);

      expect(result.variables.user.testKey).toBe('testValue');
    });
  });
});
