import { IpluginInputArgs } from './interfaces';

// eslint-disable-next-line import/prefer-default-export
export const checkFfmpegCommandInit = (args: IpluginInputArgs): void => {
  if (!args?.variables?.ffmpegCommand?.init) {
    throw new Error(
      'FFmpeg command plugins not used correctly.'
      + ' Please use the "Begin Command" plugin before using this plugin.'
      + ' Afterwards, use the "Execute" plugin to execute the built FFmpeg command.'
      + ' Once the "Execute" plugin has been used, you need to use a new "Begin Command"'
      + ' plugin to start a new FFmpeg command.',
    );
  }
};

export const checkFfmpegCommandV2Init = (args: IpluginInputArgs): void => {
  if (!args?.variables?.ffmpegCommandV2?.init || args.variables.ffmpegCommandV2.version !== 2) {
    throw new Error(
      'FFmpeg command v2 plugins not used correctly.'
      + ' Please use the v2 "Begin Command" plugin before using this plugin.'
      + ' Afterwards, use the v2 "Execute" plugin to execute the built FFmpeg command.'
      + ' Once the v2 "Execute" plugin has been used, you need to use a new v2 "Begin Command"'
      + ' plugin to start a new FFmpeg command.',
    );
  }
};
