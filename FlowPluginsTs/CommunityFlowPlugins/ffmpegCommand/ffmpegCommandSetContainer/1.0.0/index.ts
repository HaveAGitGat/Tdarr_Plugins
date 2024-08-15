/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
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
      label: 'Container',
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
      label: 'Force Conform',
      name: 'forceConform',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
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

  checkFfmpegCommandInit(args);

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
              codecType === 'attachment'
              || [
                'hdmv_pgs_subtitle',
                'eia_608',
                'timed_id3',
                'subrip',
                'ass',
                'ssa',
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
    // handle genpts if coming from odd container
    const container = args.inputFileObj.container.toLowerCase();
    if (
      [
        'ts',
        'avi',
        'mpg',
        'mpeg',
      ].includes(container)
    ) {
      args.variables.ffmpegCommand.overallOuputArguments.push('-fflags', '+genpts');
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
