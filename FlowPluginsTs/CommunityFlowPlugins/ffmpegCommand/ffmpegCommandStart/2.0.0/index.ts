import { ffmpegCommandV2RequiresVersion } from '../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = (): IpluginDetails => ({
  name: 'Begin Command',
  description: 'Begin creating an order-independent FFmpeg command for the current working file.'
   + ' Should be used before any other v2 FFmpeg command plugins.',
  style: {
    borderColor: 'green',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: ffmpegCommandV2RequiresVersion,
  sidebarPosition: 1,
  icon: '',
  inputs: [],
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

  args.variables.ffmpegCommandV2 = {
    version: 2,
    init: true,
    sourceFileId: args.inputFileObj._id,
    requests: [],
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
