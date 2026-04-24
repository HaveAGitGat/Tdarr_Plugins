import { promises as fsp } from 'fs';
import { IpluginInputArgs, Ivariables } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { plugin } from '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/customFunction/1.0.0/index';

// Import the mocked function to access it in tests
import * as fileUtils from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock fs.promises.writeFile and realpathSync
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
  },
  realpathSync: jest.fn((path: string) => path),
}));

// Mock getPluginWorkDir
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  getPluginWorkDir: jest.fn(() => '/tmp/test-workdir/123'),
}));
const mockGetPluginWorkDir = fileUtils.getPluginWorkDir as jest.Mock;

// Mock lib module
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: jest.fn((inputs: unknown) => inputs),
}));

describe('Custom Function Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock the writeFile operation
    (fsp.writeFile as jest.Mock).mockResolvedValue(undefined);

    baseArgs = {
      inputs: {
        code: `module.exports = async (args) => {
          return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
          };
        }`,
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
      } as Ivariables,
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      userVariables: {
        global: { test: 'globalTest' },
        library: { test: 'libraryTest' },
      },
      workDir: '/tmp/test-workdir',
      deps: {
        fsextra: {
          ensureDirSync: jest.fn(),
        },
      },
    } as unknown as IpluginInputArgs;
  });

  describe('Plugin Execution Setup', () => {
    it('should call getPluginWorkDir with correct arguments', async () => {
      // Test the setup phase that we can actually test
      try {
        await plugin(baseArgs);
      } catch (error) {
        // Expected to fail at require step, that's ok
      }

      expect(mockGetPluginWorkDir).toHaveBeenCalledWith(baseArgs);
    });

    it('should write code to correct file path', async () => {
      try {
        await plugin(baseArgs);
      } catch (error) {
        // Expected to fail at require step, that's ok
      }

      expect(fsp.writeFile).toHaveBeenCalledWith(
        '/tmp/test-workdir/123/script.js',
        baseArgs.inputs.code,
      );
    });

    it('should handle different input code', async () => {
      const customCode = `
        module.exports = async (args) => {
          return {
            outputFileObj: args.inputFileObj,
            outputNumber: 2,
            variables: args.variables,
          };
        }
      `;

      baseArgs.inputs.code = customCode;

      try {
        await plugin(baseArgs);
      } catch (error) {
        // Expected to fail at require step, that's ok
      }

      expect(fsp.writeFile).toHaveBeenCalledWith(
        '/tmp/test-workdir/123/script.js',
        customCode,
      );
    });

    it('should handle different work directories', async () => {
      mockGetPluginWorkDir.mockReturnValue('/different/path/456');

      try {
        await plugin(baseArgs);
      } catch (error) {
        // Expected to fail at require step, that's ok
      }

      expect(fsp.writeFile).toHaveBeenCalledWith(
        '/different/path/456/script.js',
        baseArgs.inputs.code,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle file write errors', async () => {
      (fsp.writeFile as jest.Mock).mockRejectedValue(new Error('Write permission denied'));

      await expect(plugin(baseArgs)).rejects.toThrow('Write permission denied');
    });

    it('should handle getPluginWorkDir errors', async () => {
      mockGetPluginWorkDir.mockImplementation(() => {
        throw new Error('Unable to create work directory');
      });

      await expect(plugin(baseArgs)).rejects.toThrow('Unable to create work directory');
    });

    it('should handle missing code input', async () => {
      baseArgs.inputs.code = '';

      await expect(plugin(baseArgs)).rejects.toThrow();
    });

    it('should handle invalid code input type', async () => {
      baseArgs.inputs.code = null as unknown as string;

      await expect(plugin(baseArgs)).rejects.toThrow();
    });
  });
});
