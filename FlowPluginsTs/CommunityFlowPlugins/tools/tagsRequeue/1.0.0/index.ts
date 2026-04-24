import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Tags: Requeue',
  description: `
Place the file back in the staging queue with specific tags.

Only Nodes/Workers which match the tags will be able to process the file.

The tags must have one of the following: 'requireCPU', 'requireGPU', or 'requireCPUorGPU'.

The above tells the server what type of worker is required to process the file.

Subsequent tags must not use the reserved word 'require' in them.

You can set the 'Node Tags' in the Node options panel.

A worker will only process a file if the Custom Queue Tags are a subset of the Worker/Node Tags
`,
  style: {
    borderColor: 'yellow',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.20.01',
  sidebarPosition: -1,
  icon: 'faRedo',
  inputs: [
    {
      label: 'Use Basic Queue Tags',
      name: 'useBasicQueueTags',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Use basic queue tags or custom tags.',
    },
    {
      label: 'Basic Queue Tags',
      name: 'basicQueueTags',
      type: 'string',
      defaultValue: 'requireCPU',
      inputUI: {
        type: 'dropdown',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useBasicQueueTags',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
        options: [
          'requireCPU',
          'requireGPU',
          'requireGPU:nvenc',
          'requireGPU:qsv',
          'requireGPU:vaapi',
          'requireGPU:videotoolbox',
          'requireGPU:amf',
          'requireCPUorGPU',
        ],
      },
      tooltip: 'Specify tags to requeue file with.',
    },
    {
      label: 'Custom Queue Tags',
      name: 'customQueueTags',
      type: 'string',
      defaultValue: 'requireCPUorGPU,tag1',
      inputUI: {
        type: 'textarea',
        style: {
          height: '100px',
        },
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'useBasicQueueTags',
                  value: 'true',
                  condition: '!==',
                },
              ],
            },
          ],
        },
      },
      tooltip: `
requireGPU:nvenc,tag1,tag2
requireCPUorGPU,tag1,tag2
requireCPU,tag1,tag2
requireGPU,tag1,tag2,tag3
requireGPU,tag1
requireGPU,{{{args.userVariables.global.test}}}
requireCPUorGPU,tag1,tag2
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
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const basicQueueTags = String(args.inputs.basicQueueTags);
  const customQueueTags = String(args.inputs.customQueueTags);

  // eslint-disable-next-line no-param-reassign
  args.variables.queueTags = args.inputs.useBasicQueueTags ? basicQueueTags : customQueueTags;

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
