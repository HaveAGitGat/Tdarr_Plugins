/* eslint-disable linebreak-style */
/* eslint-disable indent */
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getPluginWorkDir, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Extract / transcode audio streams',
  description: 'This plugin extracts an audio track from a given file.',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Single audio stream extracted.',
    },
    {
      number: 2,
      tooltip: 'Multiple audio streams detected',
    },
    {
      number: 3,
      tooltip: 'File does not have an audio stream',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let outputNumber = 0;
  const { ffProbeData } = args.inputFileObj;

  if (!ffProbeData || !ffProbeData.streams) {
    throw new Error('ffProbeData or ffProbeData.streams is not available.');
  }

  // eslint-disable-next-line max-len
  const dtsStreams = ffProbeData.streams.filter((stream) => stream.codec_type === 'audio' && stream.codec_name === 'dts');
  // eslint-disable-next-line max-len
  const fallbackStreams = ffProbeData.streams.filter((stream) => stream.codec_type === 'audio' && (stream.codec_name === 'eac3' || stream.codec_name === 'ac3'));

  // Initialize outputFilePath using utility functions.
  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj.filePath)}.mka`;

  const cliArgs = [];

  if (dtsStreams.length > 0 && fallbackStreams.length === 0) {
    const bestDTSStream = dtsStreams[0];
    outputNumber = 1;

    // eslint-disable-next-line max-len
    cliArgs.push('-i', `${args.inputFileObj.filePath}`, '-map', `0:a:${bestDTSStream.index}`, '-c:a', 'eac3', '-ac', `${bestDTSStream.channels}`, 'output.mka');

    args.updateWorker({
      CLIType: 'ffmpeg',
      preset: cliArgs.join(' '),
    });

    const cli = new CLI({
      cli: 'ffmpeg',
      spawnArgs: cliArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath,
      inputFileObj: args.inputFileObj,
      logFullCliOutput: args.logFullCliOutput,
      updateWorker: args.updateWorker,
    });

    const res = await cli.runCli();

    if (res.cliExitCode !== 0) {
      args.jobLog('Running FFmpeg failed');
      throw new Error('Running FFmpeg failed');
    }

    return {
      outputFileObj: args.inputFileObj,
      outputNumber,
      variables: args.variables,
    };
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};

export { details, plugin };
