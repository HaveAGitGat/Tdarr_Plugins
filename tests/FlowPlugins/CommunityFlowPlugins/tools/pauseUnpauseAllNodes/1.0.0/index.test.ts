import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/pauseUnpauseAllNodes/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('Pause/Unpause All Nodes Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCrudTransDBN: jest.MockedFunction<
    (db: string, operation: string, collection: string, data: Record<string, unknown>) => Promise<unknown>
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCrudTransDBN = jest.fn().mockResolvedValue({});

    baseArgs = {
      inputs: {
        pause: 'false',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
      deps: {
        parseArgsStringToArgv: jest.fn(),
        fsextra: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: jest.fn(),
        gracefulfs: jest.fn(),
        mvdir: jest.fn(),
        ncp: jest.fn(),
        axios: jest.fn(),
        crudTransDBN: mockCrudTransDBN,
        configVars: {
          config: {
            serverIP: 'localhost',
            serverPort: '8265',
          },
        },
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it.each([
      ['false', false],
      ['true', true],
      [false, false],
      [true, true],
    ])('should handle pause input %s and set pauseAllNodes to %s', async (input, expected) => {
      baseArgs.inputs.pause = input;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'SettingsGlobalJSONDB',
        'update',
        'globalsettings',
        { pauseAllNodes: expected },
      );
    });
  });

  describe('Default Values', () => {
    it('should use default value when pause input is undefined', async () => {
      delete baseArgs.inputs.pause;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'SettingsGlobalJSONDB',
        'update',
        'globalsettings',
        { pauseAllNodes: false },
      );
    });

    it('should use default value when inputs is empty', async () => {
      baseArgs.inputs = {};

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'SettingsGlobalJSONDB',
        'update',
        'globalsettings',
        { pauseAllNodes: false },
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database update errors gracefully', async () => {
      mockCrudTransDBN.mockRejectedValue(new Error('Database error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Database error');
    });
  });

  describe('Return Values', () => {
    it('should always return output number 1 and preserve input data', async () => {
      const originalFileObj = baseArgs.inputFileObj;
      const originalVariables = baseArgs.variables;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(originalFileObj);
      expect(result.variables).toBe(originalVariables);
    });
  });
});
