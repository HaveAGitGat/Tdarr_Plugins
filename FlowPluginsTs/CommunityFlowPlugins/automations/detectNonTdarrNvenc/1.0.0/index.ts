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

// Sets ffmpeg/HandBrake process priority (cross-platform).
const setTdarrProcessPriority = (
  priority: 'low' | 'below normal' | 'normal' | 'above normal' | 'high',
  platform: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  childProcess: any,
  jobLog: (text: string) => void,
): void => {
  try {
    let cmdFFmpeg = '';
    let cmdHandBrake = '';

    if (platform === 'win32') {
      let priorityClass = 'Normal';
      switch (priority) {
        case 'high':
          priorityClass = 'High';
          break;
        case 'above normal':
          priorityClass = 'AboveNormal';
          break;
        case 'normal':
          priorityClass = 'Normal';
          break;
        case 'below normal':
          priorityClass = 'BelowNormal';
          break;
        case 'low':
          priorityClass = 'Idle';
          break;
        default:
          priorityClass = 'Normal';
          break;
      }

      // eslint-disable-next-line max-len
      cmdFFmpeg = `powershell -Command "if (Get-Process -Name 'ffmpeg' -ErrorAction SilentlyContinue) { Get-Process -Name 'ffmpeg' | ForEach-Object { $_.PriorityClass = '${priorityClass}' } }"`;
      // eslint-disable-next-line max-len
      cmdHandBrake = `powershell -Command "if (Get-Process -Name 'HandBrakeCLI' -ErrorAction SilentlyContinue) { Get-Process -Name 'HandBrakeCLI' | ForEach-Object { $_.PriorityClass = '${priorityClass}' } }"`;
    } else {
      let niceVal = 0;
      switch (priority) {
        case 'high':
          niceVal = -15;
          break;
        case 'above normal':
          niceVal = -10;
          break;
        case 'normal':
          niceVal = 0;
          break;
        case 'below normal':
          niceVal = 10;
          break;
        case 'low':
          niceVal = 19;
          break;
        default:
          niceVal = 0;
          break;
      }

      cmdFFmpeg = `for p in $(pgrep ^ffmpeg$ || true); do renice -n ${niceVal} -p $p; done`;
      cmdHandBrake = `for p in $(pgrep ^HandBrakeCLI$ || true); do renice -n ${niceVal} -p $p; done`;
    }

    childProcess.exec(cmdFFmpeg, { windowsHide: true }, (err: unknown) => {
      if (err) jobLog(`Error setting ffmpeg priority: ${err}`);
    });
    childProcess.exec(cmdHandBrake, { windowsHide: true }, (err: unknown) => {
      if (err) jobLog(`Error setting HandBrake priority: ${err}`);
    });
  } catch (err) {
    jobLog(`Error setting process priority: ${err}`);
  }
};

const details = (): IpluginDetails => ({
  name: 'Set GPU Node to Low Priority When Non-Tdarr NVENC Detected',
  description: 'Polls nvidia-smi for non-Tdarr NVENC encoder processes.'
    + ' When detected, sets ffmpeg/HandBrake to low process priority.'
    + ' Restores priority when non-Tdarr NVENC processes stop.'
    + ' Exits when no other Tdarr workers are running (confirmed 3 times).',
  style: {
    borderColor: '#76B900',
  },
  tags: 'automations,gpu,nvenc,priority,nvidia',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.64.01',
  sidebarPosition: -1,
  icon: 'faMicrochip',
  inputs: [
    {
      label: 'Poll Interval (seconds)',
      name: 'pollIntervalSeconds',
      type: 'number',
      defaultValue: '15',
      inputUI: {
        type: 'text',
      },
      tooltip: 'How often to check for non-Tdarr NVENC processes.',
    },
    {
      label: 'Low Priority',
      name: 'lowPriority',
      type: 'string',
      defaultValue: 'low',
      inputUI: {
        type: 'dropdown',
        options: ['low', 'below normal'],
      },
      tooltip: 'Priority to set when non-Tdarr NVENC processes are detected.',
    },
    {
      label: 'Normal Priority',
      name: 'normalPriority',
      type: 'string',
      defaultValue: 'normal',
      inputUI: {
        type: 'dropdown',
        options: ['normal', 'above normal', 'high'],
      },
      tooltip: 'Priority to restore when non-Tdarr NVENC processes stop.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'No other workers running - safe to continue',
    },
  ],
});

