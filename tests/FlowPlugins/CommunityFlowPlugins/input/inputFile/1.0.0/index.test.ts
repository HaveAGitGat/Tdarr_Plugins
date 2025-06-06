import { promises as fsp } from 'fs';
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/input/inputFile/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock fs.promises.access
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    constants: {
      R_OK: 4,
      W_OK: 2,
    },
  },
  realpathSync: jest.fn((path: string) => path),
}));

// Mock axios
const mockAxios = jest.fn();

describe('Input File Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockJobLog: jest.Mock;

  beforeEach(() => {
    mockJobLog = jest.fn();

    const originalFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
    originalFile._id = '/path/to/test/file.mp4';

    baseArgs = {
      inputs: {
        fileAccessChecks: false,
        pauseNodeIfAccessChecksFail: false,
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: originalFile,
      librarySettings: {
        cache: '/path/to/cache',
      },
      deps: {
        configVars: {
          config: {
            serverIP: 'localhost',
            serverPort: '8266',
          },
        },
        axios: mockAxios,
        fsextra: {},
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        lib: {},
        loadModule: jest.fn(),
        updateStat: jest.fn(),
        scanIndividualFile: jest.fn(),
      },
      jobLog: mockJobLog,
    } as unknown as IpluginInputArgs;

    // Mock process.argv
    process.argv[8] = 'test-node-id';

    // Clear all mocks
    jest.clearAllMocks();
    (fsp.access as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('should pass through input file without access checks', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(mockJobLog).toHaveBeenCalledWith('Skipping file access checks');
      expect(fsp.access).not.toHaveBeenCalled();
    });

    it('should perform access checks when enabled', async () => {
      baseArgs.inputs.fileAccessChecks = true;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(mockJobLog).toHaveBeenCalledWith('Checking file access');
      expect(fsp.access).toHaveBeenCalledTimes(4); // 2 locations × 2 permissions each
    });
  });

  describe('File Access Checks', () => {
    beforeEach(() => {
      baseArgs.inputs.fileAccessChecks = true;
    });

    it('should check read and write permissions for original folder and cache', async () => {
      await plugin(baseArgs);

      expect(fsp.access).toHaveBeenCalledTimes(4);
      expect(fsp.access).toHaveBeenCalledWith('/path/to/test', fsp.constants.R_OK);
      expect(fsp.access).toHaveBeenCalledWith('/path/to/test', fsp.constants.W_OK);
      expect(fsp.access).toHaveBeenCalledWith('/path/to/cache', fsp.constants.R_OK);
      expect(fsp.access).toHaveBeenCalledWith('/path/to/cache', fsp.constants.W_OK);
    });

    it.each([
      ['original folder', '/path/to/test', fsp.constants.R_OK, 'Location not readable:/path/to/test'],
      ['original folder', '/path/to/test', fsp.constants.W_OK, 'Location not writeable:/path/to/test'],
      ['cache', '/path/to/cache', fsp.constants.R_OK, 'Location not readable:/path/to/cache'],
      ['cache', '/path/to/cache', fsp.constants.W_OK, 'Location not writeable:/path/to/cache'],
    ])('should throw error when %s access fails', async (location, path, mode, expectedError) => {
      (fsp.access as jest.Mock).mockImplementation((checkPath, checkMode) => {
        if (checkPath === path && checkMode === mode) {
          throw new Error('Permission denied');
        }
        return Promise.resolve();
      });

      await expect(plugin(baseArgs)).rejects.toThrow(expectedError);
      expect(mockJobLog).toHaveBeenCalledWith('{}');
    });
  });

  describe('Node Pausing Functionality', () => {
    beforeEach(() => {
      baseArgs.inputs.fileAccessChecks = true;
      baseArgs.inputs.pauseNodeIfAccessChecksFail = true;
      mockAxios.mockResolvedValue({ data: 'success' });
    });

    it('should pause node when access check fails and pauseNodeIfAccessChecksFail is true', async () => {
      (fsp.access as jest.Mock).mockImplementation((path, mode) => {
        if (path === '/path/to/test' && mode === fsp.constants.R_OK) {
          throw new Error('Permission denied');
        }
        return Promise.resolve();
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Location not readable:/path/to/test');

      expect(mockJobLog).toHaveBeenCalledWith('Pausing node');
      expect(mockJobLog).toHaveBeenCalledWith('Node paused');
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://localhost:8266/api/v2/update-node',
        headers: {},
        data: {
          data: {
            nodeID: 'test-node-id',
            nodeUpdates: {
              nodePaused: true,
            },
          },
        },
      });
    });

    it('should not pause node when access check fails but pauseNodeIfAccessChecksFail is false', async () => {
      baseArgs.inputs.pauseNodeIfAccessChecksFail = false;

      (fsp.access as jest.Mock).mockImplementation((path, mode) => {
        if (path === '/path/to/test' && mode === fsp.constants.R_OK) {
          throw new Error('Permission denied');
        }
        return Promise.resolve();
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Location not readable:/path/to/test');

      expect(mockJobLog).not.toHaveBeenCalledWith('Pausing node');
      expect(mockAxios).not.toHaveBeenCalled();
    });

    it('should handle axios errors gracefully when pausing node', async () => {
      mockAxios.mockRejectedValue(new Error('Network error'));

      (fsp.access as jest.Mock).mockImplementation((path, mode) => {
        if (path === '/path/to/test' && mode === fsp.constants.R_OK) {
          throw new Error('Permission denied');
        }
        return Promise.resolve();
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Network error');

      expect(mockJobLog).toHaveBeenCalledWith('Pausing node');
      expect(mockAxios).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      baseArgs.inputs.fileAccessChecks = true;
    });

    it.each([
      ['empty originalLibraryFile path', () => {
        const emptyFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
        emptyFile._id = '';
        baseArgs.originalLibraryFile = emptyFile;
      }],
      ['empty cache path', () => {
        baseArgs.librarySettings.cache = '';
      }],
    ])('should handle %s gracefully', async (description, setup) => {
      setup();

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(fsp.access).toHaveBeenCalledWith('', fsp.constants.R_OK);
    });

    it('should handle missing nodeID when pausing', async () => {
      delete process.argv[8];
      baseArgs.inputs.pauseNodeIfAccessChecksFail = true;
      mockAxios.mockResolvedValue({ data: 'success' });

      (fsp.access as jest.Mock).mockImplementation((path, mode) => {
        if (path.includes('/path/to/test') && mode === fsp.constants.R_OK) {
          throw new Error('Permission denied');
        }
        return Promise.resolve();
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Location not readable');

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            data: {
              nodeID: undefined,
              nodeUpdates: {
                nodePaused: true,
              },
            },
          },
        }),
      );
    });
  });
});
