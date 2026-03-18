import { plugin, details } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/automations/detectNonTdarrNvenc/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const mockExecSync = jest.fn();
const mockExec = jest.fn();

jest.mock('child_process', () => ({
  execSync: (...a: unknown[]) => mockExecSync(...a),
  exec: (...a: unknown[]) => mockExec(...a),
}));

const flush = () => new Promise<void>((r) => { setImmediate(r); });

const advanceOnePoll = async () => {
  jest.advanceTimersByTime(10000);
  await flush();
  await flush();
};

describe('detectNonTdarrNvenc Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockAxiosGet: jest.Mock;

  const pmonNoEnc = '# gpu        pid  type    sm   mem   enc   dec   jpg  command\n'
    + '    0       1234     C     5     3     0     0     -   someapp\n';

  const pmonWithNvenc = '# gpu        pid  type    sm   mem   enc   dec   jpg  command\n'
    + '    0       5678     C     5     3    42     0     -   obs\n';

  const pmonWithTdarrFfmpeg = '# gpu        pid  type    sm   mem   enc   dec   jpg  command\n'
    + '    0       9999     C     5     3    80     0     -   ffmpeg\n';

  const mockNoOtherWorkers = () => {
    mockAxiosGet.mockResolvedValue({
      data: {
        123: {
          workers: {
            w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
          },
        },
      },
    });
  };

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    mockAxiosGet = jest.fn();
    mockExecSync.mockReset();
    mockExec.mockReset();

    baseArgs = {
      inputs: {
        pollIntervalSeconds: '10',
        lowPriority: 'low',
        normalPriority: 'normal',
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
    expect(d.name).toContain('NVENC');
    expect(d.inputs.length).toBe(3);
    expect(d.outputs.length).toBe(1);
    expect(d.tags).toContain('automations');
  });

  it('should exit after 3 consecutive no-workers confirmations', async () => {
    mockNoOtherWorkers();
    mockExecSync.mockReturnValue(pmonNoEnc);

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

  it('should set low priority when non-Tdarr NVENC detected', async () => {
    let callCount = 0;
    mockAxiosGet.mockImplementation(() => {
      callCount += 1;
      const hasOtherWorker = callCount <= 2;
      return Promise.resolve({
        data: {
          123: {
            workers: {
              w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
              ...(hasOtherWorker ? { w2: { job: { jobId: 'other' }, file: 'real.mkv' } } : {}),
            },
          },
        },
      });
    });

    let execCount = 0;
    mockExecSync.mockImplementation(() => {
      execCount += 1;
      return execCount === 1 ? pmonWithNvenc : pmonNoEnc;
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 5; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    await pluginPromise;

    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      expect.stringContaining('Non-Tdarr NVENC detected'),
    );
    expect(mockExec).toHaveBeenCalled();
  });

  it('should restore priority when non-Tdarr NVENC stops', async () => {
    let callCount = 0;
    mockAxiosGet.mockImplementation(() => {
      callCount += 1;
      const hasOtherWorker = callCount <= 2;
      return Promise.resolve({
        data: {
          123: {
            workers: {
              w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
              ...(hasOtherWorker ? { w2: { job: { jobId: 'other' }, file: 'real.mkv' } } : {}),
            },
          },
        },
      });
    });

    let execCount = 0;
    mockExecSync.mockImplementation(() => {
      execCount += 1;
      return execCount === 1 ? pmonWithNvenc : pmonNoEnc;
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 5; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    await pluginPromise;

    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      expect.stringContaining('restoring priority to normal'),
    );
  });

  it('should not count Tdarr ffmpeg as non-Tdarr NVENC', async () => {
    mockNoOtherWorkers();
    mockExecSync.mockReturnValue(pmonWithTdarrFfmpeg);

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 3; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    await pluginPromise;

    expect(baseArgs.jobLog).not.toHaveBeenCalledWith(
      expect.stringContaining('Non-Tdarr NVENC detected'),
    );
  });

  it('should handle nvidia-smi failure gracefully', async () => {
    mockNoOtherWorkers();
    mockExecSync.mockImplementation(() => {
      throw new Error('nvidia-smi not found');
    });

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 3; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    const result = await pluginPromise;
    expect(result.outputNumber).toBe(1);
  });

  it('should restore priority on exit if still lowered', async () => {
    let callCount = 0;
    mockAxiosGet.mockImplementation(() => {
      callCount += 1;
      const hasOtherWorker = callCount <= 1;
      return Promise.resolve({
        data: {
          123: {
            workers: {
              w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
              ...(hasOtherWorker ? { w2: { job: { jobId: 'other' }, file: 'real.mkv' } } : {}),
            },
          },
        },
      });
    });

    mockExecSync.mockReturnValue(pmonWithNvenc);

    const pluginPromise = plugin(baseArgs);
    await flush();

    for (let i = 0; i < 4; i += 1) {
      await advanceOnePoll(); // eslint-disable-line no-await-in-loop
    }

    await pluginPromise;

    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      expect.stringContaining('Restoring priority to normal on exit'),
    );
  });

  describe('Priority on Windows', () => {
    it('should use powershell commands on win32', async () => {
      baseArgs.platform = 'win32';

      let callCount = 0;
      mockAxiosGet.mockImplementation(() => {
        callCount += 1;
        const hasOtherWorker = callCount <= 1;
        return Promise.resolve({
          data: {
            123: {
              workers: {
                w1: { job: { jobId: 'my-job-1' }, file: 'something.mkv' },
                ...(hasOtherWorker ? { w2: { job: { jobId: 'other' }, file: 'real.mkv' } } : {}),
              },
            },
          },
        });
      });

      mockExecSync.mockReturnValue(pmonWithNvenc);

      const pluginPromise = plugin(baseArgs);
      await flush();

      for (let i = 0; i < 4; i += 1) {
        await advanceOnePoll(); // eslint-disable-line no-await-in-loop
      }

      await pluginPromise;

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('PriorityClass'),
        expect.any(Object),
        expect.any(Function),
      );
    });
  });
});
