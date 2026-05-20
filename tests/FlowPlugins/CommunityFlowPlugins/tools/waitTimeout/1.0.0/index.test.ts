import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/waitTimeout/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');

describe('waitTimeout Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();

    baseArgs = {
      inputs: {
        amount: '1',
        unit: 'seconds',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleAAC)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Wait Functionality', () => {
    it('should wait for 1 second by default', async () => {
      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(1000);
      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 1 seconds');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 1000 milliseconds');
    });

    it('should wait for custom amount in seconds', async () => {
      baseArgs.inputs.amount = '5';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(5000);
      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 5 seconds');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 5000 milliseconds');
    });

    it('should wait for minutes', async () => {
      baseArgs.inputs.amount = '2';
      baseArgs.inputs.unit = 'minutes';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(120000);
      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 2 minutes');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 120000 milliseconds');
    });

    it('should wait for hours', async () => {
      baseArgs.inputs.amount = '1';
      baseArgs.inputs.unit = 'hours';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(3600000);
      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 1 hours');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 3600000 milliseconds');
    });
  });

  describe('Decimal Values', () => {
    it('should handle decimal seconds', async () => {
      baseArgs.inputs.amount = '0.5';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(500);
      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 0.5 seconds');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 500 milliseconds');
    });

    it('should handle decimal minutes', async () => {
      baseArgs.inputs.amount = '1.5';
      baseArgs.inputs.unit = 'minutes';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(90000);
      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 1.5 minutes');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 90000 milliseconds');
    });
  });

  describe('Logging During Wait', () => {
    it('should log waiting messages every 5 seconds', async () => {
      baseArgs.inputs.amount = '12';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);

      // Advance time step by step to see the waiting logs
      jest.advanceTimersByTime(5000); // 5 seconds
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting...');

      jest.advanceTimersByTime(5000); // 10 seconds total
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting...');

      jest.advanceTimersByTime(2000); // 12 seconds total
      await pluginPromise;

      // Should have been called at least twice for the waiting logs
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting...');
    });

    it('should stop logging after wait is complete', async () => {
      baseArgs.inputs.amount = '3';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);

      // Complete the wait
      jest.advanceTimersByTime(3000);
      await pluginPromise;

      // Clear previous calls
      (baseArgs.jobLog as jest.Mock).mockClear();

      // Advance more time - should not log anymore
      jest.advanceTimersByTime(10000);

      expect(baseArgs.jobLog).not.toHaveBeenCalledWith('Waiting...');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-numeric amount', async () => {
      baseArgs.inputs.amount = 'invalid';
      baseArgs.inputs.unit = 'seconds';

      await expect(plugin(baseArgs)).rejects.toThrow('Amount must be a number');
    });

    it('should use default value for empty amount', async () => {
      // Empty amounts get default value of '1' from lib.loadDefaultValues
      baseArgs.inputs.amount = '';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(1000); // Default is 1 second

      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 1 seconds');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 1000 milliseconds');
    });

    it('should throw error for NaN amount', async () => {
      baseArgs.inputs.amount = 'NaN';
      baseArgs.inputs.unit = 'seconds';

      await expect(plugin(baseArgs)).rejects.toThrow('Amount must be a number');
    });
  });

  describe('Variables and File Object Passthrough', () => {
    it('should pass through variables unchanged', async () => {
      baseArgs.variables = {
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
        user: { testVar: 'testValue', flowVar: 'someValue' },
      };

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(1000);

      const result = await pluginPromise;

      expect(result.variables).toEqual(baseArgs.variables);
    });

    it('should pass through input file object unchanged', async () => {
      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(1000);

      const result = await pluginPromise;

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputFileObj).toEqual(baseArgs.inputFileObj);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero wait time', async () => {
      baseArgs.inputs.amount = '0';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(0);

      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 0 seconds');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 0 milliseconds');
    });

    it('should handle large wait times', async () => {
      baseArgs.inputs.amount = '100';
      baseArgs.inputs.unit = 'hours';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(360000000); // 100 hours in milliseconds

      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 100 hours');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for 360000000 milliseconds');
    });

    it('should handle negative numbers as negative wait time', async () => {
      baseArgs.inputs.amount = '-5';
      baseArgs.inputs.unit = 'seconds';

      const pluginPromise = plugin(baseArgs);
      jest.advanceTimersByTime(0); // Negative wait time resolves immediately

      const result = await pluginPromise;

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for -5 seconds');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Waiting for -5000 milliseconds');
    });
  });
});
