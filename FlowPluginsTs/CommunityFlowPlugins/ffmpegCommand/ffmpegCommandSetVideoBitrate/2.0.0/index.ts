import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { checkFfmpegCommandV2Init } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';

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

  checkFfmpegCommandV2Init(args);

  // Store inputs for processing by Execute plugin
  args.variables.ffmpegCommand.pluginInputs!.ffmpegCommandSetVideoBitrate = {
    useInputBitrate: args.inputs.useInputBitrate === true,
    targetBitratePercent: String(args.inputs.targetBitratePercent),
    fallbackBitrate: String(args.inputs.fallbackBitrate),
    bitrate: String(args.inputs.bitrate),
  };

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
