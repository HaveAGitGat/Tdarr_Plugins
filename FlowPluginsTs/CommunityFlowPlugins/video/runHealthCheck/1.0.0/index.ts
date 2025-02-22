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
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getDecoder = (gpuSelect:string) : string => {
  let accel = '';

  if (gpuSelect === 'nvenc') {
    accel = '-hwaccel nvdec -hwaccel_output_format cuda';
  } else if (gpuSelect === 'vaapi') {
    accel = '-hwaccel vaapi -hwaccel_output_format vaapi -hwaccel_device /dev/dri/renderD128';
  } else if (gpuSelect === 'amf') {
    // amf only on windows
    accel = '-hwaccel d3d11va';
  } else if (gpuSelect === 'qsv') {
    accel = '-hwaccel qsv';
  } else if (gpuSelect === 'videotoolbox') {
    accel = '-hwaccel videotoolbox';
  } else if (gpuSelect === 'rkmpp') {
    accel = '-hwaccel rkmpp';
  } else {
    accel = '-hwaccel nvdec -hwaccel_output_format cuda';
  }

  return accel;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const type = String(args.inputs.type);

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}`
  + `.${getContainer(args.inputFileObj._id)}`;

  let cliPath = '';
  let cliArgs = [];

  if (type === 'thorough') {
    args.jobLog('Running thorough health check');

    cliPath = args.ffmpegPath;

    if (args.workerType.includes('gpu')) {
      args.jobLog(`Using GPU acceleration, selected: ${args.nodeHardwareType}`);
      args.jobLog('You can change the Node hardware type on the Node options tab on the Tdarr homepage');

      const accel = getDecoder(args.nodeHardwareType).split(' ');

      cliArgs = [
        '-stats',
        '-v',
        'error',
        ...accel,
        '-i',
        args.inputFileObj._id,
        '-f',
        'null',
        '-max_muxing_queue_size',
        '9999',
        outputFilePath,
      ];
    } else {
      args.jobLog('Using CPU acceleration');
      cliArgs = [
        '-stats',
        '-v',
        'error',
        '-i',
        args.inputFileObj._id,
        '-f',
        'null',
        '-max_muxing_queue_size',
        '9999',
        outputFilePath,
      ];
    }
  } else {
    args.jobLog('Running quick health check');
    cliPath = args.handbrakePath;
    cliArgs = [
      '-i',
      args.inputFileObj._id,
      '-o',
      outputFilePath,
      '--scan',
    ];
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
