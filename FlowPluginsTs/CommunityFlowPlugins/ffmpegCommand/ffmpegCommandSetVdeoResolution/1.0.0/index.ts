import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Set Video Resolution',
  description: 'Change video resolution',
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
      label: 'Target Resolution',
      name: 'targetResolution',
      type: 'string',
      defaultValue: '1080p',
      inputUI: {
        type: 'dropdown',
        options: [
          '480p',
          '720p',
          '1080p',
          '1440p',
          '4KUHD',
        ],
      },
      tooltip: 'Specify the codec to use',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const getVfScale = (
  targetResolution: string,
):string[] => {
  switch (targetResolution) {
    case '480p':
      return ['-vf', 'scale=720:-2'];

    case '576p':
      return ['-vf', 'scale=720:-2'];

    case '720p':
      return ['-vf', 'scale=1280:-2'];

    case '1080p':
      return ['-vf', 'scale=1920:-2'];

    case '1440p':
      return ['-vf', 'scale=2560:-2'];

    case '4KUHD':
      return ['-vf', 'scale=3840:-2'];

    default:
      return ['-vf', 'scale=1920:-2'];
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
    const stream = args.variables.ffmpegCommand.streams[i];

    if (stream.codec_type === 'video') {
      const targetResolution = String(args.inputs.targetResolution);

      if (
        targetResolution !== args.inputFileObj.video_resolution
      ) {
        // eslint-disable-next-line no-param-reassign
        args.variables.ffmpegCommand.shouldProcess = true;
        const scaleArgs = getVfScale(targetResolution);
        stream.outputArgs.push(...scaleArgs);
      }
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
