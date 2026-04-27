import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Working File',
  description: `Set the working file to the original file or a custom path.
  This is useful in transcode loops where you want to re-encode from the original source
  rather than from the output of the previous iteration.
  Replaces the deprecated 'Set Original File' plugin.`,
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Source',
      name: 'source',
      type: 'string',
      defaultValue: 'originalFile',
      inputUI: {
        type: 'dropdown',
        options: [
          'originalFile',
          'customPath',
        ],
      },
      tooltip: `Select which file to set as the working file.

      \\nExample\\n
      originalFile - resets to the original library file

      \\nExample\\n
      customPath - uses a custom path (e.g. from a flow variable)`,
    },
    {
      label: 'Custom Path',
      name: 'customPath',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'source',
                  value: 'customPath',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: `The custom file path to set as the working file.
      Supports templating.

      \\nExample\\n
      {{{args.variables.user.cachedFile}}}`,
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

  const source = String(args.inputs.source);

  let filePath: string;

  if (source === 'customPath') {
    filePath = String(args.inputs.customPath).trim();

    if (!filePath) {
      throw new Error('Custom path is empty. Please provide a valid file path.');
    }

    args.jobLog(`Setting working file to custom path: ${filePath}`);
  } else {
    filePath = args.originalLibraryFile._id;
    args.jobLog(`Setting working file to original file: ${filePath}`);
  }

  return {
    outputFileObj: {
      _id: filePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
