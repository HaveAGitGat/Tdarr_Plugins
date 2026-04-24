import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Compare File Size Ratio Live',
  description: `
  Compare either the estimated final size or current output size to the input size and
  give an error if estimated final size or current size falls outside the lower or upper threshold %.

  Works with 'FfmpegCommand', 'HandBrake Custom Arguments', 'Run Classic Transcode' and other flow plugins
  that output a file.

  Can be placed anywhere before a plugin which outputs a new file.

  You can check if this plugin caused an error by using 'Check Flow Variable' and checking if
  {{{args.variables.liveSizeCompare.error}}} is true. The threshold that triggered the error
  (either 'upperThreshold' or 'lowerThreshold') is available at {{{args.variables.liveSizeCompare.errorType}}}.
  `,
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Enabled',
      name: 'enabled',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: `Enable or disable this plugin. For example you may want to enable it for one transcoding block and then
      disable it for another block.
      `,
    },
    {
      label: 'Compare Method',
      name: 'compareMethod',
      type: 'string',
      defaultValue: 'estimatedFinalSize',
      inputUI: {
        type: 'dropdown',
        options: [
          'estimatedFinalSize',
          'currentSize',
        ],
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enabled',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `Specify the method to compare.
      Estimated Final Size: Compare the estimated final output size to the input size.
      Current Size: Compare the current output size to the input size.
      `,
    },
    {
      label: 'Upper Threshold Size %',
      name: 'thresholdPerc',
      type: 'number',
      defaultValue: '60',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enabled',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `Enter the upper threshold size percentage relative to the input size.
      An error will be triggered (with errorType set to 'upperThreshold') if the estimated or current size exceeds
      this percentage.

      For example, if the input size is 100MB and the threshold is 60%, the estimated final size or current size
      must not surpass 60MB else an error will be given and processing will stop.
      `,
    },
    {
      label: 'Lower Threshold Size %',
      name: 'lowerThresholdPerc',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enabled',
                  value: 'true',
                  condition: '===',
                },
                {
                  name: 'compareMethod',
                  value: 'estimatedFinalSize',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `Enter the lower threshold size percentage relative to the input size.
      An error will be triggered (with errorType set to 'lowerThreshold') if the estimated final size falls below
      this percentage.

      For example, if the input size is 100MB and the lower threshold is 20%, an error will be given if
      the estimated final size drops below 20MB.

      Only applies to the 'estimatedFinalSize' compare method, since 'currentSize' starts at zero and
      would always trip the lower bound. Set to 0 to disable.
      `,
    },
    {
      label: 'Check Delay (seconds)',
      name: 'checkDelaySeconds',
      type: 'number',
      defaultValue: '20',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'enabled',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `
      Specify the delay in seconds before beginning the comparison.
      A larger delay gives more time for the estimated final size to stabilize.
      `,
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
const plugin = (args: IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const enabled = Boolean(args.inputs.enabled);
  const compareMethod = String(args.inputs.compareMethod);
  const thresholdPerc = Number(args.inputs.thresholdPerc);
  const lowerThresholdPerc = Number(args.inputs.lowerThresholdPerc);
  const checkDelaySeconds = Number(args.inputs.checkDelaySeconds);

  // eslint-disable-next-line no-param-reassign
  args.variables.liveSizeCompare = {
    enabled,
    compareMethod,
    thresholdPerc,
    lowerThresholdPerc,
    checkDelaySeconds,
    error: false,
    errorType: '',
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
