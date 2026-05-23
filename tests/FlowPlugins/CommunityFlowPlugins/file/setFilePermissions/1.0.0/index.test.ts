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
    stat: jest.fn(),
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

const getMockStat = (mode: number, uid: number, gid: number) => ({
  mode,
  uid,
  gid,
} as never);

type MockWithCallOrder = {
  mock: {
    invocationCallOrder: number[],
  },
};

const expectCalledBefore = (first: MockWithCallOrder, second: MockWithCallOrder): void => {
  expect(first.mock.invocationCallOrder[0]).toBeLessThan(
    second.mock.invocationCallOrder[0],
  );
};

describe('setFilePermissions Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.chmod.mockResolvedValue();
    mockFs.chown.mockResolvedValue();
    mockFs.stat.mockResolvedValue(getMockStat(0o100600, 2000, 2001));

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
      platform: 'linux',
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Original File Source', () => {
    it('should copy permissions and owner/group from the original file to the working file', async () => {
      const result = await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expectCalledBefore(mockFs.chown, mockFs.chmod);
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should update original file permissions and skip matching owner/group when selected', async () => {
      baseArgs.inputs.fileToUpdate = 'originalFile';
      mockFs.stat.mockResolvedValueOnce(getMockStat(0o100640, 1000, 1001));

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/library/original_movie.mkv', 0o640);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping owner/group update because current owner/group already matches original file: 1000:1001',
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Updating originalFile: /library/original_movie.mkv');
    });

    it('should still copy original owner/group when the selected original file ownership differs', async () => {
      baseArgs.inputs.fileToUpdate = 'originalFile';
      mockFs.stat.mockResolvedValueOnce(getMockStat(0o100640, 2000, 2001));

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/library/original_movie.mkv', 0o640);
      expect(mockFs.chown).toHaveBeenCalledWith('/library/original_movie.mkv', 1000, 1001);
      expectCalledBefore(mockFs.chown, mockFs.chmod);
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
      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockFs.chown).not.toHaveBeenCalled();
    });

    it('should apply owner/group before original special-bit permissions', async () => {
      baseArgs.originalLibraryFile.statSync = {
        mode: 0o104755,
        uid: 1000,
        gid: 1001,
      } as unknown as IFileObject['statSync'];

      await plugin(baseArgs);

      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o4755);
      expectCalledBefore(mockFs.chown, mockFs.chmod);
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
      expectCalledBefore(mockExecFile, mockFs.chmod);
    });

    it('should copy permissions from original file and leave working file owner/group unchanged', async () => {
      baseArgs.inputs.ownerGroupSource = 'unchanged';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file owner/group unchanged');
    });

    it('should leave working file permissions unchanged and copy original owner/group', async () => {
      baseArgs.inputs.permissionSource = 'unchanged';
      mockFs.stat.mockResolvedValueOnce(getMockStat(0o104755, 2000, 2001));

      await plugin(baseArgs);

      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o4755);
      expectCalledBefore(mockFs.chown, mockFs.chmod);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file permissions unchanged');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Restoring unchanged permissions: 4755');
    });

    it('should not restore unchanged permissions when matching owner/group is skipped', async () => {
      baseArgs.inputs.permissionSource = 'unchanged';
      mockFs.stat.mockResolvedValueOnce(getMockStat(0o104755, 1000, 1001));

      await plugin(baseArgs);

      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file permissions unchanged');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping owner/group update because current owner/group already matches original file: 1000:1001',
      );
      expect(baseArgs.jobLog).not.toHaveBeenCalledWith('Restoring unchanged permissions: 4755');
    });

    it('should leave the selected original file unchanged when unchanged sources are selected', async () => {
      baseArgs.inputs.fileToUpdate = 'originalFile';
      baseArgs.inputs.permissionSource = 'unchanged';
      baseArgs.inputs.ownerGroupSource = 'unchanged';

      await plugin(baseArgs);

      expect(mockFs.chmod).not.toHaveBeenCalled();
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving original file permissions unchanged');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving original file owner/group unchanged');
    });

    it('should leave working file permissions unchanged and set custom owner/group', async () => {
      baseArgs.inputs.permissionSource = 'unchanged';
      baseArgs.inputs.ownerGroupSource = 'custom';
      baseArgs.inputs.customUser = 'tdarr';
      baseArgs.inputs.customGroup = 'media';
      mockFs.stat.mockResolvedValueOnce(getMockStat(0o101777, 2000, 2001));

      await plugin(baseArgs);

      expect(mockExecFile).toHaveBeenCalledWith(
        'chown',
        ['tdarr:media', '/cache/transcoded_movie.mkv'],
        expect.any(Function),
      );
      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o1777);
      expectCalledBefore(mockExecFile, mockFs.chmod);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Leaving working file permissions unchanged');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Restoring unchanged permissions: 1777');
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

    it('should skip owner/group changes on Windows and still apply permissions', async () => {
      baseArgs.platform = 'win32';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping original file owner/group on Windows because changing file ownership is not supported',
      );
    });

    it('should not require original uid/gid when owner/group is skipped on Windows', async () => {
      baseArgs.platform = 'win32';
      baseArgs.originalLibraryFile.statSync = {
        mode: 0o100640,
      } as unknown as IFileObject['statSync'];

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o640);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping original file owner/group on Windows because changing file ownership is not supported',
      );
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
      expectCalledBefore(mockExecFile, mockFs.chmod);
    });

    it('should accept a custom mode with 0o prefix', async () => {
      baseArgs.inputs.customPermissions = '0o664';
      baseArgs.inputs.ownerGroupSource = 'unchanged';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o664);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should accept a custom mode with leading zero', async () => {
      baseArgs.inputs.customPermissions = '0755';
      baseArgs.inputs.ownerGroupSource = 'unchanged';

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
      expectCalledBefore(mockFs.chown, mockFs.chmod);
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should set custom permissions on the original file without a matching owner/group chown', async () => {
      baseArgs.inputs.fileToUpdate = 'originalFile';
      baseArgs.inputs.customPermissions = '775';
      baseArgs.inputs.ownerGroupSource = 'originalFile';
      mockFs.stat.mockResolvedValueOnce(getMockStat(0o100640, 1000, 1001));

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/library/original_movie.mkv', 0o775);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping owner/group update because current owner/group already matches original file: 1000:1001',
      );
    });

    it('should apply owner/group before custom permissions to preserve special bits', async () => {
      baseArgs.inputs.customPermissions = '4755';
      baseArgs.inputs.ownerGroupSource = 'originalFile';

      await plugin(baseArgs);

      expect(mockFs.chown).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 1000, 1001);
      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o4755);
      expectCalledBefore(mockFs.chown, mockFs.chmod);
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
      expect(mockFs.chmod).not.toHaveBeenCalled();
    });

    it('should reject colon-separated custom user input', async () => {
      baseArgs.inputs.customUser = 'tdarr:media';

      await expect(plugin(baseArgs)).rejects.toThrow(
        "Custom user cannot contain ':'. Enter the user and group in separate inputs.",
      );
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(mockFs.chmod).not.toHaveBeenCalled();
    });

    it('should reject custom owner/group values that chown can parse as options', async () => {
      baseArgs.inputs.customUser = '--reference=/tmp/reference-file';

      await expect(plugin(baseArgs)).rejects.toThrow(
        "Custom owner/group cannot start with '-' because chown can parse it as an option.",
      );
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(mockFs.chmod).not.toHaveBeenCalled();
    });

    it('should skip custom owner/group changes on Windows and still apply permissions', async () => {
      baseArgs.platform = 'win32';
      baseArgs.inputs.customPermissions = '775';
      baseArgs.inputs.customUser = 'tdarr';
      baseArgs.inputs.customGroup = 'media';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o775);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping custom owner/group on Windows because changing file ownership is not supported',
      );
    });

    it('should skip Windows custom owner/group before chown-specific validation', async () => {
      baseArgs.platform = 'win32';
      baseArgs.inputs.customPermissions = '775';
      baseArgs.inputs.customUser = '--reference=/tmp/reference-file';
      baseArgs.inputs.customGroup = '';

      await plugin(baseArgs);

      expect(mockFs.chmod).toHaveBeenCalledWith('/cache/transcoded_movie.mkv', 0o775);
      expect(mockFs.chown).not.toHaveBeenCalled();
      expect(mockExecFile).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Skipping custom owner/group on Windows because changing file ownership is not supported',
      );
    });
  });
});
