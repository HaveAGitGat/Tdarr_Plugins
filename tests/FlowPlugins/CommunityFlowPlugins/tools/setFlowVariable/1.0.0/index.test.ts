import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/setFlowVariable/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('setFlowVariable Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        variable: 'testVariable',
        value: 'testValue',
      },
      variables: { user: {} } as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Functionality', () => {
    it('should set a basic string variable', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.user.testVariable).toBe('testValue');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable testVariable to testValue');
    });

    it('should overwrite existing variables', () => {
      baseArgs.variables.user.existingVar = 'oldValue';
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.value = 'newValue';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('newValue');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable existingVar to newValue');
    });

    it('should preserve other variables in user object', () => {
      baseArgs.variables.user.existingVar1 = 'keep1';
      baseArgs.variables.user.existingVar2 = 'keep2';
      baseArgs.inputs.variable = 'newVar';
      baseArgs.inputs.value = 'newValue';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar1).toBe('keep1');
      expect(result.variables.user.existingVar2).toBe('keep2');
      expect(result.variables.user.newVar).toBe('newValue');
    });

    it('should preserve other variables properties', () => {
      baseArgs.variables.flowFailed = true;

      const result = plugin(baseArgs);

      expect(result.variables.flowFailed).toBe(true);
      expect(result.variables.user.testVariable).toBe('testValue');
    });
  });

  describe('Variable Name Handling', () => {
    it('should handle complex variable names', () => {
      baseArgs.inputs.variable = 'transcodeStage_CPU_Attempt';
      baseArgs.inputs.value = 'nvenc';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.transcodeStage_CPU_Attempt).toBe('nvenc');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable transcodeStage_CPU_Attempt to nvenc');
    });

    it('should trim variable names', () => {
      baseArgs.inputs.variable = '  trimmedVar  ';
      baseArgs.inputs.value = 'valueForTrimmed';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.trimmedVar).toBe('valueForTrimmed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable trimmedVar to valueForTrimmed');
    });

    it('should handle empty variable name after trimming', () => {
      baseArgs.inputs.variable = '   ';
      baseArgs.inputs.value = 'someValue';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user['']).toBe('someValue');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable  to someValue');
    });
  });

  describe('Value Handling', () => {
    it('should handle empty values', () => {
      baseArgs.inputs.variable = 'emptyVar';
      baseArgs.inputs.value = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.emptyVar).toBe('');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable emptyVar to ');
    });

    it('should handle values with spaces (trimmed by lib.loadDefaultValues)', () => {
      baseArgs.inputs.variable = 'spaceVar';
      baseArgs.inputs.value = '  value with spaces  ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.spaceVar).toBe('value with spaces');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable spaceVar to value with spaces');
    });

    it.each([
      { type: 'numeric', input: 123, expected: '123' },
      { type: 'boolean', input: true, expected: 'true' },
      { type: 'null', input: null, expected: 'null' },
      { type: 'undefined', input: undefined, expected: '' },
    ])('should handle $type input values', ({ input, expected }) => {
      baseArgs.inputs.variable = 'testVar';
      baseArgs.inputs.value = input as unknown as string;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.testVar).toBe(expected);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(`Setting variable testVar to ${expected}`);
    });
  });

  describe('Edge Cases', () => {
    it('should create user object if it does not exist', () => {
      const originalUser = baseArgs.variables.user;
      baseArgs.variables.user = undefined as unknown as Record<string, string>;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user).toBeDefined();
      expect(result.variables.user.testVariable).toBe('testValue');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Setting variable testVariable to testValue');

      baseArgs.variables.user = originalUser;
    });

    it('should work with sequential variable updates', () => {
      baseArgs.inputs.variable = 'attemptNumber';
      baseArgs.inputs.value = '1';

      let result = plugin(baseArgs);
      expect(result.variables.user.attemptNumber).toBe('1');

      baseArgs.inputs.value = '2';
      baseArgs.variables = result.variables;

      result = plugin(baseArgs);
      expect(result.variables.user.attemptNumber).toBe('2');
      expect(baseArgs.jobLog).toHaveBeenLastCalledWith('Setting variable attemptNumber to 2');
    });

    it('should maintain file object integrity', () => {
      const originalFileObj = JSON.parse(JSON.stringify(baseArgs.inputFileObj));

      const result = plugin(baseArgs);

      expect(result.outputFileObj).toEqual(originalFileObj);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });
});
