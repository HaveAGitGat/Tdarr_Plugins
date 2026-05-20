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
      thisPlugin: {
        inputsDB: {
          variable: '',
          operation: '',
          quantity: '',
        },
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Addition', () => {
    it('add 1 to a variable originally set to 1 to become 2', () => {
      baseArgs.inputs.variable = '1';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '1';

      baseArgs.variables.user.existingVar = '1';

      // Set the original template in inputsDB
      baseArgs.thisPlugin.inputsDB.variable = '{{{baseArgs.variables.user.existingVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '1';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.existingVar).toBe('2');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation + 1 to {{{baseArgs.variables.user.existingVar}}} of value 1',
      );
    });

    it('add 5.5 to a variable originally set to 10', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '5.5';

      baseArgs.variables.user.myVar = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.myVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '5.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.myVar).toBe('15.5');
    });

    it('add negative number to a positive variable', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '-3';

      baseArgs.variables.user.testVar = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.testVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '-3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.testVar).toBe('7');
    });
  });

  describe('Subtraction', () => {
    it('subtract 3 from a variable originally set to 10', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '-';
      baseArgs.inputs.quantity = '3';

      baseArgs.variables.user.counter = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.counter}}}';
      baseArgs.thisPlugin.inputsDB.operation = '-';
      baseArgs.thisPlugin.inputsDB.quantity = '3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.counter).toBe('7');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation - 3 to {{{args.variables.user.counter}}} of value 10',
      );
    });

    it('subtract decimal from a variable', () => {
      baseArgs.inputs.variable = '20.5';
      baseArgs.inputs.operation = '-';
      baseArgs.inputs.quantity = '5.25';

      baseArgs.variables.user.value = '20.5';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.value}}}';
      baseArgs.thisPlugin.inputsDB.operation = '-';
      baseArgs.thisPlugin.inputsDB.quantity = '5.25';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.value).toBe('15.25');
    });

    it('subtract negative number (results in addition)', () => {
      baseArgs.inputs.variable = '5';
      baseArgs.inputs.operation = '-';
      baseArgs.inputs.quantity = '-3';

      baseArgs.variables.user.num = '5';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.num}}}';
      baseArgs.thisPlugin.inputsDB.operation = '-';
      baseArgs.thisPlugin.inputsDB.quantity = '-3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.num).toBe('8');
    });
  });

  describe('Multiplication', () => {
    it('multiply a variable by 3', () => {
      baseArgs.inputs.variable = '5';
      baseArgs.inputs.operation = '*';
      baseArgs.inputs.quantity = '3';

      baseArgs.variables.user.multiplier = '5';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.multiplier}}}';
      baseArgs.thisPlugin.inputsDB.operation = '*';
      baseArgs.thisPlugin.inputsDB.quantity = '3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.multiplier).toBe('15');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation * 3 to {{{args.variables.user.multiplier}}} of value 5',
      );
    });

    it('multiply by decimal value', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '*';
      baseArgs.inputs.quantity = '2.5';

      baseArgs.variables.user.scale = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.scale}}}';
      baseArgs.thisPlugin.inputsDB.operation = '*';
      baseArgs.thisPlugin.inputsDB.quantity = '2.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.scale).toBe('25');
    });

    it('multiply by zero', () => {
      baseArgs.inputs.variable = '42';
      baseArgs.inputs.operation = '*';
      baseArgs.inputs.quantity = '0';

      baseArgs.variables.user.test = '42';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.test}}}';
      baseArgs.thisPlugin.inputsDB.operation = '*';
      baseArgs.thisPlugin.inputsDB.quantity = '0';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.test).toBe('0');
    });

    it('multiply by negative number', () => {
      baseArgs.inputs.variable = '7';
      baseArgs.inputs.operation = '*';
      baseArgs.inputs.quantity = '-2';

      baseArgs.variables.user.negTest = '7';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.negTest}}}';
      baseArgs.thisPlugin.inputsDB.operation = '*';
      baseArgs.thisPlugin.inputsDB.quantity = '-2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.negTest).toBe('-14');
    });
  });

  describe('Division', () => {
    it('divide a variable by 2', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '/';
      baseArgs.inputs.quantity = '2';

      baseArgs.variables.user.divider = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.divider}}}';
      baseArgs.thisPlugin.inputsDB.operation = '/';
      baseArgs.thisPlugin.inputsDB.quantity = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.divider).toBe('5');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation / 2 to {{{args.variables.user.divider}}} of value 10',
      );
    });

    it('divide by decimal value', () => {
      baseArgs.inputs.variable = '15';
      baseArgs.inputs.operation = '/';
      baseArgs.inputs.quantity = '2.5';

      baseArgs.variables.user.ratio = '15';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.ratio}}}';
      baseArgs.thisPlugin.inputsDB.operation = '/';
      baseArgs.thisPlugin.inputsDB.quantity = '2.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.ratio).toBe('6');
    });

    it('divide negative number by positive', () => {
      baseArgs.inputs.variable = '-20';
      baseArgs.inputs.operation = '/';
      baseArgs.inputs.quantity = '4';

      baseArgs.variables.user.negDiv = '-20';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.negDiv}}}';
      baseArgs.thisPlugin.inputsDB.operation = '/';
      baseArgs.thisPlugin.inputsDB.quantity = '4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.negDiv).toBe('-5');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when dividing by zero', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '/';
      baseArgs.inputs.quantity = '0';

      baseArgs.variables.user.testVar = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.testVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '/';
      baseArgs.thisPlugin.inputsDB.quantity = '0';

      expect(() => plugin(baseArgs)).toThrow('Division by zero is not allowed');
    });

    it('should throw error when variable template is invalid', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '5';

      baseArgs.variables.user.testVar = '10';

      // Invalid template format
      baseArgs.thisPlugin.inputsDB.variable = 'invalidTemplate';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '5';

      expect(() => plugin(baseArgs)).toThrow(
        'Variable template "invalidTemplate" is invalid. Expected format: {{{args.path.to.variable}}}',
      );
    });

    it('should throw error when quantity is not a valid number', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = 'notANumber';

      baseArgs.variables.user.testVar = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.testVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = 'notANumber';

      expect(() => plugin(baseArgs)).toThrow('Quantity "notANumber" is not a valid number');
    });

    it('should throw error when variable value is not a valid number', () => {
      baseArgs.inputs.variable = 'notANumber';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '5';

      baseArgs.variables.user.testVar = 'notANumber';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.testVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '5';

      expect(() => plugin(baseArgs)).toThrow('Variable "{{{args.variables.user.testVar}}}" is not a valid number');
    });

    it('should throw error for invalid operation', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '%';
      baseArgs.inputs.quantity = '5';

      baseArgs.variables.user.testVar = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.testVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '%';
      baseArgs.thisPlugin.inputsDB.quantity = '5';

      expect(() => plugin(baseArgs)).toThrow('The operation % is invalid');
    });

    it('should throw error for empty operation string', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '';
      baseArgs.inputs.quantity = '5';

      baseArgs.variables.user.testVar = '10';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.testVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '';
      baseArgs.thisPlugin.inputsDB.quantity = '5';

      expect(() => plugin(baseArgs)).toThrow('The operation  is invalid');
    });

    it('should throw error when nested path does not exist', () => {
      baseArgs.inputs.variable = '10';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '5';

      // Create only variables.user, but not the nested path
      baseArgs.variables.user = {};

      // Template references a non-existent nested path
      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.nested.deep.value}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '5';

      expect(() => plugin(baseArgs)).toThrow('Path "variables.user.nested" does not exist in args object');
    });
  });

  describe('Different Variable Paths', () => {
    it('should work with args prefix instead of baseArgs', () => {
      baseArgs.inputs.variable = '100';
      baseArgs.inputs.operation = '+';
      baseArgs.inputs.quantity = '50';

      baseArgs.variables.user.customVar = '100';

      baseArgs.thisPlugin.inputsDB.variable = '{{{args.variables.user.customVar}}}';
      baseArgs.thisPlugin.inputsDB.operation = '+';
      baseArgs.thisPlugin.inputsDB.quantity = '50';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.user.customVar).toBe('150');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Applying the operation + 50 to {{{args.variables.user.customVar}}} of value 100',
      );
    });
  });
});
