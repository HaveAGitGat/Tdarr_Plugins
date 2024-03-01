import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Set Default Audio Stream by Language Code',
  description: 'Change the default audio stream for the container to the stream with the given language code if it exists',
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
      label: 'Language',
      name: 'language',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `The RFC 5646 language code for the audio stream to default to if available
        \n\n
        If there is more than one audio stream with that language code, this uses the first it finds`,
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

  const langTag = String(args.inputs.language).toLowerCase();

  let streams: IffmpegCommandStream[] = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));

  const langMatch = (stream: IffmpegCommandStream) => (
    (langTag === 'und'
      && (stream.tags === undefined || stream.tags.language === undefined))
      || (stream?.tags?.language && stream.tags.language.toLowerCase().includes(langTag)
      )
  );

  let found = false;
  let audioStreams = [];
  for (let i = 0; i < streams.length; i += 1) {
    if (streams[i].codec_type == 'audio') {
      if (!found && langMatch(streams[i])) {
        streams[i].disposition = 'default'
        found = true;
      } else  {
        audioStreams.push(streams[i]);
      }
    }
  }

  let output = {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
  if (!found) {
    return output;
  }
  
  // I don't actually like this as I would prefer to only change the disposition of the prior default
  // but since I don't have the current disposition, I have to get rid of the disposition on all of the streams
  for (let stream of audioStreams) {
    stream.disposition = '0';
  }

  return output;
};
export {
  details,
  plugin,
};
