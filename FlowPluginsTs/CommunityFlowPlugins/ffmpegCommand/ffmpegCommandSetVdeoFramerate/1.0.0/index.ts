import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Set Video Framerate',
  description: 'Set Video Framerate. If the original framerate is lower than the'
  + ' specified framerate, the original framerate will be used.',
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
      label: 'Framerate',
      name: 'framerate',
      type: 'number',
      defaultValue: '30',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify framerate value',
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
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const desiredFrameRate = Number(args.inputs.framerate);

  args.jobLog(`Desired framerate: ${desiredFrameRate}`);

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type === 'video') {
      let fileFramerateUsed = false;

      if (stream.avg_frame_rate) {
        const parts = stream.avg_frame_rate.split('/');

        if (parts.length === 2) {
          const numerator = parseInt(parts[0], 10);
          const denominator = parseInt(parts[1], 10);

          if (numerator > 0 && denominator > 0) {
            const fileFramerate = numerator / denominator;

            args.jobLog(`File framerate: ${fileFramerate}`);

            if (fileFramerate < desiredFrameRate) {
              args.jobLog('File framerate is lower than desired framerate. Using file framerate.');
              stream.outputArgs.push('-r', `${String(fileFramerate)}`);
              fileFramerateUsed = true;
            } else {
              args.jobLog('File framerate is greater than desired framerate. Using desired framerate.');
            }
          }
        }
      }

      if (!fileFramerateUsed) {
        args.jobLog('Using desired framerate.');
        stream.outputArgs.push('-r', `${String(desiredFrameRate)}`);
      }
    }
  });

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
