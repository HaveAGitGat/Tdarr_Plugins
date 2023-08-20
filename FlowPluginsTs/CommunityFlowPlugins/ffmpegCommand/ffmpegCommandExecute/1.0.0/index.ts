import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { CLI } from '../../../../FlowHelpers/1.0.0/utils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Execute',
  description: 'Execute the created FFmpeg command',
  style: {
    borderColor: 'green',
  },
  tags: 'video',

  isStartPlugin: false,
  sidebarPosition: 2,
  icon: 'faPlay',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File is 480p',
    },
    {
      number: 2,
      tooltip: 'File is 576p',
    },
  ],
});

const getEncoder = (codec: string) => {
  switch (codec) {
    case 'h264':
      return 'libx264';
    case 'hevc':
      return 'libx265';
    default:
      return codec;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const cliArgs: string[] = [];

  cliArgs.push('-y');
  cliArgs.push('-i');
  cliArgs.push(args.inputFileObj._id);

  let shouldProcess = false;

  // @ts-expect-error type
  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (!stream.removed) {
      cliArgs.push('-map');
      cliArgs.push(`0:${stream.index}`);
      cliArgs.push(`-c:${stream.index}`);

      args.jobLog(JSON.stringify({ stream }));
      if (args.inputs.forceProcess || stream.codec_name !== stream.targetCodec) {
        shouldProcess = true;
        cliArgs.push(getEncoder(stream.targetCodec));
      } else {
        cliArgs.push('copy');
      }
    }
  });

  if (!shouldProcess) {
    args.jobLog('No need to process file, already as required');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // @ts-expect-error type
  const outputFilePath = `${args.workDir}/tempFile.${args.variables.ffmpegCommand.container}`;
  cliArgs.push(outputFilePath);

  // @ts-expect-error type
  args.deps.fsextra.ensureDirSync(args.workDir);

  args.jobLog('Processing file');
  args.jobLog(JSON.stringify({
    cliArgs,
    outputFilePath,
  }));

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
  });

  const res = await cli.runCli();

  if (!args.logFullCliOutput) {
    args.jobLog(res.errorLogFull.slice(-1000).join(''));
  }

  if (res.cliExitCode !== 0) {
    args.jobLog('Running FFmpeg failed');
    throw new Error('FFmpeg failed');
  }

  args.logOutcome('tSuc');

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
