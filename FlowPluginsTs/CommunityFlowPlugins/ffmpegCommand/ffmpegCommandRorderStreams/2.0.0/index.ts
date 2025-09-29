import { checkFfmpegCommandV2Init } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

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

  checkFfmpegCommandV2Init(args);

  // Store inputs for processing by Execute plugin
  args.variables.ffmpegCommand.pluginInputs!.ffmpegCommandRorderStreams = {
    processOrder: String(args.inputs.processOrder),
    languages: String(args.inputs.languages),
    channels: String(args.inputs.channels),
    codecs: String(args.inputs.codecs),
    streamTypes: String(args.inputs.streamTypes),
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