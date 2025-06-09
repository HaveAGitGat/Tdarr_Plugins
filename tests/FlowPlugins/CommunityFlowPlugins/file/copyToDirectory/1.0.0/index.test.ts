import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/copyToDirectory/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

// Mocks
jest.mock('fs', () => ({
  promises: {
    copyFile: jest.fn(),
  },
  realpathSync: jest.fn((path: string) => path),
}));

// Mock the methods/lib module
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: (inputs: Record<string, unknown>, details: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detailsFunc = details as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaults = detailsFunc().inputs.reduce((acc: Record<string, unknown>, input: any) => {
      acc[input.name] = input.defaultValue;
      return acc;
    }, {});
    return { ...defaults, ...inputs };
  },
}));

const mockEnsureDirSync = jest.fn();
const mockCopyFile = jest.fn();

describe('copyToDirectory Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();

    baseArgs = {
      inputs: {
        outputDirectory: '/output/directory',
        keepRelativePath: false,
        makeWorkingFile: false,
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
        _id: '/test/source/video.mp4',
      } as IFileObject,
      originalLibraryFile: {
        _id: '/test/source/video.mp4',
      } as IFileObject,
      librarySettings: {
        folder: '/test',
      },
      jobLog: jest.fn(),
      deps: {
        fsextra: {
          ensureDirSync: mockEnsureDirSync,
        },
        upath: {
          join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
          joinSafe: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
          normalize: (path: string) => path,
        },
      },
    } as unknown as IpluginInputArgs;

    // Mock fs.promises.copyFile
    require('fs').promises.copyFile = mockCopyFile;
  });

  describe('Basic Operations', () => {
    it('should copy file to output directory without relative path', async () => {
      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/output/directory');
      expect(mockCopyFile).toHaveBeenCalledWith(
        '/test/source/video.mp4',
        '/output/directory/video.mp4',
      );
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/test/source/video.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Input path: /test/source/video.mp4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Output path: /output/directory');
    });

    it('should copy file with relative path preserved when keepRelativePath is true', async () => {
      baseArgs.inputs.keepRelativePath = true;

      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/output/directory/source');
      expect(mockCopyFile).toHaveBeenCalledWith(
        '/test/source/video.mp4',
        '/output/directory/source/video.mp4',
      );
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Output path: /output/directory/source');
    });

    it('should make copied file the working file when makeWorkingFile is true', async () => {
      baseArgs.inputs.makeWorkingFile = true;

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/output/directory/video.mp4');
    });

    it('should skip copy when input and output paths are the same', async () => {
      baseArgs.inputFileObj._id = '/output/directory/video.mp4';
      baseArgs.inputs.outputDirectory = '/output/directory';

      const result = await plugin(baseArgs);

      expect(mockCopyFile).not.toHaveBeenCalled();
      expect(mockEnsureDirSync).not.toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Input and output path are the same, skipping copy.');
    });
  });

  describe('Path Handling', () => {
    it('should handle different file extensions correctly', async () => {
      baseArgs.inputFileObj._id = '/test/source/video.mkv';
      baseArgs.originalLibraryFile._id = '/test/source/video.mkv';

      const result = await plugin(baseArgs);

      expect(mockCopyFile).toHaveBeenCalledWith(
        '/test/source/video.mkv',
        '/output/directory/video.mkv',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should handle files in nested directories', async () => {
      baseArgs.inputs.keepRelativePath = true;
      baseArgs.inputFileObj._id = '/test/movies/action/film.mp4';
      baseArgs.originalLibraryFile._id = '/test/movies/action/film.mp4';

      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/output/directory/movies/action');
      expect(mockCopyFile).toHaveBeenCalledWith(
        '/test/movies/action/film.mp4',
        '/output/directory/movies/action/film.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle both keepRelativePath and makeWorkingFile true together', async () => {
      baseArgs.inputs.keepRelativePath = true;
      baseArgs.inputs.makeWorkingFile = true;
      baseArgs.inputFileObj._id = '/test/source/video.mp4';
      baseArgs.originalLibraryFile._id = '/test/source/video.mp4';

      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('/output/directory/source');
      expect(mockCopyFile).toHaveBeenCalledWith(
        '/test/source/video.mp4',
        '/output/directory/source/video.mp4',
      );
      expect(result.outputFileObj._id).toBe('/output/directory/source/video.mp4');
    });

    it('should preserve variables in output', async () => {
      baseArgs.variables.user = { testVar: 'testValue' };

      const result = await plugin(baseArgs);

      expect(result.variables.user).toEqual({ testVar: 'testValue' });
    });

    it('should handle empty output directory', async () => {
      baseArgs.inputs.outputDirectory = '';

      const result = await plugin(baseArgs);

      expect(mockEnsureDirSync).toHaveBeenCalledWith('');
      expect(mockCopyFile).toHaveBeenCalledWith(
        '/test/source/video.mp4',
        '/video.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });
});
