import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Subtitles Remove Commentary',
  description: 'Remove Commentary',
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
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const removeCommentary = (args :IpluginInputArgs) => {
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
    if (stream.disposition.commentary
      || stream.disposition.description
      || (title.includes('commentary'))
      || (title.includes('description'))) {
      args.jobLog(`Removing Subtitles at index ${stream.index} Commentary Detected`);
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

  removeCommentary(args);

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
