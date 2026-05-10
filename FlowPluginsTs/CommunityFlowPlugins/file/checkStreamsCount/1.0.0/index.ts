import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Check Streams Count',
  description: 'This plugin checks if the number of streams for a selected stream type is equal, less or more '
    + 'than a specific number.',
  style: {
    borderColor: 'orange',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Stream Type',
      name: 'streamType',
      type: 'string',
      defaultValue: 'video',
      inputUI: {
        type: 'dropdown',
        options: [
          'video',
          'audio',
          'subtitle',
          'attachment',
          'data',
        ],
      },
      tooltip: 'Specify the stream type to count',
    },
    {
      label: 'Streams Count',
      name: 'streamsTarget',
      type: 'number',
      defaultValue: '1',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify streams count to check for',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'The number of selected streams is less',
    },
    {
      number: 2,
      tooltip: 'The number of selected streams is equal',
    },
    {
      number: 3,
      tooltip: 'The number of selected streams is more',
    },
  ],
});

const getOutputNumber = (count: number, target: number): number => {
  if (count < target) return 1;
  if (count === target) return 2;
  return 3;
};

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { streamType, streamsTarget } = args.inputs as { streamType: string; streamsTarget: number; };
  const { ffProbeData } = args.inputFileObj;
  if (!ffProbeData || !ffProbeData.streams) {
    throw new Error('ffProbeData or ffProbeData.streams is not available.');
  }
  const { streams } = ffProbeData;
  if (!Array.isArray(streams)) {
    throw new Error('File has no valid stream data');
  }

  args.jobLog(`Checking for ${streamsTarget} ${streamType} streams`);
  const streamsCount = streams.reduce(
    (count, stream) => (stream.codec_type === streamType ? count + 1 : count),
    0,
  );
  args.jobLog(`${streamsCount} ${streamType} streams found`);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: getOutputNumber(streamsCount, streamsTarget),
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
