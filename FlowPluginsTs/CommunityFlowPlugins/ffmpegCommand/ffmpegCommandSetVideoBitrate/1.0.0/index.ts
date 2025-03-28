import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Video Bitrate',
  description: 'Set Video Bitrate',
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
      label: 'Use % of Input Bitrate',
      name: 'useInputBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Specify whether to use a % of input bitrate as the output bitrate',
    },

    {
      label: 'Target Bitrate %',
      name: 'targetBitratePercent',
      type: 'string',
      defaultValue: '50',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useInputBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify the target bitrate as a % of the input bitrate',
    },
    {
      label: 'Fallback Bitrate',
      name: 'fallbackBitrate',
      type: 'string',
      defaultValue: '4000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useInputBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify fallback bitrate in kbps if input bitrate is not available',
    },
    {
      label: 'Bitrate',
      name: 'bitrate',
      type: 'string',
      defaultValue: '5000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useInputBitrate',
                  value: 'true',
                  condition: '!==',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify bitrate in kbps',
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
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const { useInputBitrate } = args.inputs;
  const targetBitratePercent = String(args.inputs.targetBitratePercent);
  const fallbackBitrate = String(args.inputs.fallbackBitrate);
  const bitrate = String(args.inputs.bitrate);

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type === 'video') {
      const ffType = getFfType(stream.codec_type);
      if (useInputBitrate) {
        args.jobLog('Attempting to use % of input bitrate as output bitrate');
        // check if input bitrate is available
        const tracks = args?.inputFileObj?.mediaInfo?.track;
        let inputBitrate = tracks?.find((x) => x.StreamOrder === stream.index.toString())?.BitRate;

        if (inputBitrate) {
          args.jobLog(`Found input bitrate: ${inputBitrate}`);
          // @ts-expect-error type
          inputBitrate = parseInt(inputBitrate, 10) / 1000;
          const targetBitrate = (inputBitrate * (parseInt(targetBitratePercent, 10) / 100));
          args.jobLog(`Setting video bitrate as ${targetBitrate}k`);
          stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${targetBitrate}k`);
        } else {
          args.jobLog(`Unable to find input bitrate, setting fallback bitrate as ${fallbackBitrate}k`);
          stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${fallbackBitrate}k`);
        }
      } else {
        args.jobLog(`Using fixed bitrate. Setting video bitrate as ${bitrate}k`);
        stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}k`);
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
