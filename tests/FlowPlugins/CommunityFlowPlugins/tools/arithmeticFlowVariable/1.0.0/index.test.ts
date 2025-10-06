import { plugin } from '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/arithmeticFlowVariable/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('arithmeticFlowVariable Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        variable: '',
        operation: '',
        quantity: '',
      },
      variables: { user: {} } as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Addition', () => {
    it('add 1 to a variable originally set to 1 to become 2', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '1';

      baseArgs.variables.user.existingVar = '1';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('2');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation + 1 to existingVar of value 1',
      );
    });
  });

  describe('Substraction', () => {
    it('substract 1 from a variable originally set to 2 to become 1', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '-';
      baseArgs.inputs.quantity = '1';

      baseArgs.variables.user.existingVar = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('1');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation - 1 to existingVar of value 2',
      );
    });
  });

  describe('Multiplication', () => {
    it('multiply 2 with a variable originally set to 2 to become 4', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '*';
      baseArgs.inputs.quantity = '2';

      baseArgs.variables.user.existingVar = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation * 2 to existingVar of value 2',
      );
    });
  });

  describe('Division', () => {
    it('division 2 with a variable originally set to 4 to become 2', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '/';
      baseArgs.inputs.quantity = '2';

      baseArgs.variables.user.existingVar = '4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('2');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation / 2 to existingVar of value 4',
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when variable does not exist', () => {
      baseArgs.inputs.variable = 'nonExistentVar';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '1';

      expect(() => plugin(baseArgs)).toThrow('Variable "nonExistentVar" does not exist');
    });

    it('should throw error when quantity is not a valid number', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = 'abc';

      baseArgs.variables.user.existingVar = '1';

      expect(() => plugin(baseArgs)).toThrow('Quantity "abc" is not a valid number');
    });

    it('should throw error when variable value is not a valid number', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '1';

      baseArgs.variables.user.existingVar = 'notANumber';

      expect(() => plugin(baseArgs)).toThrow('Variable "existingVar" with value "notANumber" is not a valid number');
    });

    it('should throw error when dividing by zero', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '/';
      baseArgs.inputs.quantity = '0';

      baseArgs.variables.user.existingVar = '10';

      expect(() => plugin(baseArgs)).toThrow('Division by zero is not allowed');
    });

    it('should throw error for invalid operation', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '%';
      baseArgs.inputs.quantity = '2';

      baseArgs.variables.user.existingVar = '10';

      expect(() => plugin(baseArgs)).toThrow('The operation % is invalid');
    });
  });

  describe('Decimal Support', () => {
    it('should handle decimal addition correctly', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '1.5';

      baseArgs.variables.user.existingVar = '2.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('4');
    });

    it('should handle decimal multiplication correctly', () => {
      baseArgs.inputs.variable = 'existingVar';
      baseArgs.inputs.operation = '*';
      baseArgs.inputs.quantity = '1.5';

      baseArgs.variables.user.existingVar = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('3');
    });
  });
});
