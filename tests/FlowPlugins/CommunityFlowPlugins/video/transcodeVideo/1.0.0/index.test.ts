import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
    copyFile: jest.fn(),
  },
  existsSync: jest.fn(),
  copyFileSync: jest.fn(),
  realpathSync: jest.fn((path: string) => path),
  statSync: jest.fn(() => ({ size: 1000000 })),
}));

// Mock fileExists since it's a disk function
const mockFileExists = jest.fn();

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  ...jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils'),
  fileExists: mockFileExists,
}));

const fs = require('fs');

describe('transcodeVideo Plugin', () => {
  const { plugin } = require('../../../../../../FlowPluginsTs/CommunityFlowPlugins/video/transcodeVideo/1.0.0/index');

  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputFileObj: {
        _id: '/path/to/input/video.mp4',
        file: '/path/to/input/video.mp4',
        DB: 'test-db',
        ffProbeData: {},
        fileMedium: 'video',
        container: 'mp4',
      },
      workDir: '/tmp/work',
      deps: {},
      inputs: {
        target_codec: 'hevc',
      },
      variables: {},
      jobLog: jest.fn(),
      logOutcome: jest.fn(),
    } as unknown as IpluginInputArgs;

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockFileExists.mockResolvedValue(false);
    fs.promises.copyFile.mockResolvedValue(undefined);
    fs.promises.unlink.mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('should copy file and return new file path', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/path/to/input/video.mp4.tmp');
      expect(fs.promises.copyFile).toHaveBeenCalled();
    });

    it('should copy file from original path to temp path', async () => {
      await plugin(baseArgs);

      expect(fs.promises.copyFile).toHaveBeenCalledWith(
        '/path/to/input/video.mp4',
        '/path/to/input/video.mp4.tmp',
      );
    });

    it('should not call unlink when temp file does not exist', async () => {
      mockFileExists.mockResolvedValue(false);

      await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalled();
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it('should handle when temp file already exists', async () => {
      mockFileExists.mockResolvedValue(true);

      await plugin(baseArgs);

      expect(fs.promises.unlink).toHaveBeenCalledWith('/path/to/input/video.mp4.tmp');
      expect(fs.promises.copyFile).toHaveBeenCalled();
    });
  });

  describe('Different Target Codecs', () => {
    it('should work with hevc target codec', async () => {
      baseArgs.inputs.target_codec = 'hevc';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/path/to/input/video.mp4.tmp');
    });

    it('should work with h264 target codec', async () => {
      baseArgs.inputs.target_codec = 'h264';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/path/to/input/video.mp4.tmp');
    });
  });

  describe('File Path Handling', () => {
    it('should handle file paths with spaces', async () => {
      baseArgs.inputFileObj._id = '/path/to/input/video file.mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/path/to/input/video file.mp4.tmp');
    });

    it('should handle file paths with special characters', async () => {
      baseArgs.inputFileObj._id = '/path/to/input/video-[2023].mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/path/to/input/video-[2023].mp4.tmp');
    });

    it('should handle Windows-style paths', async () => {
      baseArgs.inputFileObj._id = 'C:\\path\\to\\input\\video.mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('C:\\path\\to\\input\\video.mp4.tmp');
    });

    it('should handle relative paths', async () => {
      baseArgs.inputFileObj._id = './input/video.mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('./input/video.mp4.tmp');
    });
  });

  describe('Error Handling', () => {
    it('should propagate copyFile errors', async () => {
      fs.promises.copyFile.mockRejectedValue(new Error('Copy failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('Copy failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file path', async () => {
      baseArgs.inputFileObj._id = '';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('.tmp');
    });

    it('should handle file path that is just an extension', async () => {
      baseArgs.inputFileObj._id = '.mp4';

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('.mp4.tmp');
    });

    it('should handle very long file paths', async () => {
      const longPath = `${'/very/long/path/'.repeat(50)}video.mp4`;
      baseArgs.inputFileObj._id = longPath;

      const result = await plugin(baseArgs);

      expect(result.outputFileObj._id).toBe(`${longPath}.tmp`);
    });
  });

  describe('Mock Verification', () => {
    it('should call fileExists with correct path', async () => {
      await plugin(baseArgs);

      expect(mockFileExists).toHaveBeenCalledWith('/path/to/input/video.mp4.tmp');
    });

    it('should call copyFile with correct paths', async () => {
      await plugin(baseArgs);

      expect(fs.promises.copyFile).toHaveBeenCalledWith(
        '/path/to/input/video.mp4',
        '/path/to/input/video.mp4.tmp',
      );
    });

    it('should call unlink when temp file exists', async () => {
      mockFileExists.mockResolvedValue(true);

      await plugin(baseArgs);

      expect(fs.promises.unlink).toHaveBeenCalledWith('/path/to/input/video.mp4.tmp');
    });
  });
});
