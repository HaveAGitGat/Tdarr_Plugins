import { promises as fsp } from 'fs';
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/copyToWorkDirectory/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('fs', () => ({
  promises: {
    copyFile: jest.fn(),
    stat: jest.fn(),
  },
  realpathSync: jest.fn((path) => path),
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
  statSync: jest.fn(() => ({ isDirectory: () => false, isFile: () => true })),
}));

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  ...jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils'),
  getFileSize: jest.fn(),
}));

const { getFileSize } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');

describe('copyToWorkDirectory Plugin', () => {
  let baseArgs: IpluginInputArgs;
  const mockCopyFile = fsp.copyFile as jest.MockedFunction<typeof fsp.copyFile>;
  const mockGetFileSize = getFileSize as jest.MockedFunction<typeof getFileSize>;
  const mockEnsureDirSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const configVars = getConfigVars();

    const mockNcp = jest.fn((source, dest, callback) => {
      callback(null); // Call callback with no error to simulate successful copy
    });

    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      workDir: '/tmp/workdir',
      librarySettings: {},
      userVariables: {
        global: {},
        library: {},
      },
      platform: 'linux',
      arch: 'x64',
      handbrakePath: '/usr/bin/handbrake',
      ffmpegPath: '/usr/bin/ffmpeg',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      nodeHardwareType: 'cpu',
      workerType: 'cpu',
      nodeTags: '',
      config: {},
      job: {} as IpluginInputArgs['job'],
      platform_arch_isdocker: 'linux_x64_false',
      lastSuccesfulPlugin: null,
      lastSuccessfulRun: null,
      updateWorker: jest.fn(),
      logFullCliOutput: false,
      logOutcome: jest.fn(),
      updateStat: jest.fn(),
      configVars,
      deps: {
        fsextra: {
          ensureDirSync: mockEnsureDirSync,
        },
        upath: {
          normalize: (path: string) => path.replace(/\\/g, '/'),
          join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
          joinSafe: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
        },
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        gracefulfs: jest.fn(),
        mvdir: jest.fn(),
        ncp: mockNcp,
        axios: jest.fn(),
        crudTransDBN: jest.fn(),
        configVars,
      },
      installClassicPluginDeps: jest.fn(),
      thisPlugin: {},
    } as IpluginInputArgs;

    mockCopyFile.mockResolvedValue(undefined);
    mockGetFileSize.mockResolvedValue(1048576); // 1MB file size
  });

  describe('Basic Functionality', () => {
    it('should copy file to work directory when paths are different', async () => {
      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/tmp/workdir');
      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        baseArgs.inputFileObj._id,
        '/tmp/workdir/SampleVideo_1280x720_1mb.mp4',
        expect.any(Function),
      );
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/tmp/workdir/SampleVideo_1280x720_1mb.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Input path: ${baseArgs.inputFileObj._id}`);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Output path: /tmp/workdir');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Calculating cache file size in bytes');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('1048576');
    });

    it('should skip copy when input and output paths are the same', async () => {
      // Set workDir so that the output path matches input path
      baseArgs.workDir = 'C:/Transcode/Source Folder';

      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).not.toHaveBeenCalled();
      expect(baseArgs.deps.ncp).not.toHaveBeenCalled();
      expect(mockCopyFile).not.toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe(baseArgs.inputFileObj._id);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Input and output path are the same, skipping copy.');
    });

    it('should handle files with different extensions', async () => {
      const modifiedSample = JSON.parse(JSON.stringify(sampleH264));
      modifiedSample._id = '/path/to/file.mkv';
      modifiedSample.container = 'mkv';
      baseArgs.inputFileObj = modifiedSample;

      const result = await plugin(baseArgs);

      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        '/path/to/file.mkv',
        '/tmp/workdir/file.mkv',
        expect.any(Function),
      );
      expect(result.outputFileObj._id).toBe('/tmp/workdir/file.mkv');
    });
  });

  describe('Directory Handling', () => {
    it('should ensure work directory exists before copying', async () => {
      await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/tmp/workdir');
      expect(baseArgs.deps.ncp).toHaveBeenCalled();
    });

    it('should handle nested work directories', async () => {
      baseArgs.workDir = '/tmp/nested/work/directory';

      await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/tmp/nested/work/directory');
      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        baseArgs.inputFileObj._id,
        '/tmp/nested/work/directory/SampleVideo_1280x720_1mb.mp4',
        expect.any(Function),
      );
    });
  });

  describe('File Path Handling', () => {
    it('should handle Windows-style paths', async () => {
      const windowsSample = JSON.parse(JSON.stringify(sampleH264));
      windowsSample._id = 'C:\\Videos\\Movie.mp4';
      baseArgs.inputFileObj = windowsSample;
      baseArgs.workDir = 'D:\\Temp';

      const result = await plugin(baseArgs);

      // The getFileName function doesn't properly handle Windows paths,
      // so it treats the whole path as a filename
      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        'C:\\Videos\\Movie.mp4',
        'D:\\Temp/C:\\Videos\\Movie.mp4',
        expect.any(Function),
      );
      expect(result.outputFileObj._id).toBe('D:\\Temp/C:\\Videos\\Movie.mp4');
    });

    it('should handle Unix-style paths', async () => {
      const unixSample = JSON.parse(JSON.stringify(sampleH264));
      unixSample._id = '/home/user/videos/movie.mp4';
      baseArgs.inputFileObj = unixSample;
      baseArgs.workDir = '/tmp/work';

      const result = await plugin(baseArgs);

      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        '/home/user/videos/movie.mp4',
        '/tmp/work/movie.mp4',
        expect.any(Function),
      );
      expect(result.outputFileObj._id).toBe('/tmp/work/movie.mp4');
    });

    it('should handle files with spaces in names', async () => {
      const spaceSample = JSON.parse(JSON.stringify(sampleH264));
      spaceSample._id = '/path/to/file with spaces.mp4';
      baseArgs.inputFileObj = spaceSample;

      const result = await plugin(baseArgs);

      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        '/path/to/file with spaces.mp4',
        '/tmp/workdir/file with spaces.mp4',
        expect.any(Function),
      );
      expect(result.outputFileObj._id).toBe('/tmp/workdir/file with spaces.mp4');
    });

    it('should handle files with special characters', async () => {
      const specialSample = JSON.parse(JSON.stringify(sampleH264));
      specialSample._id = '/path/to/file[2023]-test.mp4';
      baseArgs.inputFileObj = specialSample;

      const result = await plugin(baseArgs);

      expect(baseArgs.deps.ncp).toHaveBeenCalledWith(
        '/path/to/file[2023]-test.mp4',
        '/tmp/workdir/file[2023]-test.mp4',
        expect.any(Function),
      );
      expect(result.outputFileObj._id).toBe('/tmp/workdir/file[2023]-test.mp4');
    });
  });

  describe('Variables and Return Values', () => {
    it('should preserve variables in the output', async () => {
      const testVariables = {
        ffmpegCommand: {} as IpluginInputArgs['variables']['ffmpegCommand'],
        flowFailed: false,
        user: { testKey: 'testValue' },
      };
      baseArgs.variables = testVariables;

      const result = await plugin(baseArgs);

      expect(result.variables).toBe(testVariables);
    });

    it('should always return output number 1', async () => {
      const result1 = await plugin(baseArgs);
      expect(result1.outputNumber).toBe(1);

      // Test with same path scenario
      baseArgs.workDir = 'C:/Transcode/Source Folder';
      const result2 = await plugin(baseArgs);
      expect(result2.outputNumber).toBe(1);
    });
  });

  describe('Logging', () => {
    it('should log input and output paths', async () => {
      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Input path: ${baseArgs.inputFileObj._id}`);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Output path: /tmp/workdir');
    });

    it('should log skip message when paths are same', async () => {
      baseArgs.workDir = 'C:/Transcode/Source Folder';

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('Input and output path are the same, skipping copy.');
    });
  });

  describe('Error Handling', () => {
    it('should propagate copy file errors when all methods fail', async () => {
      // Make ncp fail
      const mockFailingNcp = jest.fn((source, dest, callback) => {
        callback(new Error('ncp failed'));
      });
      baseArgs.deps.ncp = mockFailingNcp;

      // Make copyFile fail
      mockCopyFile.mockRejectedValue(new Error('copyFile failed'));

      // Make getFileSize fail on the destination to simulate unsuccessful copy
      mockGetFileSize
        .mockResolvedValueOnce(1048576) // source file size
        .mockResolvedValueOnce(0) // destination file size after ncp (failed)
        .mockResolvedValueOnce(0); // destination file size after copyFile (failed)

      await expect(plugin(baseArgs)).rejects.toThrow('Failed to copy file');
    });

    it('should ensure directory even if copy fails', async () => {
      // Make ncp fail
      const mockFailingNcp = jest.fn((source, dest, callback) => {
        callback(new Error('ncp failed'));
      });
      baseArgs.deps.ncp = mockFailingNcp;

      // Make copyFile fail
      mockCopyFile.mockRejectedValue(new Error('Copy failed'));

      // Make getFileSize return mismatched sizes to simulate failure
      mockGetFileSize
        .mockResolvedValueOnce(1048576) // source file size
        .mockResolvedValueOnce(0) // destination file size after ncp (failed)
        .mockResolvedValueOnce(0); // destination file size after copyFile (failed)

      try {
        await plugin(baseArgs);
      } catch (error) {
        // Expected to throw
      }

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/tmp/workdir');
    });

    it('should fallback to copyFile when ncp fails', async () => {
      // Make ncp fail
      const mockFailingNcp = jest.fn((source, dest, callback) => {
        callback(new Error('ncp failed'));
      });
      baseArgs.deps.ncp = mockFailingNcp;

      // Make copyFile succeed
      mockCopyFile.mockResolvedValue(undefined);

      // Make getFileSize return matching sizes for copyFile
      mockGetFileSize
        .mockResolvedValueOnce(1048576) // source file size
        .mockResolvedValueOnce(0) // destination file size after ncp (failed)
        .mockResolvedValueOnce(1048576); // destination file size after copyFile (success)

      const result = await plugin(baseArgs);

      expect(mockFailingNcp).toHaveBeenCalled();
      expect(mockCopyFile).toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(expect.stringContaining('Attempting copy from'));
    });
  });
});
