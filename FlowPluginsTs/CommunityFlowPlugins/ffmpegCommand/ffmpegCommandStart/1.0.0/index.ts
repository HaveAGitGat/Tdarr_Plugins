/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint-disable no-param-reassign */
const details = () :IpluginDetails => ({
  name: 'Begin Command',
  description: 'Begin creating the FFmpeg command for the current working file.'
   + ' Should be used before any other FFmpeg command plugins.',
  style: {
    borderColor: 'green',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
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

  const container = getContainer(args.inputFileObj._id);

  const ffmpegCommand = {
    init: true,
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
