import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Reorder Streams',
  description: 'Reorder Streams',
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
      label: 'Process Order',
      name: 'processOrder',
      type: 'string',
      defaultValue: 'codecs,channels,languages,streamTypes',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the process order.
For example, if 'languages' is first, the streams will be ordered based on that first.
So put the most important properties last.
The default order is suitable for most people.

        \\nExample:\\n
        codecs,channels,languages,streamTypes
        `,
    },
    {
      label: 'Languages',
      name: 'languages',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the language tags order, separated by commas. Leave blank to disable.
        \\nExample:\\n
        eng,fre
        `,
    },
    {
      label: 'Channels',
      name: 'channels',
      type: 'string',
      defaultValue: '7.1,5.1,2,1',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the channels order, separated by commas. Leave blank to disable.
          
          \\nExample:\\n
          7.1,5.1,2,1`,
    },
    {
      label: 'Codecs',
      name: 'codecs',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the codec order, separated by commas. Leave blank to disable.
          
          \\nExample:\\n
          aac,ac3`,
    },
    {
      label: 'Stream Types',
      name: 'streamTypes',
      type: 'string',
      defaultValue: 'video,audio,subtitle',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Specify the streamTypes order, separated by commas. Leave blank to disable.
        \\nExample:\\n
        video,audio,subtitle
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

  let streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));

  streams.forEach((stream, index) => {
    // eslint-disable-next-line no-param-reassign
    stream.typeIndex = index;
  });

  const originalStreams = JSON.stringify(streams);

  const sortStreams = (sortType: {
    inputs: string,
    getValue: (stream: Istreams) => string,
  }) => {
    const items = sortType.inputs.split(',');
    items.reverse();
    for (let i = 0; i < items.length; i += 1) {
      const matchedStreams = [];
      for (let j = 0; j < streams.length; j += 1) {
        if (String(sortType.getValue(streams[j])) === String(items[i])) {
          if (
            streams[j].codec_long_name
            && (
              streams[j].codec_long_name.includes('image')
              || streams[j].codec_name.includes('png')
            )
          ) {
            // do nothing, ffmpeg bug, doesn't move image streams
          } else {
            matchedStreams.push(streams[j]);
            streams.splice(j, 1);
            j -= 1;
          }
        }
      }
      streams = matchedStreams.concat(streams);
    }
  };

  const processOrder = String(args.inputs.processOrder);

  const {
    languages, codecs, channels, streamTypes,
  } = args.inputs;

  const sortTypes:{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any,
  } = {
    languages: {
      getValue: (stream: Istreams) => {
        if (stream?.tags?.language) {
          return stream.tags.language;
        }

        return '';
      },
      inputs: languages,
    },
    codecs: {
      getValue: (stream: Istreams) => {
        try {
          return stream.codec_name;
        } catch (err) {
          // err
        }
        return '';
      },
      inputs: codecs,
    },
    channels: {
      getValue: (stream: Istreams) => {
        const chanMap:{
          [key: number]: string
        } = {
          8: '7.1',
          6: '5.1',
          2: '2',
          1: '1',
        };

        if (stream?.channels && chanMap[stream.channels]) {
          return chanMap[stream.channels];
        }

        return '';
      },
      inputs: channels,
    },
    streamTypes: {
      getValue: (stream:Istreams) => {
        if (stream.codec_type) {
          return stream.codec_type;
        }
        return '';
      },
      inputs: streamTypes,
    },
  };

  const processOrderArr = processOrder.split(',');

  for (let k = 0; k < processOrderArr.length; k += 1) {
    if (sortTypes[processOrderArr[k]] && sortTypes[processOrderArr[k]].inputs) {
      sortStreams(sortTypes[processOrderArr[k]]);
    }
  }

  if (JSON.stringify(streams) !== originalStreams) {
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.streams = streams;
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
