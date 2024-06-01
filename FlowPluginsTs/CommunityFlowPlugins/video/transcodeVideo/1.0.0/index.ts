import { promises as fsp } from 'fs';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { fileExists } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Transcode Video File',
  description: 'Transcode a video file using ffmpeg. GPU transcoding will be used if possible.',
  style: {
    borderColor: '#6efefc',
    opacity: 0.5,
  },
  tags: '',

  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Target Codec',
      name: 'target_codec',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc',
          // 'vp9',
          'h264',
          // 'vp8',
        ],
      },
      tooltip: 'Specify the codec to use',
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
const plugin = async (args:IpluginInputArgs):Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const oldFile = args.inputFileObj._id;
  const newFile = `${args.inputFileObj._id}.tmp`;

  if (await fileExists(newFile)) {
    await fsp.unlink(newFile);
  }

  await fsp.copyFile(oldFile, newFile);

  return {
    outputFileObj: { _id: newFile },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
