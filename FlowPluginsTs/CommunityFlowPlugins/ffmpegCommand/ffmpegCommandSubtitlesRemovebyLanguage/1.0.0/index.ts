import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Subtitles Remove by Language',
  description: 'Remove by Language',
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
      label: 'Keep Languages',
      name: 'langTags',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
      'Choose the subtitles languages you want to keep. Three letter format.'
      + 'Seperate additional tags with commas eng,jpn,kor ',
    },
    {
      label: 'Keep Undefined',
      name: 'keepUndefined',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Keeps the Undefined Subtitles  Streams',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refineLangTags = (languages :any, langTags :string[]) => {
  const master = langTags;
  langTags.forEach((element :string) => {
    const lang = languages.alpha3BToAlpha2(element);
    master.push(lang);
  });
  return master;
};

const removeNyLanguage = (args :IpluginInputArgs) => {
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');
  const keepUndefined = Boolean(args.inputs.keepUndefined);
  const langTagsUnTrimmed = String(args.inputs.langTags).toLowerCase().split(',');
  const langTags: Array<string> = [];
  langTagsUnTrimmed.forEach((element) => {
    const trimedElement = element.trim();
    langTags.push(trimedElement);
  });

  const langTagsMaster = refineLangTags(languages, langTags);

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'subtitle') {
      return;
    }
    if (keepUndefined) {
      if ((!stream.tags || !stream.tags.language || stream.tags.language.toLowerCase().includes('und'))) {
        return;
      }
    }
    if (stream.tags && stream.tags.language && langTagsMaster.includes(stream.tags.language.toLowerCase())) {
      return;
    }
    args.jobLog(`Removing Subtitles at index ${stream.index} Unwanted Language`);
    // eslint-disable-next-line no-param-reassign
    stream.removed = true;
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const dependencies = ['@cospired/i18n-iso-languages'];
  await args.installClassicPluginDeps(dependencies);

  removeNyLanguage(args);

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