// Returns PIDs of processes using the NVIDIA encoder (NVENC), excluding Tdarr's own
// ffmpeg/HandBrake processes.
const getNonTdarrNvencPids = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  childProcess: any,
  enableDebugLog: boolean,
  jobLog: (text: string) => void,
): number[] => {
  try {
    // nvidia-smi pmon shows per-process GPU usage including encoder utilization
    // Columns: gpu pid type sm mem enc dec jpg command
    const output = childProcess.execSync(
      'nvidia-smi pmon -c 1 -s e',
      { timeout: 15000, windowsHide: true, encoding: 'utf8' },
    );
    const lines = (output as string).split(/\r?\n/);

    const tdarrProcessNames = ['ffmpeg', 'ffprobe', 'handbrakecli'];
    const nvencPids: number[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      // Skip header and comment lines
      if (!line || line.startsWith('#')) {
        continue; // eslint-disable-line no-continue
      }

      const parts = line.split(/\s+/);
      // Expected: gpu pid type sm mem enc dec jpg command (or similar)
      // Minimum columns: gpu pid type sm mem enc dec command
      if (parts.length < 8) {
        continue; // eslint-disable-line no-continue
      }

      const pid = parseInt(parts[1], 10);
      const enc = parseInt(parts[5], 10);
      // Last part is the command/process name
      const command = parts[parts.length - 1].toLowerCase();

      if (Number.isNaN(pid) || pid <= 0) {
        continue; // eslint-disable-line no-continue
      }

      // Only care about processes actively using the encoder
      if (Number.isNaN(enc) || enc <= 0) {
        continue; // eslint-disable-line no-continue
      }

      // Skip Tdarr's own processes
      const isTdarr = tdarrProcessNames.some(
        (name) => command.includes(name),
      );
      if (isTdarr) {
        continue; // eslint-disable-line no-continue
      }

      nvencPids.push(pid);
    }

    if (enableDebugLog) {
      jobLog(`nvidia-smi pmon: ${nvencPids.length} non-Tdarr NVENC process(es) found`);
    }

    return nvencPids;
  } catch (err) {
    if (enableDebugLog) {
      jobLog(`nvidia-smi pmon error: ${err}`);
    }
  }

  return [];
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const childProcess = require('child_process');
  const pollInterval = Math.max(5, Number(args.inputs.pollIntervalSeconds) || 15) * 1000;
  const lowPriority = (String(args.inputs.lowPriority) || 'low') as 'low' | 'below normal';
  const normalPriority = (String(args.inputs.normalPriority) || 'normal') as 'normal' | 'above normal' | 'high';

  args.jobLog('Starting NVENC priority monitor');

  let isLowered = false;
  let firstCheck = true;
  const confirmCount = 3;

  await pollUntilConfirmed(
    args,
    pollInterval,
    confirmCount,
    async (firstPoll) => {
      // Check for non-Tdarr NVENC processes
      const nvencPids = getNonTdarrNvencPids(childProcess, firstCheck || firstPoll, args.jobLog);
      const hasNonTdarrNvenc = nvencPids.length > 0;

      if (hasNonTdarrNvenc && !isLowered) {
        args.jobLog(`Non-Tdarr NVENC detected (PIDs: ${nvencPids.join(', ')}), setting priority to ${lowPriority}`);
        setTdarrProcessPriority(lowPriority, args.platform, childProcess, args.jobLog);
        isLowered = true;
      } else if (!hasNonTdarrNvenc && isLowered) {
        args.jobLog(`No non-Tdarr NVENC processes, restoring priority to ${normalPriority}`);
        setTdarrProcessPriority(normalPriority, args.platform, childProcess, args.jobLog);
        isLowered = false;
      }

      firstCheck = false;

      // Check if other Tdarr workers are still running (exit condition)
      const othersRunning = await checkOtherWorkersRunning(args, firstPoll);
      if (othersRunning === 'error') return 'error';
      return !othersRunning;
    },
    `No other workers running (confirmed ${confirmCount} times), stopping NVENC priority monitor`,
  );

  // Restore priority on exit if it was lowered
  if (isLowered) {
    args.jobLog(`Restoring priority to ${normalPriority} on exit`);
    setTdarrProcessPriority(normalPriority, args.platform, childProcess, args.jobLog);
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
