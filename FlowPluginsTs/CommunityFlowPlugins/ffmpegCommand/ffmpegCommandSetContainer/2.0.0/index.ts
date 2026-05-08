/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import {
  appendFfmpegCommandV2Request,
  ffmpegCommandV2RequiresVersion,
} from '../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils';
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
  requiresVersion: ffmpegCommandV2RequiresVersion,
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

  appendFfmpegCommandV2Request({
    args,
    pluginName: 'ffmpegCommandSetContainer',
    requestType: 'setContainer',
    inputs: {
      container: String(args.inputs.container),
      forceConform: args.inputs.forceConform === true,
    },
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
