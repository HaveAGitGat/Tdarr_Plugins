import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  getFileName,
  getPluginWorkDir,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  ffmpegCommandV2RequiresVersion,
} from '../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils';
import { renderFfmpegCommandV2 } from './render';

const details = (): IpluginDetails => ({
  name: 'Execute',
  description: 'Execute the order-independent FFmpeg command built from v2 plugin operations',
  style: {
    borderColor: 'green',
  },
  tags: 'video',

  isStartPlugin: false,
  pType: '',
  requiresVersion: ffmpegCommandV2RequiresVersion,
  sidebarPosition: 2,
  icon: 'faPlay',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const renderResult = await renderFfmpegCommandV2(args);
  const commandState = args.variables.ffmpegCommandV2;

  if (!commandState) {
    throw new Error('FFmpeg command v2 state was not available after rendering.');
  }

  if (!renderResult.shouldProcess) {
    args.jobLog('No need to process file, already as required');
    commandState.init = false;
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}`
  + `.${renderResult.container}`;
  const spawnArgs = [
    ...renderResult.spawnArgs,
    outputFilePath,
  ];

  args.jobLog('Processing file');
  args.jobLog(JSON.stringify({
    spawnArgs,
    outputFilePath,
  }));

  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: spawnArgs.join(' '),
  });

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog('Running FFmpeg failed');
    throw new Error('FFmpeg failed');
  }

  args.logOutcome('tSuc');

  commandState.init = false;

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export type {
  IffmpegCommandV2RenderResult,
} from './render';

export {
  details,
  plugin,
  renderFfmpegCommandV2,
};
