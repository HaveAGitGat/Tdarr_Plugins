import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Channel Count',
  description: 'Check streams for specified channel count',
  style: {
    borderColor: 'orange',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Channel Count',
      name: 'channelCount',
      type: 'number',
      defaultValue: '2',
      inputUI: {
        type: 'dropdown',
        options: [
          '1',
          '2',
          '6',
          '8',
        ],
      },
      tooltip: 'Specify channel count to check for',
    },

  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has stream with specified channel count',
    },
    {
      number: 2,
      tooltip: 'File does not have stream with specified channel count',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const channelCount = Number(args.inputs.channelCount);

  let hasSpecifiedChannelCount = false;

  args.jobLog(`Checking for ${channelCount} channels`);

  if (Array.isArray(args?.inputFileObj?.ffProbeData?.streams)) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
      const stream = args.inputFileObj.ffProbeData.streams[i];

      args.jobLog(`Stream ${i} has ${stream.channels} channels`);

      if (
        stream.channels === channelCount
      ) {
        hasSpecifiedChannelCount = true;
      }
    }
  } else {
    throw new Error('File has no stream data');
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: hasSpecifiedChannelCount ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
