import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/comment/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('comment Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
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
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic functionality', () => {
    it('should pass through file object unchanged', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toEqual(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should handle different file types', () => {
      const customFileObj = {
        _id: 'test-id',
        file: '/path/to/test/file.mkv',
        container: 'mkv',
      } as unknown as IFileObject;

      baseArgs.inputFileObj = customFileObj;
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toEqual(customFileObj);
    });
  });

  describe('Variables and inputs', () => {
    it('should preserve user variables', () => {
      baseArgs.variables.user = {
        testVariable: 'testValue',
        anotherVariable: '123',
      };

      const result = plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.user.testVariable).toBe('testValue');
      expect(result.variables.user.anotherVariable).toBe('123');
    });

    it('should handle various input configurations', () => {
      baseArgs.inputs = { someProperty: 'someValue' };

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });

  describe('Return value validation', () => {
    it('should return correct structure and properties', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result).toHaveProperty('outputFileObj');
      expect(result).toHaveProperty('outputNumber');
      expect(result).toHaveProperty('variables');
      expect(Object.keys(result)).toHaveLength(3);
    });
  });
});
