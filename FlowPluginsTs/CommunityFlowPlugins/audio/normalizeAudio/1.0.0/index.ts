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
      label: 'Target Integrated Loudness (LUFS)',
      name: 'i',
      type: 'string',
      defaultValue: '-23.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Target integrated loudness in LUFS (Loudness Units relative to Full Scale). \\n
              This is the average perceptual loudness the output file will be normalized to. \\n
              Common values: \\n
              -14.0 = Spotify / YouTube streaming standard \\n
              -16.0 = Apple Music / AES streaming recommendation \\n
              -23.0 = EBU R128 broadcast standard (default) \\n`,
    },
    {
      label: 'Target Loudness Range (LU)',
      name: 'lra',
      type: 'string',
      defaultValue: '7.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Target loudness range in LU (Loudness Units). \\n
              Controls how much dynamic variation is allowed between quiet and loud sections. \\n
              A lower value produces more consistent loudness throughout the file. \\n
              A higher value preserves more of the original dynamic range. \\n
              Typical values: \\n
              3.0-7.0 = Compressed / consistent (speech, podcasts) \\n
              7.0-15.0 = Moderate dynamics (most music, TV) \\n
              15.0-20.0 = Wide dynamics (classical, film) \\n
              Defaults to 7.0`,
    },
    {
      label: 'Target True Peak (dBTP)',
      name: 'tp',
      type: 'string',
      defaultValue: '-2.0',
      inputUI: {
        type: 'text',
      },
      tooltip: `Maximum true peak level in dBTP (decibels True Peak). \\n
              True peak accounts for inter-sample peaks that occur after digital-to-analogue \\n
              conversion or codec processing, and should be kept below 0 dBTP to prevent clipping. \\n
              Common values: \\n
              -1.0 = EBU R128 / streaming platform recommended ceiling \\n
              -2.0 = Conservative headroom for lossy codec safety (default) \\n`,
    },
    {
      label: 'Max Gain (LU)',
      name: 'maxGain',
      type: 'string',
      defaultValue: '15',
      inputUI: {
        type: 'text',
      },
      tooltip: `Maximum gain in Loudness Units that will be applied. \\n
              If the required gain exceeds this value, normalization is skipped \\n
              to avoid amplifying noise in mostly-quiet files. \\n
              Defaults to 15`,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

export interface INormalizeAudioPluginInputArgs extends IpluginInputArgs {
  inputs: {
    i: string,
    lra: string,
    tp: string,
    maxGain: string,
  } & IpluginInputArgs['inputs']
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: INormalizeAudioPluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // setup required variables
  const { i: inputs_i, lra: inputs_lra, tp: inputs_tp } = args.inputs;
  const maxGain = parseFloat(args.inputs.maxGain);

  const container = getContainer(args.inputFileObj._id);
  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${container}`;

  const normArgs1: string[] = [
    '-i',
    args.inputFileObj._id,
    '-af',
    `loudnorm=I=${inputs_i}:LRA=${inputs_lra}:TP=${inputs_tp}:print_format=json`,
    '-f',
    'null',
    (args.platform === 'win32' ? 'NUL' : '/dev/null'),
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

  const fullTail = res.errorLogFull.slice(idx).join('');

  const targetOffsetIdx = fullTail.lastIndexOf('target_offset');
  if (targetOffsetIdx === -1) {
    throw new Error('Failed to find target_offset in loudnorm output, please rerun');
  }

  const closingBraceIdx = fullTail.indexOf('}', targetOffsetIdx);
  if (closingBraceIdx === -1) {
    throw new Error('Failed to find closing brace in loudnorm output, please rerun');
  }

  const openingBraceIdx = fullTail.lastIndexOf('{', targetOffsetIdx);
  if (openingBraceIdx === -1) {
    throw new Error('Failed to find opening brace in loudnorm output, please rerun');
  }

  const loudNormValues = JSON.parse(fullTail.slice(openingBraceIdx, closingBraceIdx + 1));

  args.jobLog(`Loudnorm first pass values returned:  \n${JSON.stringify(loudNormValues)}`);

  const gainNeeded = parseFloat(inputs_i) - parseFloat(loudNormValues.input_i);
  args.jobLog(`Gain required: ${gainNeeded.toFixed(2)} LU (max allowed: ${maxGain} LU)`);

  if (gainNeeded > maxGain) {
    args.jobLog(
      `Skipping normalization: required gain of ${gainNeeded.toFixed(2)} LU exceeds `
      + `max allowed gain of ${maxGain} LU. File may be mostly quiet or noise.`,
    );
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

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
    `loudnorm=print_format=summary:linear=true:I=${inputs_i}:LRA=${inputs_lra}:TP=${inputs_tp}:`
    + `measured_i=${loudNormValues.input_i}:`
    + `measured_lra=${loudNormValues.input_lra}:`
    + `measured_tp=${loudNormValues.input_tp}:`
    + `measured_thresh=${loudNormValues.input_thresh}:offset=${loudNormValues.target_offset}`,
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
