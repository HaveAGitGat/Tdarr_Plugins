import { checkFfmpegCommandV2Init } from './interfaces/flowUtils';
import { IpluginInputArgs } from './interfaces/interfaces';

export const ffmpegCommandV2PluginVersion = '2.0.0';
export const ffmpegCommandV2RequiresVersion = '2.73.01';

export const appendFfmpegCommandV2Request = ({
  args,
  pluginName,
  requestType,
  inputs,
}: {
  args: IpluginInputArgs,
  pluginName: string,
  requestType: string,
  inputs: Record<string, unknown>,
}): void => {
  checkFfmpegCommandV2Init(args);

  args.variables.ffmpegCommandV2?.requests.push({
    pluginName,
    pluginVersion: ffmpegCommandV2PluginVersion,
    pluginId: args.thisPlugin?.id,
    requestType,
    inputs,
  });
};
