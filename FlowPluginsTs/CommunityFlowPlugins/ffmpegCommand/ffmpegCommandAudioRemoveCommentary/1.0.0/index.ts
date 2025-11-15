import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Audio Remove Commentary',
  description: 'Checks all Audio streams for commentary and removes them',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'audio',
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
      tooltip: 'Go to Next Plugin',
    },
  ],
});

const noCommentary = (stream :Istreams) => {
  if (!stream.tags || !stream.tags.title) {
    return true;
  } if (
    stream.tags.title.toLowerCase().includes('commentary')
    || stream.tags.title.toLowerCase().includes('description')
    || stream.tags.title.toLowerCase().includes('sdh')
  ) {
    return false;
  }
  return true;
};

const findNumberOfAudioStream = (args :IpluginInputArgs) => {
  if (args.inputFileObj.ffProbeData.streams) {
    const number = args.inputFileObj.ffProbeData.streams.filter(
      (stream :Istreams) => stream.codec_type === 'audio',
    ).length;
    return number;
  }
  return 0;
};

const removeCommentary = (args :IpluginInputArgs) => {
  const numberOfAudioStreams = Number(findNumberOfAudioStream(args));
  let audioStreamsRemoved = 0;
  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'audio') {
      return;
    }
    if (noCommentary(stream)) {
      return;
    }
    args.jobLog(`Removing Stream ${stream.index} Commentray Detected`);
    // eslint-disable-next-line no-param-reassign
    stream.removed = true;
    audioStreamsRemoved += 1;
  });
  if (audioStreamsRemoved === numberOfAudioStreams) {
    throw new Error('All audio streams would be removed.');
  }
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
