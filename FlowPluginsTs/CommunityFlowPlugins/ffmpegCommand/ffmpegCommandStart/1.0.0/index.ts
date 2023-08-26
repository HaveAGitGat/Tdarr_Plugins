/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint-disable no-param-reassign */
const details = () :IpluginDetails => ({
  name: 'Start',
  description: 'Start FFmpeg Command',
  style: {
    borderColor: 'green',
  },
  tags: 'video',

  isStartPlugin: false,
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
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const containerParts = args.inputFileObj._id.split('.');
  const container = containerParts[containerParts.length - 1];

  const ffmpegCommand = {
    inputFiles: [],
    streams: JSON.parse(JSON.stringify(args.inputFileObj.ffProbeData.streams)).map((stream:Istreams) => ({
      ...stream,
      removed: false,
      mapArgs: [
        '-map',
        `0:${stream.index}`,
      ],
      inputArgs: [],
      outputArgs: [],
    })),
    container,
    hardwareDecoding: false,
    shouldProcess: false,
    overallInputArguments: [],
    overallOuputArguments: [],
  };

  args.variables.ffmpegCommand = ffmpegCommand;

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
