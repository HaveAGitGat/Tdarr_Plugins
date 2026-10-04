import { checkFfmpegCommandV2Init } from './interfaces/flowUtils';
import { IpluginInputArgs } from './interfaces/interfaces';

export const ffmpegCommandV2PluginVersion = '2.0.0';
export const ffmpegCommandV2RequiresVersion = '2.72.01';

export const appendFfmpegCommandV2Operation = ({
  args,
  pluginName,
  operationType,
  inputs,
}: {
  args: IpluginInputArgs,
  pluginName: string,
  operationType: string,
  inputs: Record<string, unknown>,
}): void => {
  checkFfmpegCommandV2Init(args);

  args.variables.ffmpegCommandV2?.operations.push({
    pluginName,
    pluginVersion: ffmpegCommandV2PluginVersion,
    pluginId: args.thisPlugin?.id,
    operationType,
    inputs,
  });
};
