import { plugin, details } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/automations/runAutomation/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const flush = () => new Promise<void>((r) => { setImmediate(r); });

const advanceOnePoll = async () => {
  jest.advanceTimersByTime(5000);
  await flush();
  await flush();
};

describe('runAutomation Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockAxiosGet: jest.Mock;
  let mockAxiosPost: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    mockAxiosGet = jest.fn();
    mockAxiosPost = jest.fn().mockResolvedValue({ status: 200, data: { success: true } });

    baseArgs = {
      inputs: {
        configId: 'test-config-123',
        payload: '{"key":"value"}',
        skipIfRunning: 'disabled',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      configVars: getConfigVars(),
      deps: {
        axios: {
          get: mockAxiosGet,
          post: mockAxiosPost,
        },
        configVars: getConfigVars(),
      },
    } as unknown as IpluginInputArgs;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should export details with correct structure', () => {
    const d = details();
    expect(d.name).toBe('Run Automation');
    expect(d.inputs.length).toBe(5);
    expect(d.outputs.length).toBe(1);
  });

  it('should trigger automation with configId, payload, targetNodeIds, and libraryIds (defaults)', async () => {
    const result = await plugin(baseArgs);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8266/api/v2/run-automation',
      {
        data: {
          configId: 'test-config-123', payload: { key: 'value' }, targetNodeIds: ['123'], libraryIds: ['2MY5YD7P8'],
        },
      },
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(result.outputNumber).toBe(1);
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Targeting this node: 123');
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Targeting this library: 2MY5YD7P8');
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Automation test-config-123 triggered');
  });

  it('should not send targetNodeIds when targetNode is automationDefault', async () => {
    baseArgs.inputs.targetNode = 'automationDefault';
    const result = await plugin(baseArgs);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8266/api/v2/run-automation',
      { data: { configId: 'test-config-123', payload: { key: 'value' }, libraryIds: ['2MY5YD7P8'] } },
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(result.outputNumber).toBe(1);
    expect(baseArgs.jobLog).not.toHaveBeenCalledWith(expect.stringContaining('Targeting this node'));
  });

  it('should send libraryIds when targetLibrary is currentLibrary', async () => {
    baseArgs.inputs.targetLibrary = 'currentLibrary';
    const result = await plugin(baseArgs);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8266/api/v2/run-automation',
      {
        data: {
          configId: 'test-config-123', payload: { key: 'value' }, targetNodeIds: ['123'], libraryIds: ['2MY5YD7P8'],
        },
      },
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(result.outputNumber).toBe(1);
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Targeting this library: 2MY5YD7P8');
  });

  it('should not send libraryIds when targetLibrary is automationDefault', async () => {
    baseArgs.inputs.targetLibrary = 'automationDefault';
    await plugin(baseArgs);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8266/api/v2/run-automation',
      { data: { configId: 'test-config-123', payload: { key: 'value' }, targetNodeIds: ['123'] } },
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(baseArgs.jobLog).not.toHaveBeenCalledWith(expect.stringContaining('Targeting this library'));
  });

  it('should throw if no configId provided', async () => {
    baseArgs.inputs.configId = '';
    await expect(plugin(baseArgs)).rejects.toThrow('No automation config ID provided');
  });

  it('should throw on non-200 response', async () => {
    mockAxiosPost.mockResolvedValue({ status: 500, data: {} });
    await expect(plugin(baseArgs)).rejects.toThrow('Automation trigger failed with status 500');
  });

  it('should throw on error in response data', async () => {
    mockAxiosPost.mockResolvedValue({ status: 200, data: { error: 'Forbidden' } });
    await expect(plugin(baseArgs)).rejects.toThrow('Automation trigger failed: Forbidden');
  });

  it('should default payload to empty object', async () => {
    baseArgs.inputs.payload = '';
    await plugin(baseArgs);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      {
        data: {
          configId: 'test-config-123', payload: {}, targetNodeIds: ['123'], libraryIds: ['2MY5YD7P8'],
        },
      },
      expect.any(Object),
    );
  });

  describe('Skip If Already Running', () => {
    it('should not check when disabled', async () => {
      baseArgs.inputs.skipIfRunning = 'disabled';
      await plugin(baseArgs);

      expect(mockAxiosGet).not.toHaveBeenCalled();
      expect(mockAxiosPost).toHaveBeenCalled();
    });

    describe('onAnyNode', () => {
      beforeEach(() => {
        baseArgs.inputs.skipIfRunning = 'onAnyNode';
      });

      it('should skip on first poll if automation is running', async () => {
        mockAxiosGet.mockResolvedValue({
          data: {
            node1: {
              workers: {
                w1: { idle: false, job: { footprintId: 'test-config-123' } },
              },
            },
          },
        });

        const pluginPromise = plugin(baseArgs);
        await flush();

        const result = await pluginPromise;

        expect(result.outputNumber).toBe(1);
        expect(mockAxiosPost).not.toHaveBeenCalled();
        expect(mockAxiosGet).toHaveBeenCalledTimes(1);
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          'Automation test-config-123 is already running, skipping',
        );
      });

      it('should trigger after 3 polls confirm not running', async () => {
        mockAxiosGet.mockResolvedValue({
          data: {
            node1: {
              workers: {
                w1: { idle: false, job: { footprintId: 'other-config' } },
              },
            },
          },
        });

        const pluginPromise = plugin(baseArgs);
        await flush();

        // First poll happens immediately, then 2 more with 5s delays
        for (let i = 0; i < 2; i += 1) {
          await advanceOnePoll(); // eslint-disable-line no-await-in-loop
        }

        await pluginPromise;

        expect(mockAxiosGet).toHaveBeenCalledTimes(3);
        expect(mockAxiosPost).toHaveBeenCalled();
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          'Automation test-config-123 confirmed not running (3/3 checks)',
        );
      });

      it('should skip if automation appears on second poll', async () => {
        let callCount = 0;
        mockAxiosGet.mockImplementation(() => {
          callCount += 1;
          const isRunning = callCount === 2;
          return Promise.resolve({
            data: {
              node1: {
                workers: {
                  w1: {
                    idle: false,
                    job: { footprintId: isRunning ? 'test-config-123' : 'other' },
                  },
                },
              },
            },
          });
        });

        const pluginPromise = plugin(baseArgs);
        await flush();
        await advanceOnePoll();

        const result = await pluginPromise;

        expect(result.outputNumber).toBe(1);
        expect(mockAxiosPost).not.toHaveBeenCalled();
        expect(callCount).toBe(2);
      });

      it('should not skip if worker is idle', async () => {
        mockAxiosGet.mockResolvedValue({
          data: {
            node1: {
              workers: {
                w1: { idle: true, job: { footprintId: 'test-config-123' } },
              },
            },
          },
        });

        const pluginPromise = plugin(baseArgs);
        await flush();
        for (let i = 0; i < 2; i += 1) {
          await advanceOnePoll(); // eslint-disable-line no-await-in-loop
        }

        await pluginPromise;
        expect(mockAxiosPost).toHaveBeenCalled();
      });

      it('should handle nodes with no workers', async () => {
        mockAxiosGet.mockResolvedValue({
          data: { node1: {} },
        });

        const pluginPromise = plugin(baseArgs);
        await flush();
        for (let i = 0; i < 2; i += 1) {
          await advanceOnePoll(); // eslint-disable-line no-await-in-loop
        }

        await pluginPromise;
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    describe('onCurrentNode', () => {
      beforeEach(() => {
        baseArgs.inputs.skipIfRunning = 'onCurrentNode';
      });

      it('should skip if automation is running on this node', async () => {
        mockAxiosGet.mockResolvedValue({
          data: {
            123: {
              workers: {
                w1: { idle: false, job: { footprintId: 'test-config-123' } },
              },
            },
          },
        });

        const pluginPromise = plugin(baseArgs);
        await flush();

        const result = await pluginPromise;

        expect(result.outputNumber).toBe(1);
        expect(mockAxiosPost).not.toHaveBeenCalled();
      });

      it('should not skip if automation is running on a different node', async () => {
        mockAxiosGet.mockResolvedValue({
          data: {
            123: {
              workers: {},
            },
            otherNode: {
              workers: {
                w1: { idle: false, job: { footprintId: 'test-config-123' } },
              },
            },
          },
        });

        const pluginPromise = plugin(baseArgs);
        await flush();
        for (let i = 0; i < 2; i += 1) {
          await advanceOnePoll(); // eslint-disable-line no-await-in-loop
        }

        await pluginPromise;
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });
});
