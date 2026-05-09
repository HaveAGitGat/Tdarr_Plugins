import { plugin, details } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/automations/preventSleepWhileEncoding/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const mockExecSync = jest.fn();
const mockSpawn = jest.fn().mockReturnValue({ kill: jest.fn() });
const mockExec = jest.fn();

jest.mock('child_process', () => ({
  execSync: (...a: unknown[]) => mockExecSync(...a),
  spawn: (...a: unknown[]) => mockSpawn(...a),
  exec: (...a: unknown[]) => mockExec(...a),
}));

const flush = () => new Promise<void>((r) => { setImmediate(r); });

const advanceOnePoll = async () => {
  jest.advanceTimersByTime(10000);
  await flush();
  await flush();
};

describe('preventSleepWhileEncoding Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockAxiosGet: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    mockAxiosGet = jest.fn();
    mockExecSync.mockReset();
    mockSpawn.mockReset().mockReturnValue({ kill: jest.fn() });
    mockExec.mockReset();

    baseArgs = {
      inputs: {
        pollIntervalSeconds: '10',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      updateWorker: jest.fn(),
      platform: 'linux',
      configVars: getConfigVars(),
      job: { jobId: 'my-job-1' },
      deps: {
        axios: {
          get: mockAxiosGet,
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
    expect(d.name).toBe('Prevent Sleep While Encoding');
    expect(d.inputs.length).toBe(1);
    expect(d.outputs.length).toBe(1);
    expect(d.tags).toContain('automations');
  });

  it('should exit after 3 consecutive no-workers confirmations', async () => {
    mockAxiosGet.mockResolvedValue({
      data: {
        123: {
          workers: {
            w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
          },
        },
      },
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 3; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    const result = await pluginPromise;
    expect(result.outputNumber).toBe(1);
    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      expect.stringContaining('No other workers running'),
    );
  });

  it('should reset confirmation count when workers appear', async () => {
    let callCount = 0;
    mockAxiosGet.mockImplementation(() => {
      callCount += 1;
      const hasOtherWorker = callCount === 3;
      return Promise.resolve({
        data: {
          123: {
            workers: {
              w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
              ...(hasOtherWorker ? { w2: { job: { jobId: 'other-job' }, file: 'real.mkv' } } : {}),
            },
          },
        },
      });
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 6; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    const result = await pluginPromise;
    expect(result.outputNumber).toBe(1);
    expect(callCount).toBe(6);
  });

  it('should bump percentage each iteration', async () => {
    mockAxiosGet.mockResolvedValue({
      data: {
        123: {
          workers: {
            w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
          },
        },
      },
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 3; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    await pluginPromise;

    expect(baseArgs.updateWorker).toHaveBeenCalledWith({ percentage: 0 });
    expect(baseArgs.updateWorker).toHaveBeenCalledWith({ percentage: 1 });
    expect(baseArgs.updateWorker).toHaveBeenCalledWith({ percentage: 2 });
  });

  it('should skip automation workers when counting', async () => {
    mockAxiosGet.mockResolvedValue({
      data: {
        123: {
          workers: {
            w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
            w2: { job: { jobId: 'auto-job' }, file: '/.tdarr/automation-cfg1-run1.txt' },
          },
        },
      },
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 3; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    const result = await pluginPromise;
    expect(result.outputNumber).toBe(1);
  });

  describe('Sleep Prevention', () => {
    it('should start systemd-inhibit on linux', async () => {
      mockAxiosGet.mockResolvedValue({
        data: { 123: { workers: { w1: { job: { jobId: 'my-job-1' } } } } },
      });

      const pluginPromise = plugin(baseArgs);
      await flush();
      for (let i = 0; i < 3; i += 1) {
        await advanceOnePoll(); // eslint-disable-line no-await-in-loop
      }
      await pluginPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'systemd-inhibit',
        expect.arrayContaining(['--what=idle:sleep']),
        expect.any(Object),
      );
    });

    it('should use SetThreadExecutionState on win32', async () => {
      baseArgs.platform = 'win32';

      mockAxiosGet.mockResolvedValue({
        data: { 123: { workers: { w1: { job: { jobId: 'my-job-1' } } } } },
      });

      const pluginPromise = plugin(baseArgs);
      await flush();
      for (let i = 0; i < 3; i += 1) {
        await advanceOnePoll(); // eslint-disable-line no-await-in-loop
      }
      await pluginPromise;

      // spawn starts a long-running PowerShell that refreshes the state
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell',
        expect.arrayContaining([expect.stringContaining('SetThreadExecutionState')]),
        expect.any(Object),
      );
      // execSync is only used for the cleanup (clear) call
      expect(mockExecSync).toHaveBeenCalledTimes(1);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('SetThreadExecutionState'),
        expect.any(Object),
      );
    });

    it('should use caffeinate on darwin', async () => {
      baseArgs.platform = 'darwin';

      mockAxiosGet.mockResolvedValue({
        data: { 123: { workers: { w1: { job: { jobId: 'my-job-1' } } } } },
      });

      const mockKill = jest.fn();
      mockSpawn.mockReturnValue({ kill: mockKill });

      const pluginPromise = plugin(baseArgs);
      await flush();
      for (let i = 0; i < 3; i += 1) {
        await advanceOnePoll(); // eslint-disable-line no-await-in-loop
      }
      await pluginPromise;

      expect(mockSpawn).toHaveBeenCalledWith('caffeinate', ['-i'], expect.any(Object));
      expect(mockKill).toHaveBeenCalled();
    });
  });
});
