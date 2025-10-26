import { Readable } from 'stream';
import { plugin } from '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/calculateFileHash/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

// Mocks
jest.mock('fs', () => ({
  createReadStream: jest.fn((path: string) => {
    const mockStream = new Readable();
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-empty-function
    mockStream._read = () => {}; // Stub the internal _read method

    process.nextTick(() => {
      if (path === 'does-not-exist') {
        // Simulate a file-not-found error
        const mockError = new Error(
          `ENOENT: no such file or directory, open '${path}'`,
        );
        mockStream.emit('error', mockError);
      } else {
        mockStream.push(Buffer.from(path));
        mockStream.push(null); // Signal EOF
      }
    });

    return mockStream;
  }),
  realpathSync: jest.fn((path: string) => path),
}));

describe('calculateFileHash Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test

    baseArgs = {
      inputs: {
        variable: '',
        operation: '',
        quantity: '',
      },
      variables: { user: {} } as IpluginInputArgs['variables'],
      inputFileObj: {
        _id: '/test/source/video.mp4',
      } as IFileObject,
      originalLibraryFile: {
        _id: '/test/cache/video.mp4',
      } as IFileObject,
      jobLog: jest.fn(),
      thisPlugin: {
        inputsDB: {
          variable: '',
          operation: '',
          quantity: '',
        },
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Calculate File Hash', () => {
    it('should calculate the hash in md5', async () => {
      baseArgs.inputs.algorithm = 'md5';
      baseArgs.inputs.filePath = '/test/source/video.mp4';
      baseArgs.inputs.variable = 'file_hash';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Calculating the md5 hash of /test/source/video.mp4 and recording it in file_hash',
      );
      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.file_hash).toBe(
        'f5d53235348f3a768a4e1a80ce19f99d',
      );
    });

    it('should calculate the hash in sha1', async () => {
      baseArgs.inputs.algorithm = 'sha1';
      baseArgs.inputs.filePath = '/test/source/video.mp4';
      baseArgs.inputs.variable = 'file_hash';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Calculating the sha1 hash of /test/source/video.mp4 and recording it in file_hash',
      );
      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.file_hash).toBe(
        '4a6e278f7937ef44e479e39c4fa54a43eff8cf46',
      );
    });

    it('should calculate the hash in sha256', async () => {
      baseArgs.inputs.algorithm = 'sha256';
      baseArgs.inputs.filePath = '/test/source/video.mp4';
      baseArgs.inputs.variable = 'file_hash';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Calculating the sha256 hash of /test/source/video.mp4 and recording it in file_hash',
      );
      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.file_hash).toBe(
        '8a8fbe015b2de5983735b977887f7c2cbe4d7f73aa5ce9e408c73a697d52b381',
      );
    });

    it('should calculate the hash in sha512', async () => {
      baseArgs.inputs.algorithm = 'sha512';
      baseArgs.inputs.filePath = '/test/source/video.mp4';
      baseArgs.inputs.variable = 'file_hash';

      // eslint-disable-next-line max-len
      const expectedHash = '269f4c0a861fa0898e8a6669dc5b7bcb8c871976e980fd34f5eef02caa2102c02384aabf2f84be2b7109888ed5b03b213e5f3f01e1126fce3ee6eaa2ed42c3b7';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Calculating the sha512 hash of /test/source/video.mp4 and recording it in file_hash',
      );
      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.file_hash).toBe(expectedHash);
    });
  });

  describe('Error Handling', () => {
    it('should throw an error if file does not exist', async () => {
      baseArgs.inputs.algorithm = 'md5';
      baseArgs.inputs.filePath = 'does-not-exist';
      baseArgs.inputs.variable = 'file_hash';

      await expect(plugin(baseArgs)).rejects.toThrow(
        'Error calculating file hash: Error reading file for hashing:'
        + " ENOENT: no such file or directory, open 'does-not-exist'",
      );
    });
  });
});
