/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { getEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */

const getHwaccelArgs = async (
  gpuAcceleration: string,
  isGpuWorker: boolean,
  args: IpluginInputArgs,
): Promise<string[]> => {
  // CPU worker: never use GPU, regardless of selection
  if (!isGpuWorker) {
    if (gpuAcceleration === 'none') {
      args.jobLog('GPU acceleration: none selected, using CPU');
    } else if (gpuAcceleration === 'auto') {
      args.jobLog('GPU acceleration: auto selected but worker is CPU, using CPU');
    } else {
      args.jobLog(
        `GPU acceleration: '${gpuAcceleration}' selected but worker is CPU`
        + ' — GPU is only available on transcode GPU workers, using CPU',
      );
    }
    return [];
  }

  // GPU worker
  switch (gpuAcceleration) {
    case 'none':
      args.jobLog('GPU acceleration: none selected, using CPU');
      return [];

    case 'dxva2':
      args.jobLog('GPU acceleration: using DXVA2 (Windows hardware decoding)');
      return ['-hwaccel', 'dxva2', '-hwaccel_output_format', 'dxva2_vld'];

    case 'd3d11va':
      args.jobLog('GPU acceleration: using D3D11VA (Windows hardware decoding)');
      return ['-hwaccel', 'd3d11va', '-hwaccel_output_format', 'd3d11'];

    case 'auto':
    default: {
      // auto or specific GPU type (nvenc, qsv, vaapi, videotoolbox, rkmpp)
      const hardwareType = gpuAcceleration === 'auto' ? 'auto' : gpuAcceleration;
      try {
        const result = await getEncoder({
          targetCodec: 'hevc',
          hardwareEncoding: true,
          hardwareType,
          args,
        });

        if (result.isGpu && result.inputArgs.length > 0) {
          args.jobLog(
            `GPU acceleration: using ${gpuAcceleration}`
            + ` (hwaccel: ${result.inputArgs.join(' ')})`,
          );
          return result.inputArgs;
        }

        if (gpuAcceleration === 'auto') {
          args.jobLog(
            'GPU acceleration: auto selected on GPU worker'
            + ' but no compatible GPU detected, falling back to CPU',
          );
        } else {
          args.jobLog(
            `GPU acceleration: '${gpuAcceleration}' selected`
            + ' but detection returned no GPU, falling back to CPU',
          );
        }
      } catch (err) {
        args.jobLog(
          `GPU acceleration error: ${err}. Falling back to CPU.`,
        );
      }
      return [];
    }
  }
};

const details = (): IpluginDetails => ({
  name: 'Run Health Check',
  description: 'Run a quick health check using HandBrake or a thorough health check using FFmpeg',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Type',
      name: 'type',
      type: 'string',
      defaultValue: 'quick',
      inputUI: {
        type: 'dropdown',
        options: [
          'quick',
          'thorough',
        ],
      },
      tooltip: 'Specify the container to use',
    },
    {
      label: 'GPU Acceleration',
      name: 'gpuAcceleration',
      type: 'string',
      defaultValue: 'auto',
      inputUI: {
        type: 'dropdown',
        options: [
          'auto',
          'none',
          'nvenc',
          'qsv',
          'vaapi',
          'videotoolbox',
          'rkmpp',
          'dxva2',
          'd3d11va',
        ],
      },
      tooltip: 'Specify GPU acceleration for thorough health checks '
        + '(FFmpeg only). auto: detect available GPU | nvenc: NVIDIA '
        + '| qsv: Intel | vaapi: Linux | dxva2/d3d11va: Windows',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const type = String(args.inputs.type);
  const gpuAcceleration = String(args.inputs.gpuAcceleration);

  args.jobLog(`Running health check of type ${type}`);

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}`
  + `.${getContainer(args.inputFileObj._id)}`;

  let cliPath = args.handbrakePath;
  let cliArgs = [
    '-i',
    args.inputFileObj._id,
    '-o',
    outputFilePath,
    '--scan',
  ];

  if (type === 'thorough') {
    cliPath = args.ffmpegPath;

    cliArgs = [
      '-stats',
      '-v',
      'error',
    ];

    const isGpuWorker = !!(args.workerType && args.workerType.includes('gpu'));
    const hwaccelArgs = await getHwaccelArgs(gpuAcceleration, isGpuWorker, args);
    cliArgs.push(...hwaccelArgs);

    cliArgs.push(
      '-i',
      args.inputFileObj._id,
      '-f',
      'null',
      '-max_muxing_queue_size',
      '9999',
      outputFilePath,
    );
  }

  const cli = new CLI({
    cli: cliPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  // Added in 2.19.01
  if (typeof args.updateStat !== 'undefined') {
    await args.updateStat(args.originalLibraryFile.DB, 'totalHealthCheckCount', 1);
  }

  if (res.cliExitCode !== 0) {
    args.jobLog('Running CLI failed');
    args.logOutcome('hErr');
    throw new Error('Running CLI failed');
  }

  args.logOutcome('hSuc');

  // will cause item to go into the health check success table
  args.variables.healthCheck = 'Success';

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
