import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Run Classic Transcode Plugin',
  description: 'Run one of Tdarr\'s classic plugins that has Operation: Transcode',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
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
  const path = require('path');
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const pluginSourceId = String(args.inputs.pluginSourceId);
  const parts = pluginSourceId.split(':');
  const pluginSource = parts[0];
  const pluginId = parts[1];

  const relativePluginPath = `../../../../../${pluginSource}/${pluginId}.js`;
  const absolutePath = path.resolve(__dirname, relativePluginPath);

  let classicPlugin;
  if (pluginSource === 'Community') {
    classicPlugin = args.deps.importFresh(relativePluginPath);
  } else {
    // eslint-disable-next-line no-await-in-loop
    const res = await args.deps.axiosMiddleware('api/v2/read-plugin', {
      plugin: {
        id: pluginId,
        source: pluginSource,
      },
    });

    classicPlugin = args.deps.requireFromString(res.pluginRaw, absolutePath);
  }

  if (classicPlugin.details().Operation === 'Filter') {
    throw new Error(
      `${'This plugin is meant for classic plugins that have '
      + 'Operation: Transcode. This classic plugin has Operation: '}${classicPlugin.details().Operation}`
      + 'Please use the Run Classic Filter Flow Plugin plugin instead.'
      ,
    );
  }

  const container = getContainer(args.inputFileObj._id);
  let cacheFilePath = `${args.workDir}/tempFile_${new Date().getTime()}.${container}`;

  const otherArguments = {
    handbrakePath: args.handbrakePath,
    ffmpegPath: args.ffmpegPath,
    mkvpropeditPath: args.mkvpropeditPath,
    originalLibraryFile: args.originalLibraryFile,
    nodeHardwareType: args.nodeHardwareType,
    pluginCycle: 0,
    workerType: args.workerType,
    version: args.config.version,
    platform_arch_isdocker: args.platform_arch_isdocker,
    cacheFilePath,
    job: args.job,
  };

  const result = await classicPlugin.plugin(args.inputFileObj, args.librarySettings, args.inputs, otherArguments);

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
    || (typeof customArgs === 'string' && customArgs.length > 0);

  if (!isCustomConfig) {
    cacheFilePath = replaceContainer(cacheFilePath, result.container);
  } else {
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
