import { IpluginInputArgs } from './interfaces';

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
  if (!args?.variables?.ffmpegCommand?.init || args?.variables?.ffmpegCommand?.version !== '2.0.0') {
    throw new Error(
      'FFmpeg command v2.0.0 plugins not used correctly.'
      + ' Please use the "Begin Command (v2.0.0)" plugin before using this plugin.'
      + ' Afterwards, use the "Execute (v2.0.0)" plugin to execute the built FFmpeg command.'
      + ' Once the "Execute (v2.0.0)" plugin has been used, you need to use a new "Begin Command (v2.0.0)"'
      + ' plugin to start a new FFmpeg command.',
    );
  }
};
