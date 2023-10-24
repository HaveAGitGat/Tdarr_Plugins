/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = (): IpluginDetails => ({
  name: 'Set Container',
  description: 'Set the container of the output file',
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
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'mkv',
          'mp4',
        ],
      },
      tooltip: 'Specify the container to use',
    },
    {
      name: 'forceConform',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `
Specify if you want to force conform the file to the new container,
This is useful if not all streams are supported by the new container. 
For example mkv does not support data streams.
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

  const newContainer = String(args.inputs.container);
  const { forceConform } = args.inputs;

  if (getContainer(args.inputFileObj._id) !== newContainer) {
    args.variables.ffmpegCommand.container = newContainer;
    args.variables.ffmpegCommand.shouldProcess = true;

    if (forceConform === true) {
      for (let i = 0; i < args.variables.ffmpegCommand.streams.length; i += 1) {
        const stream = args.variables.ffmpegCommand.streams[i];

        try {
          const codecType = stream.codec_type.toLowerCase();
          const codecName = stream.codec_name.toLowerCase();
          if (newContainer === 'mkv') {
            if (
              codecType === 'data'
              || [
                'mov_text',
                'eia_608',
                'timed_id3',
              ].includes(codecName)
            ) {
              stream.removed = true;
            }
          }

          if (newContainer === 'mp4') {
            if (
              [
                'hdmv_pgs_subtitle',
                'eia_608',
                'timed_id3',
                'subrip',
              ].includes(codecName)
            ) {
              stream.removed = true;
            }
          }
        } catch (err) {
          // Error
        }
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
