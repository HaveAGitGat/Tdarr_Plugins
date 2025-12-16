/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
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
      defaultValue: 'none',
      inputUI: {
        type: 'dropdown',
        options: [
          'none',
          'nvdec',
          'cuda',
          'qsv',
          'vaapi',
          'dxva2',
          'd3d11va',
          'videotoolbox',
          'vulkan',
        ],
      },
      tooltip: 'Specify GPU acceleration type for thorough health checks (only applies to FFmpeg). '
        + 'nvdec/cuda: NVIDIA GPUs | qsv: Intel Quick Sync | vaapi: Intel/AMD Linux | '
        + 'dxva2/d3d11va: Windows | videotoolbox: macOS/iOS | vulkan: Cross-platform',
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

    // Add GPU acceleration flags before input if specified
    if (gpuAcceleration !== 'none') {
      switch (gpuAcceleration) {
        case 'nvdec':
          cliArgs.push('-hwaccel', 'nvdec', '-hwaccel_output_format', 'cuda');
          args.jobLog('Using NVIDIA NVDEC GPU acceleration');
          break;
        case 'cuda':
          cliArgs.push('-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda');
          args.jobLog('Using NVIDIA CUDA GPU acceleration');
          break;
        case 'qsv':
          cliArgs.push('-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv');
          args.jobLog('Using Intel Quick Sync Video GPU acceleration');
          break;
        case 'vaapi':
          cliArgs.push('-hwaccel', 'vaapi', '-hwaccel_output_format', 'vaapi');
          args.jobLog('Using VAAPI GPU acceleration');
          break;
        case 'dxva2':
          cliArgs.push('-hwaccel', 'dxva2', '-hwaccel_output_format', 'dxva2_vld');
          args.jobLog('Using DXVA2 GPU acceleration');
          break;
        case 'd3d11va':
          cliArgs.push('-hwaccel', 'd3d11va', '-hwaccel_output_format', 'd3d11');
          args.jobLog('Using D3D11VA GPU acceleration');
          break;
        case 'videotoolbox':
          cliArgs.push('-hwaccel', 'videotoolbox');
          args.jobLog('Using VideoToolbox GPU acceleration');
          break;
        case 'vulkan':
          cliArgs.push('-hwaccel', 'vulkan', '-hwaccel_output_format', 'vulkan');
          args.jobLog('Using Vulkan GPU acceleration');
          break;
        default:
          break;
      }
    }

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
