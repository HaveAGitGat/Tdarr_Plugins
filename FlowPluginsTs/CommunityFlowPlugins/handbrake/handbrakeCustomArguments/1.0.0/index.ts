import { promises as fsp } from 'fs';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'HandBrake Custom Arguments',
  description: 'HandBrake Custom Arguments',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Custom Arguments',
      name: 'customArguments',
      type: 'string',
      defaultValue: '-Z "Fast 1080p30" --all-subtitles',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify HandBrake arguments',
    },
    {
      label: 'JSON Preset',
      name: 'jsonPreset',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Paste a HandBrake JSON preset here. Leave blank to disable.',
    },
    {
      label: 'Container',
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'original',
          'mkv',
          'mp4',
          'm4v',
          'avi',
          'mov',
          'mpg',
          'mpeg',
        ],
      },
      tooltip: 'Specify output container',
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

  const customArguments = String(args.inputs.customArguments);

  let container = String(args.inputs.container);

  if (container === 'original') {
    container = getContainer(args.inputFileObj._id);
  }

  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${container}`;

  const presetString = String(args.inputs.jsonPreset);

  const cliArgs = [
    '-i',
    `${args.inputFileObj._id}`,
    '-o',
    `${outputFilePath}`,
  ];

  const presetPath = `${args.workDir}/preset.json`;

  if (presetString.trim() !== '') {
    const preset = JSON.parse(presetString);
    await fsp.writeFile(presetPath, JSON.stringify(preset, null, 2));
    cliArgs.push('--preset-import-file');
    cliArgs.push(presetPath);
    cliArgs.push('-Z');
    cliArgs.push(preset.PresetList[0].PresetName);
  } else {
    cliArgs.push(...args.deps.parseArgsStringToArgv(customArguments, '', ''));
  }

  args.updateWorker({
    CLIType: args.handbrakePath,
    preset: cliArgs.join(' '),
  });

  const cli = new CLI({
    cli: args.handbrakePath,
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

  if (res.cliExitCode !== 0) {
    args.jobLog('Running HandBrake failed');
    throw new Error('Running HandBrake failed');
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
