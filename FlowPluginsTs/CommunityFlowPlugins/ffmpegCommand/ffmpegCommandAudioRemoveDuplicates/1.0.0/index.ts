import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Audio Remove Duplicate Streams',
  description: 'Remove Duplicate Audio Streams of each Language.',
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
      tooltip: 'Continue to next plugin',
    },
  ],
});

const findNumberOfAudioStream = (args :IpluginInputArgs) => {
  if (args.inputFileObj.ffProbeData.streams) {
    const number = args.inputFileObj.ffProbeData.streams.filter(
      (stream :Istreams) => stream.codec_type === 'audio',
    ).length;
    return number;
  }
  return 0;
};

const getHighest = (first: Istreams, second: Istreams) => {
  // @ts-expect-error channels
  if (first?.channels > second?.channels) {
    return first;
  }
  return second;
};

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

const undstreams = (args :IpluginInputArgs) => {
  if (args.inputFileObj.ffProbeData.streams) {
    const ustreams = args.inputFileObj.ffProbeData.streams.filter((stream :Istreams) => {
      if (
        stream.codec_type === 'audio'
        && noCommentary(stream)
        && (!stream.tags
        || !stream.tags.language
        || stream.tags.language.toLowerCase().includes('und'))
      ) {
        return true;
      } return false;
    });
    return ustreams;
  }
  throw new Error('Error finding undefined streams');
};

const langStreams = (args :IpluginInputArgs, lang :string) => {
  if (args.inputFileObj.ffProbeData.streams) {
    const lStreams = args.inputFileObj.ffProbeData.streams.filter((stream :Istreams) => {
      if (
        stream.codec_type === 'audio'
        && stream.tags?.language?.toLowerCase().includes(lang)
        && noCommentary(stream)
      ) {
        return true;
      } return false;
    });
    return lStreams;
  }
  throw new Error('Error finding duplicate streams');
};

const removeDuplicates = (args :IpluginInputArgs) => {
  const numberOfAudioStreams = Number(findNumberOfAudioStream(args));
  let hasDUPS = false;
  let duplicates: Array<string> = [];
  let audioStreamsRemoved = 0;

  if (numberOfAudioStreams >= 2 && args.inputFileObj.ffProbeData.streams) {
    const tag: Array<string> = [];
    const audioStreams = args.inputFileObj.ffProbeData.streams.filter((stream :Istreams) => {
      if (stream.codec_type === 'audio') {
        return true;
      } return false;
    });

    audioStreams.forEach((stream :Istreams) => {
      let lang = '';
      if (stream.tags !== undefined) {
        if (stream.tags.language !== undefined) {
          lang = stream.tags.language.toLowerCase();
        } else {
          lang = 'und';
        }
      } else {
        lang = 'und';
      }
      tag.push(lang);
    });

    duplicates = tag.filter((item, index) => tag.indexOf(item) !== index);
    if (duplicates.length >= 1) {
      hasDUPS = true;
    }
  }

  if (hasDUPS) {
    const highestDUPS: Array<Istreams> = [];
    const undhighestDUP: Array<Istreams> = [];
    let undefIsDUP = false;
    if (duplicates.includes('und')) {
      undefIsDUP = true;
    }

    if (undefIsDUP) {
      const findundID = (element :string) => element === 'und';
      const iD = duplicates.findIndex(findundID);
      duplicates.splice(iD, 1);
      const undStreams = undstreams(args);
      const streamwithhighestChannelCount = undStreams.reduce(getHighest);
      undhighestDUP.push(streamwithhighestChannelCount);
    }

    duplicates.forEach((dup) => {
      const streamWithTag = langStreams(args,
        dup);
      const streamwithhighestChannelCount = streamWithTag.reduce(getHighest);
      highestDUPS.push(streamwithhighestChannelCount);
    });

    const undhighestDUPSet = new Set(undhighestDUP.map((element: Istreams) => element.index));
    const highestDUPSSet = new Set(highestDUPS.map((element: Istreams) => element.index));

    args.variables.ffmpegCommand.streams.forEach((stream) => {
      if (stream.codec_type !== 'audio') {
        return;
      }
      if (!undefIsDUP) {
        if (stream.tags === undefined
          || stream.tags.language === undefined
          || stream.tags.language.toLowerCase().includes('und')
        ) {
          return;
        }
      }
      if (undhighestDUPSet.has(stream.index) || highestDUPSSet.has(stream.index)) {
        return;
      }
      if (stream.tags?.language && duplicates.includes(stream.tags.language.toLowerCase())) {
        return;
      }
      args.jobLog(`Removing Stream ${stream.index} Duplicate Detected`);
      // eslint-disable-next-line no-param-reassign
      stream.removed = true;
      audioStreamsRemoved += 1;
    });
  }
  if (audioStreamsRemoved === numberOfAudioStreams) {
    throw new Error('All audio streams would be removed.');
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  removeDuplicates(args);

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
