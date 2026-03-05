import { plugin, details } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandComskip/1.0.0/index';
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

describe('ffmpegCommandComskip Plugin', () => {
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
          container: 'mkv',
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

  describe('FFmpeg Command Initialization', () => {
    it('should throw error when ffmpegCommand is not initialized', async () => {
      baseArgs.variables.ffmpegCommand.init = false;

      await expect(plugin(baseArgs)).rejects.toThrow(
        'FFmpeg command plugins not used correctly',
      );
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
      // ffmpegCommand should be unchanged
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      expect(result.variables.ffmpegCommand.streams[0].mapArgs).toEqual(['-map', '0:0']);
    });

    it('should return output 2 when EDL file has no commercial entries', async () => {
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('');

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });

    it('should return output 2 when TXT file has no commercial entries', async () => {
      mockFileExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('');

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
    });
  });

  describe('EDL parsing', () => {
    it('should configure ffmpegCommand when EDL has commercials', async () => {
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n636.41\t930.87\t0\n');

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);

      // Video stream should have [outv] mapping
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.mapArgs).toEqual(['-map', '[outv]']);

      // Audio stream should have [outa] mapping
      const audioStream = result.variables.ffmpegCommand.streams[1];
      expect(audioStream.mapArgs).toEqual(['-map', '[outa]']);

      // filter_complex should be in overallOuputArguments
      expect(result.variables.ffmpegCommand.overallOuputArguments[0]).toBe('-filter_complex');
      const filterComplex = result.variables.ffmpegCommand.overallOuputArguments[1];
      expect(filterComplex).toContain('[outv]');
      expect(filterComplex).toContain('[outa]');
      expect(filterComplex).toContain('concat=n=');
    });
  });

  describe('TXT file fallback', () => {
    it('should parse TXT file when no EDL file exists', async () => {
      mockFileExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue(
        'FILE PROCESSING COMPLETE  20489 FRAMES AT  2996\n'
        + '-------------------\n'
        + '1\t2820\n'
        + '19078\t20489\n',
      );

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Found 2 commercial segment(s) to remove.');

      // Verify stream modifications
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.mapArgs).toEqual(['-map', '[outv]']);

      const audioStream = result.variables.ffmpegCommand.streams[1];
      expect(audioStream.mapArgs).toEqual(['-map', '[outa]']);
    });

    it('should prefer EDL over TXT when both exist', async () => {
      // EDL exists
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

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
      mockCLI.mockImplementation(() => ({
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 1, errorLogFull: [] }),
      }));
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Default encoding', () => {
    it('should add default video encoding when outputArgs are empty', async () => {
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('-c:{outputIndex}');
      expect(videoStream.outputArgs).toContain('libx264');
      expect(videoStream.outputArgs).toContain('-preset');
      expect(videoStream.outputArgs).toContain('medium');
      expect(videoStream.outputArgs).toContain('-crf');
      expect(videoStream.outputArgs).toContain('18');
    });

    it('should add default audio encoding when outputArgs are empty', async () => {
      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

      const result = await plugin(baseArgs);

      const audioStream = result.variables.ffmpegCommand.streams[1];
      expect(audioStream.outputArgs).toContain('-c:{outputIndex}');
      expect(audioStream.outputArgs).toContain('aac');
      expect(audioStream.outputArgs).toContain('-b:{outputIndex}');
      expect(audioStream.outputArgs).toContain('192k');
    });

    it('should preserve existing video stream outputArgs from other plugins', async () => {
      // Simulate SetVideoEncoder having already configured the stream
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = [
        '-c:{outputIndex}', 'libx265', '-crf', '25', '-preset', 'fast',
      ];

      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      // Should keep the existing encoder, not add defaults
      expect(videoStream.outputArgs).toEqual([
        '-c:{outputIndex}', 'libx265', '-crf', '25', '-preset', 'fast',
      ]);
      expect(videoStream.outputArgs).not.toContain('libx264');
    });

    it('should preserve existing audio stream outputArgs from other plugins', async () => {
      baseArgs.variables.ffmpegCommand.streams[1].outputArgs = [
        '-c:{outputIndex}', 'ac3', '-b:{outputIndex}', '384k',
      ];

      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

      const result = await plugin(baseArgs);

      const audioStream = result.variables.ffmpegCommand.streams[1];
      expect(audioStream.outputArgs).toEqual([
        '-c:{outputIndex}', 'ac3', '-b:{outputIndex}', '384k',
      ]);
      expect(audioStream.outputArgs).not.toContain('aac');
    });
  });

  describe('Stream handling', () => {
    it('should mark extra streams as removed', async () => {
      // Add subtitle and data streams
      baseArgs.variables.ffmpegCommand.streams.push(
        {
          index: 2,
          codec_name: 'subrip',
          codec_type: 'subtitle',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:2'],
        },
        {
          index: 3,
          codec_name: 'bin_data',
          codec_type: 'data',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:3'],
        },
      );

      mockFileExists.mockResolvedValueOnce(true);
      mockReadFile.mockResolvedValue('0.00\t94.06\t0\n');

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      // Video and audio should not be removed
      expect(result.variables.ffmpegCommand.streams[0].removed).toBe(false);
      expect(result.variables.ffmpegCommand.streams[1].removed).toBe(false);
      // Subtitle and data should be removed
      expect(result.variables.ffmpegCommand.streams[2].removed).toBe(true);
      expect(result.variables.ffmpegCommand.streams[3].removed).toBe(true);
    });
  });

  describe('Container handling', () => {
    it('should set ffmpegCommand container from input', async () => {
      baseArgs.inputs.container = 'mp4';
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(result.variables.ffmpegCommand.container).toBe('mp4');
    });

    it('should use original container when set to original', async () => {
      baseArgs.inputs.container = 'original';
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      // Should derive container from inputFileObj._id extension
      const inputExt = baseArgs.inputFileObj._id.split('.').pop();
      expect(result.variables.ffmpegCommand.container).toBe(inputExt);
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
