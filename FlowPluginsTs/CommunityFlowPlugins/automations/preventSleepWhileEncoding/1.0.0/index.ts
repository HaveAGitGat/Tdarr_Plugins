import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import {
  checkOtherWorkersRunning,
  pollUntilConfirmed,
} from '../../../../FlowHelpers/1.0.0/automationUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

const details = (): IpluginDetails => ({
  name: 'Prevent Sleep While Encoding',
  description: 'Loops while other workers on this node are active, preventing the system from sleeping.'
    + ' Bumps worker percentage each iteration. Exits when no other workers are running'
    + ' (confirmed 3 times in a row).',
  style: {
    borderColor: '#FF9800',
  },
  tags: 'automations,sleep,encoding,prevent',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.64.01',
  sidebarPosition: -1,
  icon: 'faMoon',
  inputs: [
    {
      label: 'Poll Interval (seconds)',
      name: 'pollIntervalSeconds',
      type: 'number',
      defaultValue: '15',
      inputUI: {
        type: 'text',
      },
      tooltip: 'How often to check if other workers are still running.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'No other workers running - safe to continue',
    },
  ],
});

// Spawns a platform-specific process that prevents system sleep.
// Returns a cleanup function to stop it.
const startSleepPrevention = (
  platform: string,
  childProcess: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobLog: (text: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (() => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let proc: any = null;

  try {
    if (platform === 'win32') {
      // Spawn a long-running PowerShell process that calls SetThreadExecutionState
      // in a loop. The state is per-thread, so a one-shot execSync call loses it
      // when the PowerShell process exits. This keeps the thread alive and refreshes
      // the state every 30 seconds.
      // ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED = 0x80000003
      // ES_CONTINUOUS only (clear) = 0x80000000
      const psScript = 'Add-Type -MemberDefinition '
        + '\'[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);\' '
        + '-Name SleepUtil -Namespace Win32; '
        + 'while ($true) { [Win32.SleepUtil]::SetThreadExecutionState(2147483651) | Out-Null; '
        + 'Start-Sleep -Seconds 30 }';
      proc = childProcess.spawn(
        'powershell',
        ['-NoProfile', '-Command', psScript],
        { stdio: 'ignore', windowsHide: true, detached: false },
      );
      jobLog('Sleep prevention active (Windows SetThreadExecutionState, refreshing)');

      const winProc = proc;
      return () => {
        try {
          winProc.kill();
        } catch (err) {
          // cleanup best-effort
        }
        // Reset execution state via a separate PowerShell call as best-effort
        try {
          const clearCmd = 'powershell -NoProfile -Command "Add-Type -MemberDefinition '
            + '\'[DllImport(\\"kernel32.dll\\")] public static extern uint SetThreadExecutionState(uint f);\' '
            + '-Name SleepUtilClr -Namespace Win32; '
            + '[Win32.SleepUtilClr]::SetThreadExecutionState(2147483648)"';
          childProcess.execSync(clearCmd, { timeout: 10000, windowsHide: true });
        } catch (err) {
          // cleanup best-effort
        }
      };
    }

    if (platform === 'darwin') {
      // caffeinate -i prevents idle sleep, runs until killed
      proc = childProcess.spawn('caffeinate', ['-i'], {
        stdio: 'ignore',
        detached: false,
      });
      jobLog('Sleep prevention active (caffeinate)');

      const cafProc = proc;
      return () => {
        try {
          cafProc.kill();
        } catch (err) {
          // cleanup best-effort
        }
      };
    }

    // Linux: use systemd-inhibit if available
    proc = childProcess.spawn(
      'systemd-inhibit',
      ['--what=idle:sleep', '--who=Tdarr', '--why=Encoding in progress', 'sleep', 'infinity'],
      { stdio: 'ignore', detached: false },
    );
    // spawn errors are async — listen for them
    let inhibitFailed = false;
    proc.on('error', (err: Error) => {
      inhibitFailed = true;
      jobLog(`systemd-inhibit not available: ${err.message}`);
    });
    jobLog('Sleep prevention active (systemd-inhibit)');

    const inhProc = proc;
    return () => {
      if (!inhibitFailed) {
        try {
          inhProc.kill();
        } catch (err) {
          // cleanup best-effort
        }
      }
    };
  } catch (err) {
    jobLog(`Could not start sleep prevention: ${err}`);
  }

  // No-op cleanup if nothing was started
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const childProcess = require('child_process');
  const pollInterval = Math.max(10, Number(args.inputs.pollIntervalSeconds) || 15) * 1000;

  args.jobLog('Starting sleep prevention loop');
  const stopSleepPrevention = startSleepPrevention(args.platform, childProcess, args.jobLog);

  const confirmCount = 3;

  try {
    await pollUntilConfirmed(
      args,
      pollInterval,
      confirmCount,
      async (firstCheck) => {
        const othersRunning = await checkOtherWorkersRunning(args, firstCheck);
        if (othersRunning === 'error') return 'error';
        return !othersRunning;
      },
      `No other workers running (confirmed ${confirmCount} times), stopping sleep prevention`,
    );
  } finally {
    stopSleepPrevention();
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
