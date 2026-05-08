/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { ffmpegCommandV2RequiresVersion } from '../../../../FlowHelpers/1.0.0/ffmpegCommandV2Utils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

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

  const container = getContainer(args.inputFileObj._id);

  let streams: Istreams[] = [];

  try {
    streams = JSON.parse(JSON.stringify(args.inputFileObj.ffProbeData.streams));
    if (!Array.isArray(streams)) {
      throw new Error('FFprobe streams is not an array');
    }
  } catch (err) {
    const message = `Error parsing FFprobe streams, it seems FFprobe could not scan the file: ${JSON.stringify(err)}`;
    args.jobLog(message);
    throw new Error(message);
  }

  args.variables.ffmpegCommandV2 = {
    version: 2,
    init: true,
    container,
    streams: streams.map((stream: Istreams) => {
      const normalizedStream = {
        ...stream,
      };

      if (Number(stream?.disposition?.attached_pic) === 1) {
        normalizedStream.codec_type = 'attachment';
      }

      return {
        ...normalizedStream,
        removed: false,
        sourceIndex: stream.index,
      };
    }),
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
