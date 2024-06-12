import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { runClassicPlugin } from '../../../../FlowHelpers/1.0.0/classicPlugins';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Run Classic Transcode Plugin',
  description: 'Run one of Tdarr\'s classic plugins that has Operation: Transcode',
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
      label: 'Plugin Source ID',
      name: 'pluginSourceId',
      type: 'string',
      defaultValue: 'Community:Tdarr_Plugin_MC93_Migz1FFMPEG',
      inputUI: {
        type: 'dropdown',
        options: [],
      },
      tooltip: 'Specify the classic plugin ID',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const replaceContainer = (filePath:string, container:string): string => {
  const parts = filePath.split('.');
  parts[parts.length - 1] = container.split('.').join('');
  return parts.join('.');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const outcome = await runClassicPlugin(args, 'transcode');
  const { result, absolutePath } = outcome;

  let { cacheFilePath } = outcome;

  args.jobLog(JSON.stringify(result, null, 2));

  if (!result) {
    args.jobLog('No result from classic plugin. Continuing to next flow plugin.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // --- Backwards compatibility------------
  if (result.handBrakeMode) {
    result.handbrakeMode = result.handBrakeMode;
  }

  if (result.FFmpegMode) {
    result.ffmpegMode = result.FFmpegMode;
  }
  //----------------------------------------

  if (result.ffmpegMode) {
    result.cliToUse = 'ffmpeg';
  } else if (result.handbrakeMode) {
    result.cliToUse = 'handbrake';
  } else if (typeof result?.custom?.cliPath === 'string') {
    const { cliPath } = result.custom;
    if (cliPath.toLowerCase().includes('ffmpeg')) {
      result.cliToUse = 'ffmpeg';
    } else if (cliPath.toLowerCase().includes('handbrake')) {
      result.cliToUse = 'handbrake';
    } else if (cliPath.toLowerCase().includes('editready')) {
      result.cliToUse = 'editready';
    } else if (cliPath.toLowerCase().includes('av1an')) {
      result.cliToUse = 'av1an';
    }
  }

  result.workerLog = result.transcodeSettingsLog;
  args.jobLog(JSON.stringify(result, null, 2));

  if (result.error) {
    throw new Error(`Plugin ${absolutePath} failed: ${result.error}`);
  } if (result.processFile !== true) {
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  const customArgs = result?.custom?.args;
  const isCustomConfig = (Array.isArray(customArgs) && customArgs.length > 0)
    || (typeof customArgs === 'string'
    // @ts-expect-error length
    && customArgs.length
     > 0);

  if (!isCustomConfig) {
    cacheFilePath = replaceContainer(cacheFilePath, result.container);
  } else {
    // @ts-expect-error type
    cacheFilePath = result.custom.outputPath;
  }

  let presetSplit;
  if (result.preset.includes('<io>')) {
    presetSplit = result.preset.split('<io>');
  } else {
    presetSplit = result.preset.split(',');
  }

  let workerCommand: string[] = [];
  let cliPath = '';

  if (isCustomConfig) {
    // @ts-expect-error cliPath
    cliPath = result?.custom?.cliPath;

    if (Array.isArray(customArgs)) {
      workerCommand = customArgs;
    } else {
      workerCommand = [
        ...args.deps.parseArgsStringToArgv(customArgs, '', ''),
      ];
    }
  } else {
    // working on windows with '` and spaces
    // working on unix with '
    switch (true) {
      case result.cliToUse === 'handbrake':
        workerCommand = [
          '-i',
          `${args.inputFileObj._id}`,
          '-o',
          `${cacheFilePath}`,
          ...args.deps.parseArgsStringToArgv(result.preset, '', ''),
        ];

        cliPath = `${args.handbrakePath}`;
        break;

      case result.cliToUse === 'ffmpeg':
        workerCommand = [
          ...args.deps.parseArgsStringToArgv(presetSplit[0], '', ''),
          '-i',
          `${args.inputFileObj._id}`,
          ...args.deps.parseArgsStringToArgv(presetSplit[1], '', ''),
          `${cacheFilePath}`,
        ];
        cliPath = `${args.ffmpegPath}`;
        break;
      default:
    }
  }

  const cli = new CLI({
    cli: cliPath,
    spawnArgs: workerCommand,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: cacheFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog(`Running ${cliPath} failed`);
    throw new Error(`Running ${cliPath} failed`);
  }

  args.logOutcome('tSuc');

  return {
    outputFileObj: {
      _id: cacheFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
