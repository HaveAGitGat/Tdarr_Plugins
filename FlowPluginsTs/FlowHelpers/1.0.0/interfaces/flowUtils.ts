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
