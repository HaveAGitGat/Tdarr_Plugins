import { execFile } from 'child_process';
import { promises as fsp } from 'fs';
import { plugin } from '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/setFilePermissions/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('fs', () => ({
  promises: {
    chmod: jest.fn(),
    chown: jest.fn(),
  },
}));

jest.mock('child_process', () => ({
  execFile: jest.fn((...execArgs: unknown[]) => {
    const callback = execArgs[2] as (error: Error | null, stdout: string, stderr: string) => void;
    callback(null, '', '');
  }),
}));

jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: require('../../../../../../methods/loadDefaultValues'),
}));

const mockFs = fsp as jest.Mocked<typeof fsp>;
const mockExecFile = execFile as unknown as jest.Mock;

describe('setFilePermissions Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.chmod.mockResolvedValue();
    mockFs.chown.mockResolvedValue();

    baseArgs = {
      inputs: {
        fileToUpdate: 'workingFile',
        permissionSource: 'originalFile',
        ownerGroupSource: 'originalFile',
        customPermissions: '664',
        customUser: '',
        customGroup: '',
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
        _id: '/cache/transcoded_movie.mkv',
      } as IFileObject,
      originalLibraryFile: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: '/library/original_movie.mkv',
        statSync: {
          mode: 0o100640,
          uid: 1000,
          gid: 1001,
        },
      } as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Original File Source', () => {
    it('should copy permissions and owner/group from the original file to the working file', async () => {
      const result = await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should update the original file when selected', async () => {
      baseArgs.inputs.fileToUpdate = 'originalFile';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/library/original_movie.mkv', 0o640);
      expect(mockFs.chown).toHaveBeenCalledWith('/library/original_movie.mkv', 1000, 1001);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Updating originalFile: /library/original_movie.mkv');
    });

    it('should throw when original stat data does not include mode', async () => {
      baseArgs.originalLibraryFile.statSync = {
        uid: 1000,
        gid: 1001,
      } as unknown as IFileObject['statSync'];

      await expect(plugin(baseArgs)).rejects.toThrow('Original file stat data does not include a valid mode.');
      expect(mockFs.chmod).not.toHaveBeenCalled();
    });

    it('should throw when original stat data does not include uid/gid', async () => {
      baseArgs.originalLibraryFile.statSync = {
        mode: 0o100640,
      } as unknown as IFileObject['statSync'];

      await expect(plugin(baseArgs)).rejects.toThrow('Original file stat data does not include a valid uid/gid.');
      expect(mockFs.chown).not.toHaveBeenCalled();
    });

    it('should copy permissions from original file with custom owner/group', async () => {
      baseArgs.inputs.ownerGroupSource = 'custom';
      baseArgs.inputs.customUser = 'tdarr';
      baseArgs.inputs.customGroup = 'media';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledWith(
        'chown',
        ['tdarr:media', '/cache/transcoded_movie.mkv'],
        expect.any(Function),
      );
    });

    it('should copy permissions from original file and leave working file owner/group unchanged', async () => {
      baseArgs.inputs.ownerGroupSource = 'workingFile';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file owner/group unchanged');
    });

    it('should leave working file permissions unchanged and copy original owner/group', async () => {
      baseArgs.inputs.permissionSource = 'workingFile';

      await plugin(baseArgs);

      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file permissions unchanged');
    });

    it('should leave working file permissions unchanged and set custom owner/group', async () => {
      baseArgs.inputs.permissionSource = 'workingFile';
      baseArgs.inputs.ownerGroupSource = 'custom';
      baseArgs.inputs.customUser = 'tdarr';
      baseArgs.inputs.customGroup = 'media';

      await plugin(baseArgs);

      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledWith(
        'chown',
        ['tdarr:media', '/cache/transcoded_movie.mkv'],
        expect.any(Function),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file permissions unchanged');
    });

    it('should throw a clear error when original stat data is missing', async () => {
      baseArgs.originalLibraryFile = {
        ...baseArgs.originalLibraryFile,
        statSync: undefined,
      } as unknown as IFileObject;

      await expect(plugin(baseArgs)).rejects.toThrow('Original file stat data does not include a valid mode.');
      expect(mockFs.chmod).not.toHaveBeenCalled();
    });

    it('should throw for an invalid permissions source', async () => {
      baseArgs.inputs.permissionSource = 'sameAsOriginal';

      await expect(plugin(baseArgs)).rejects.toThrow('Invalid permissions source: sameAsOriginal');
      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockFs.chown).not.toHaveBeenCalled();
    });

    it('should throw for an invalid owner/group source', async () => {
      baseArgs.inputs.ownerGroupSource = 'sameAsOriginal';

      await expect(plugin(baseArgs)).rejects.toThrow('Invalid owner/group source: sameAsOriginal');
      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockFs.chown).not.toHaveBeenCalled();
    });

    it('should throw for an invalid file to update', async () => {
      baseArgs.inputs.fileToUpdate = 'currentFile';

      await expect(plugin(baseArgs)).rejects.toThrow('Invalid file to update: currentFile');
      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockFs.chown).not.toHaveBeenCalled();
    });
  });

  describe('Custom Source', () => {
    beforeEach(() => {
      baseArgs.inputs.permissionSource = 'custom';
      baseArgs.inputs.ownerGroupSource = 'custom';
    });

    it('should set custom permissions and custom owner/group', async () => {
      baseArgs.inputs.customPermissions = '775';
      baseArgs.inputs.customUser = 'tdarr';
      baseArgs.inputs.customGroup = 'media';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o775);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledWith(
        'chown',
        ['tdarr:media', '/cache/transcoded_movie.mkv'],
        expect.any(Function),
      );
    });

    it('should accept a custom mode with 0o prefix', async () => {
      baseArgs.inputs.customPermissions = '0o664';
      baseArgs.inputs.ownerGroupSource = 'workingFile';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o664);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should accept a custom mode with leading zero', async () => {
      baseArgs.inputs.customPermissions = '0755';
      baseArgs.inputs.ownerGroupSource = 'workingFile';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o755);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should set custom permissions and copy original owner/group', async () => {
      baseArgs.inputs.customPermissions = '775';
      baseArgs.inputs.ownerGroupSource = 'originalFile';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o775);
      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should set only a custom user when group is blank', async () => {
      baseArgs.inputs.customUser = '1000';
      baseArgs.inputs.customGroup = '';

      await plugin(baseArgs);

      expect(mockExecFile).toHaveBeenCalledWith(
        'chown',
        ['1000', '/cache/transcoded_movie.mkv'],
        expect.any(Function),
      );
    });

    it('should set only a custom group when user is blank', async () => {
      baseArgs.inputs.customUser = '';
      baseArgs.inputs.customGroup = 'media';

      await plugin(baseArgs);

      expect(mockExecFile).toHaveBeenCalledWith(
        'chown',
        [':media', '/cache/transcoded_movie.mkv'],
        expect.any(Function),
      );
    });

    it('should skip custom owner/group when user and group are blank', async () => {
      baseArgs.inputs.customPermissions = '644';
      baseArgs.inputs.customUser = ' ';
      baseArgs.inputs.customGroup = '';

      await plugin(baseArgs);

      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Skipping custom owner/group because user and group are blank');
    });

    it('should throw for invalid custom permissions', async () => {
      baseArgs.inputs.customPermissions = '999';

      await expect(plugin(baseArgs)).rejects.toThrow(
        'Custom permissions must be an octal value such as 664, 775, or 1777.',
      );
      expect(mockFs.chmod).not.toHaveBeenCalled();
    });

    it('should propagate chown command errors', async () => {
      baseArgs.inputs.customUser = 'tdarr';
      mockExecFile.mockImplementationOnce((...execArgs: unknown[]) => {
        const callback = execArgs[2] as (error: Error) => void;
        callback(new Error('Operation not permitted'));
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Operation not permitted');
    });

    it('should reject colon-separated custom user input', async () => {
      baseArgs.inputs.customUser = 'tdarr:media';

      await expect(plugin(baseArgs)).rejects.toThrow(
        "Custom user cannot contain ':'. Enter the user and group in separate inputs.",
      );
      expect(mockExecFile).not.toHaveBeenCalled();
    });
  });
});
