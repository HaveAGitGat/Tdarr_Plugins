import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/moveToDirectory/2.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock fileMoveOrCopy helper
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy', () => jest.fn());
const fileMoveOrCopy = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileMoveOrCopy');

describe('moveToDirectory Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        outputDirectory: '/output/directory',
        keepRelativePath: 'false',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      originalLibraryFile: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: '/source/folder/subfolder/SampleVideo_1280x720_1mb.mp4',
      } as IFileObject,
      librarySettings: {
        folder: '/source/folder',
      },
      deps: {
        upath: {
          join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
          joinSafe: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
        },
        fsextra: {
          ensureDirSync: jest.fn(),
        },
      },
      jobLog: jest.fn(),
    } as unknown as IpluginInputArgs;

    // Reset mock
    fileMoveOrCopy.mockReset();
    fileMoveOrCopy.mockResolvedValue(true);
  });

  describe('Basic Operations', () => {
    it('should move file to specified directory without keeping relative path', async () => {
      const result = await plugin(baseArgs);

      expect(fileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: baseArgs.inputFileObj._id,
        destinationPath: '/output/directory/SampleVideo_1280x720_1mb.mp4',
        args: baseArgs,
      });
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/output/directory/SampleVideo_1280x720_1mb.mp4');
      expect(baseArgs.deps.fsextra.ensureDirSync).toHaveBeenCalledWith('/output/directory');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Input path: ${baseArgs.inputFileObj._id}`,
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Output path: /output/directory/SampleVideo_1280x720_1mb.mp4',
      );
    });

    it('should move file while keeping relative path', async () => {
      baseArgs.inputs.keepRelativePath = 'true';

      const result = await plugin(baseArgs);

      expect(fileMoveOrCopy).toHaveBeenCalledWith({
        operation: 'move',
        sourcePath: baseArgs.inputFileObj._id,
        destinationPath: '/output/directory/subfolder/SampleVideo_1280x720_1mb.mp4',
        args: baseArgs,
      });
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe('/output/directory/subfolder/SampleVideo_1280x720_1mb.mp4');
      expect(baseArgs.deps.fsextra.ensureDirSync).toHaveBeenCalledWith('/output/directory/subfolder');
    });

    it('should skip move when input and output paths are the same', async () => {
      baseArgs.inputs.outputDirectory = 'C:/Transcode/Source Folder';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4';

      const result = await plugin(baseArgs);

      expect(fileMoveOrCopy).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Input and output path are the same, skipping move.',
      );
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toBe(baseArgs.inputFileObj._id);
    });

    it('should preserve original variables in output', async () => {
      baseArgs.variables.user.someVar = 'testValue';
      baseArgs.variables.user.anotherVar = '123';

      const result = await plugin(baseArgs);

      expect(result.variables).toEqual(baseArgs.variables);
    });
  });

  describe('Path Handling', () => {
    it('should handle nested relative paths when keepRelativePath is true', async () => {
      baseArgs.inputs.keepRelativePath = 'true';
      baseArgs.originalLibraryFile._id = '/source/folder/deep/nested/path/video.mp4';
      baseArgs.inputFileObj._id = '/source/folder/deep/nested/path/video.mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/output/directory/deep/nested/path/video.mp4');
      expect(baseArgs.deps.fsextra.ensureDirSync).toHaveBeenCalledWith('/output/directory/deep/nested/path');
    });

    it('should handle files with complex names and special characters', async () => {
      baseArgs.inputFileObj._id = '/source/[Movie] Title (2023) - Special.Edition.mkv';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/output/directory/[Movie] Title (2023) - Special.Edition.mkv');
    });

    it('should handle empty output directory', async () => {
      baseArgs.inputs.outputDirectory = '';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/SampleVideo_1280x720_1mb.mp4');
    });
  });

  describe('Input Type Handling', () => {
    it.each([
      ['boolean true', true, '/output/directory/subfolder/SampleVideo_1280x720_1mb.mp4'],
      ['boolean false', false, '/output/directory/SampleVideo_1280x720_1mb.mp4'],
      ['string "true"', 'true', '/output/directory/subfolder/SampleVideo_1280x720_1mb.mp4'],
      ['string "false"', 'false', '/output/directory/SampleVideo_1280x720_1mb.mp4'],
    ])('should handle keepRelativePath as %s', async (_, keepRelativePath, expectedPath) => {
      baseArgs.inputs.keepRelativePath = keepRelativePath;

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe(expectedPath);
    });

    it.each([
      ['/path/file.mp4', 'mp4'],
      ['/path/file.mkv', 'mkv'],
      ['/path/file.avi', 'avi'],
      ['/path/file.mov', 'mov'],
      ['/path/file.webm', 'webm'],
      ['/path/file.m4v', 'm4v'],
    ])('should preserve file extension for %s', async (inputPath, expectedContainer) => {
      baseArgs.inputFileObj._id = inputPath;

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe(`/output/directory/file.${expectedContainer}`);
    });
  });
});
