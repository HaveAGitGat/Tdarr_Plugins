import { getFileName, getFileAbosluteDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.1.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Subtitles Extract Subs',
  description:
    'Extract Subtitles to SRT,'
    + ' You must use the Begin/Exectute Command made for Multi Output.'
    + 'This outputs the subs to the input folder',
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
      label: 'Overwrite existing SRT Files',
      name: 'overwrite',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Overwrite with the extracted SRT files',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const buildSubtitleConfiguration = (args :IpluginInputArgs) => {
  const overwrite = Boolean(args.inputs.overwrite);
  const fs = require('fs');
  let subIdx = -1;
  const subtitleSettings = {
    processFile: <boolean> false,
    subOutput: [] as string[],
  };

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'subtitle') {
      return;
    }
    subIdx += 1;
    if (stream.removed) {
      return;
    }
    let lang = '';
    let title = '';
    let strDisposition = '';
    let boolTextSubs = false;
    let codec = '';
    if (stream.tags?.language !== undefined) {
      lang = stream.tags.language.toLowerCase();
    }
    if (stream.tags?.title !== undefined) {
      title = stream.tags.title.toLowerCase();
    }
    if (stream.codec_name !== undefined) {
      codec = stream.codec_name.toLowerCase();
    }
    if (stream.disposition.forced || (title.includes('forced'))) {
      strDisposition = '.forced';
    } else if (stream.disposition.sdh || (title.includes('sdh'))) {
      strDisposition = '.sdh';
    } else if (stream.disposition.cc || (title.includes('cc'))) {
      strDisposition = '.cc';
    } else if (stream.disposition.commentary || stream.disposition.description
      || (title.includes('commentary')) || (title.includes('description'))) {
      strDisposition = '.commentary';
    } else if (stream.disposition.lyrics
      || (title.includes('signs')) || (title.includes('songs'))) {
      strDisposition = '.signsandsongs';
    }
    if (codec === 'ass' || codec === 'mov_text' || codec === 'ssa' || codec === 'subrip') {
      boolTextSubs = true;
    }
    if (!boolTextSubs) {
      return;
    }
    // Build subtitle file names.
    const fileName = getFileName(args.originalLibraryFile._id);
    const orignalFolder = getFileAbosluteDir(args.originalLibraryFile._id);
    const tempsubsFile = [orignalFolder, '/', fileName];
    if (lang === '') {
      tempsubsFile.push(`.und${strDisposition}.srt`);
    } else {
      tempsubsFile.push(`.${lang}${strDisposition}.srt`);
    }
    const subsFile = tempsubsFile.join('');
    // Send Commands.
    if (fs.existsSync(subsFile) && !overwrite) {
      return;
    }
    args.jobLog(`Extracting Subtitles at index ${stream.index}`);
    subtitleSettings.processFile = true;
    subtitleSettings.subOutput.push('-map', `0:s:${subIdx}`, subsFile);
  });
  return subtitleSettings;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const subtitleSettings = buildSubtitleConfiguration(args);

  if (subtitleSettings.processFile) {
    subtitleSettings.subOutput.forEach((element) => {
      args.variables.ffmpegCommand.multiOutputArguments.push(element);
    });
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
