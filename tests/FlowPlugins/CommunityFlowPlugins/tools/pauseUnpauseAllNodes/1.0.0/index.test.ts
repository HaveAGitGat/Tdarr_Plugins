import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/pauseUnpauseAllNodes/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('Pause/Unpause Node(s) Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockAxios: jest.Mock;
  let mockCrudTransDBN: jest.MockedFunction<
    (db: string, operation: string, collection: string, data: Record<string, unknown>) => Promise<unknown>
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCrudTransDBN = jest.fn().mockResolvedValue({});
    mockAxios = jest.fn().mockResolvedValue({});

    const configVars = getConfigVars();
    configVars.config.serverIP = '192.0.2.10';
    configVars.config.serverPort = '9999';
    configVars.config.serverURL = 'http://tdarr-server:8266/';
    configVars.config.nodeID = 'test-node-id';

    baseArgs = {
      inputs: {
        pause: 'false',
        target: 'allNodes',
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
      configVars,
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
        axios: mockAxios,
        crudTransDBN: mockCrudTransDBN,
        configVars,
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it.each([
      ['false', false],
      ['true', true],
      [false, false],
      [true, true],
    ])('should handle pause input %s and set pauseAllNodes to %s for all nodes', async (input, expected) => {
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
      expect(mockAxios).not.toHaveBeenCalled();
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`${expected ? 'Paused' : 'Unpaused'} all nodes`);
    });

    it.each([
      ['false', false],
      ['true', true],
      [false, false],
      [true, true],
    ])('should handle pause input %s and set current node paused to %s', async (input, expected) => {
      baseArgs.inputs.pause = input;
      baseArgs.inputs.target = 'currentNode';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect(mockCrudTransDBN).not.toHaveBeenCalled();
      expect(mockAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://tdarr-server:8266/api/v2/update-node',
        headers: {
          'x-api-key': '',
        },
        data: {
          data: {
            nodeID: 'test-node-id',
            nodeUpdates: {
              nodePaused: expected,
            },
          },
        },
      });
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`${expected ? 'Pausing' : 'Unpausing'} current node`);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Node ${expected ? 'paused' : 'unpaused'}`);
    });
  });

  describe('Default Values', () => {
    it('should use default values when pause and target inputs are undefined', async () => {
      delete baseArgs.inputs.pause;
      delete baseArgs.inputs.target;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'SettingsGlobalJSONDB',
        'update',
        'globalsettings',
        { pauseAllNodes: false },
      );
      expect(mockAxios).not.toHaveBeenCalled();
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
      expect(mockAxios).not.toHaveBeenCalled();
    });

    it('should default to all nodes for an unknown target value', async () => {
      baseArgs.inputs.target = 'unknownTarget';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'SettingsGlobalJSONDB',
        'update',
        'globalsettings',
        { pauseAllNodes: false },
      );
      expect(mockAxios).not.toHaveBeenCalled();
    });

    it('should use config node ID for current node requests', async () => {
      baseArgs.inputs.target = 'currentNode';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            data: {
              nodeID: 'test-node-id',
              nodeUpdates: {
                nodePaused: false,
              },
            },
          },
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database update errors gracefully for all nodes', async () => {
      mockCrudTransDBN.mockRejectedValue(new Error('Database error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Database error');
    });

    it('should handle API update errors gracefully for current node', async () => {
      baseArgs.inputs.target = 'currentNode';
      mockAxios.mockRejectedValue(new Error('API error'));

      await expect(plugin(baseArgs)).rejects.toThrow('API error');
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
