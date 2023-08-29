import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Run Classic Filter Plugin',
  description: 'Run one of Tdarr\'s classic plugins that has Operation: Filter',
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      name: 'pluginSourceId',
      type: 'string',
      defaultValue: 'Community:Tdarr_Plugin_00td_filter_by_codec',
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
      tooltip: 'File met conditions, would traditionally continue to next plugin in plugin stack',
    },
    {
      number: 2,
      tooltip: 'File did not meet conditions, would traditionally break out of plugin stack',
    },
  ],
});

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

  if (classicPlugin.details().Operation !== 'Filter') {
    throw new Error(
      `${'This plugin is meant for classic plugins that have '
      + 'Operation: Filter. This classic plugin has Operation: '}${classicPlugin.details().Operation}`
      + 'Please use the Run Classic Transcode Flow Plugin plugin instead.'
      ,
    );
  }

  const container = getContainer(args.inputFileObj._id);
  const cacheFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${container}`;

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

  const outputNumber = result?.processFile ? 1 : 2;

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
