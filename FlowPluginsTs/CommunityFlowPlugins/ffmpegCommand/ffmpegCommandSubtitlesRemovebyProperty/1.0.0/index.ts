import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Subtitles Remove by Title',
  description: 'Remove by Title',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'subtitle',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Title to Remove',
      name: 'valuesToRemove',
      type: 'string',
      defaultValue: 'forced',
      inputUI: {
        type: 'text',
      },
      tooltip: '\n Choose one Title to Remove  ',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const removeByTitle = (args :IpluginInputArgs) => {
  const valuesToRemove = String(args.inputs.valuesToRemove).toLowerCase().trim();
  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'subtitle') {
      return;
    }
    let title = '';
    if (stream.tags !== undefined) {
      if (stream.tags.title !== undefined) {
        title = stream.tags.title.toLowerCase();
      }
    }
    if (title.includes(valuesToRemove)) {
      // eslint-disable-next-line no-param-reassign
      stream.removed = true;
    }
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  removeByTitle(args);

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
