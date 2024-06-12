import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Normalize Audio',
  description: 'Normalize Audio',
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
      label: 'i',
      name: 'i',
      type: 'string',
      defaultValue: '-23.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `"i" value used in loudnorm pass \\n
              defaults to -23.0`,
    },
    {
      label: 'lra',
      name: 'lra',
      type: 'string',
      defaultValue: '7.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Desired lra value. \\n Defaults to 7.0  
            `,
    },
    {
      label: 'tp',
      name: 'tp',
      type: 'string',
      defaultValue: '-2.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Desired "tp" value. \\n Defaults to -2.0 
              `,
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
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // setup required varibles
  const loudNorm_i = args.inputs.i;
  const { lra } = args.inputs;
  const { tp } = args.inputs;

  const container = getContainer(args.inputFileObj._id);
  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${container}`;

  const normArgs1: string[] = [
    '-i',
    args.inputFileObj._id,
    '-af',
    `loudnorm=I=${loudNorm_i}:LRA=${lra}:TP=${tp}:print_format=json`,
    '-f',
    'null',
    'NUL',
    '-map',
    '0',
    '-c',
    'copy',
  ];

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: normArgs1,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: '',
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
  const lines = res.errorLogFull;

  let idx = -1;

  // get last index of Parsed_loudnorm
  lines.forEach((line, i) => {
    if (line.includes('Parsed_loudnorm')) {
      idx = i;
    }
  });

  if (idx === -1) {
    throw new Error('Failed to find loudnorm in report, please rerun');
  }

  const parts = lines[idx].split(']');
  parts.shift();
  let infoLine = parts.join(']');
  infoLine = infoLine.split('\r\n').join('').split('\t').join('');

  const loudNormValues = JSON.parse(infoLine);

  args.jobLog(`Loudnorm first pass values returned:  \n${JSON.stringify(loudNormValues)}`);

  const normArgs2 = [
    '-i',
    args.inputFileObj._id,
    '-map',
    '0',
    '-c',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-af',
    `loudnorm=print_format=summary:linear=true:I=${loudNorm_i}:LRA=${lra}:TP=${tp}:`
    + `measured_i=${loudNormValues.input_i}:`
    + `measured_lra=${loudNormValues.input_lra}:`
    + `measured_tp=${loudNormValues.input_tp}:`
    + `measured_thresh=${loudNormValues.input_thresh}:offset=${loudNormValues.target_offset} `,
    outputFilePath,
  ];

  const cli2 = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: normArgs2,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res2 = await cli2.runCli();

  if (res2.cliExitCode !== 0) {
    args.jobLog('Running FFmpeg failed');
    throw new Error('FFmpeg failed');
  }

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
