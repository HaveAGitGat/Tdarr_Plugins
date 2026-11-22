import { getFileName, getFileAbosluteDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.1.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Subtitles Add to MKV',
  description:
    'Add Subtitles in SRT to MKV,'
    + ' You must you the Begin/Exectute Command made for Multi Input.',
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
      label: 'ONE Language tag to Add to MKV',
      name: 'langTag',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Choose ONE three letter language tag to insert into the mkv.',
    },
    {
      label: 'Include Forced Subs',
      name: 'include_forced',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Forced subtitles will also be added, required naming is source.eng.forced.srt,'
        + 'this example assumes chosen tag is eng.',
    },
    {
      label: 'Include SDH Subs',
      name: 'include_sdh',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Sdh subtitles will also be added, required naming is source.eng.sdh.srt,'
        + 'this example assumes chosen tag is eng.',
    },
    {
      label: 'Include CC Subs',
      name: 'include_cc',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        'Sdh subtitles will also be added, required naming is source.eng.cc.srt,'
        + 'this example assumes chosen tag is eng.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/ban-types
const loopOverStreamsOfType = (args :IpluginInputArgs, type :string, method :Function) => {
  if (args.inputFileObj.ffProbeData.streams) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i++) {
      if (args.inputFileObj.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
        method(args.inputFileObj.ffProbeData.streams[i]);
      }
    }
  }
};

const buildSubtitleConfiguration = (args :IpluginInputArgs) => {
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');
  const fs = require('fs');
  const processLanguage = String(args.inputs.langTag).trim();
  const processLanguage2 :string = languages.alpha3BToAlpha2(processLanguage);
  const boolGetForced = Boolean(args.inputs.include_forced);
  const boolGetSdh = Boolean(args.inputs.include_sdh);
  const boolGetCc = Boolean(args.inputs.include_cc);
  const subtitleSettings = {
    processFile: <boolean> false,
    subInput: [] as string[],
    subOutput: [] as string[],
  };

  let embeddedSubs = 0;
  let boolHaveMain = false;
  let boolHaveForced = false;
  let boolHaveSdh = false;
  let boolHaveCc = false;
  // Loop through the streams
  const subProcess = (stream :Istreams) => {
    // eslint-disable-next-line no-plusplus
    embeddedSubs++;
    let lang = '';
    let title = '';
    let codec = '';
    if (stream.tags !== undefined) {
      if (stream.tags.language !== undefined) {
        lang = stream.tags.language.toLowerCase();
      }
      if (stream.tags.title !== undefined) {
        title = stream.tags.title.toLowerCase();
      }
    }
    if (stream.codec_name !== undefined) {
      codec = stream.codec_name.toLowerCase();
    }

    // Ignore these codecs
    if (codec !== 'subrip' && codec !== 'ass' && codec !== 'mov_text' && codec !== 'ssa') {
      return;
    }

    // Ignore languages we dont want
    if (processLanguage !== lang && processLanguage2 !== lang) {
      return;
    }

    // Check these titles and determine if we already have what we want
    if (processLanguage === lang || processLanguage2 === lang) {
      if (stream.disposition.forced || (title.includes('forced'))) {
        boolHaveForced = true;
      } else if (stream.disposition.sdh || (title.includes('sdh'))) {
        boolHaveSdh = true;
      } else if (stream.disposition.cc || (title.includes('cc'))) {
        boolHaveCc = true;
      } else {
        boolHaveMain = true;
      }
    }
  };

  loopOverStreamsOfType(args, 'subtitle', subProcess);

  // Check if all Good or Determine if we are missing a sub we want in the MKV
  let boolCheckForSrt = false;
  if (!boolHaveMain) {
    boolCheckForSrt = true;
  }
  if (boolGetForced) {
    if (!boolHaveForced) {
      boolCheckForSrt = true;
    }
  }
  if (boolGetSdh) {
    if (!boolHaveSdh) {
      boolCheckForSrt = true;
    }
  }
  if (boolGetCc) {
    if (!boolHaveCc) {
      boolCheckForSrt = true;
    }
  }
  if (!boolCheckForSrt) {
    return subtitleSettings;
  }

  // Setup Variable to Check Disk for the files
  const dispostionMain = '';
  const dispostionForced = '.forced';
  const dispostionSdh = '.sdh';
  const dispostionCc = '.cc';

  const buildSrtFile = (lang :string, disposition :string) => {
    const fileName = getFileName(args.originalLibraryFile._id);
    const orignalFolder = getFileAbosluteDir(args.originalLibraryFile._id);
    const tempsrtFile = [orignalFolder, '/', fileName];
    tempsrtFile.push(`.${lang}${disposition}.srt`);
    const srtFile = tempsrtFile.join('');
    return srtFile;
  };

  const mainSubFile = buildSrtFile(processLanguage, dispostionMain);
  const mainAltSubFile = buildSrtFile(processLanguage2, dispostionMain);
  const forcedSubFile = buildSrtFile(processLanguage, dispostionForced);
  const forcedAltSubFile = buildSrtFile(processLanguage2, dispostionForced);
  const sdhSubFile = buildSrtFile(processLanguage, dispostionSdh);
  const sdhAltSubFile = buildSrtFile(processLanguage2, dispostionSdh);
  const ccSubFile = buildSrtFile(processLanguage, dispostionCc);
  const ccAltSubFile = buildSrtFile(processLanguage2, dispostionCc);

  // Check for the SRT files names we want
  const findSrtFile = (subFile :string, altSubFile :string) => {
    if (fs.existsSync(`${subFile}`)) {
      return subFile;
    }
    if (fs.existsSync(`${altSubFile}`)) {
      return altSubFile;
    }
    return null;
  };

  const mainChosenSubsFile = findSrtFile(mainSubFile, mainAltSubFile);
  const forcedChosenSubsFile = findSrtFile(forcedSubFile, forcedAltSubFile);
  const sdhChosenSubsFile = findSrtFile(sdhSubFile, sdhAltSubFile);
  const ccChosenSubsFile = findSrtFile(ccSubFile, ccAltSubFile);

  // Add Subs to MKV
  let subIndex = 1;
  const titlepMain = 'default';
  const titleForced = 'forced';
  const titleSdh = 'sdh';
  const titleCc = 'cc';

  const transcode = (chosenSubsFile :string, title :string) => {
    let disposition = title;
    if (disposition === 'sdh' || disposition === 'cc') {
      disposition = 'hearing_impaired';
    }
    const mInput = ['-sub_charenc', 'UTF-8', '-f', 'srt', '-i', chosenSubsFile];
    mInput.forEach((element) => {
      subtitleSettings.subInput.push(element);
    });
    const output = [
      '-map', `${subIndex}:s`, `-codec:s:${embeddedSubs}`, 'srt', `-metadata:s:s:${embeddedSubs}`,
      `language=${processLanguage}`, `-metadata:s:s:${embeddedSubs}`,
      `title=${title}`, `-disposition:s:${embeddedSubs}`, disposition];
    output.forEach((element) => {
      subtitleSettings.subOutput.push(element);
    });
    // eslint-disable-next-line no-plusplus
    embeddedSubs++;
    // eslint-disable-next-line no-plusplus
    subIndex++;
  };

  if (mainChosenSubsFile != null && !boolHaveMain) {
    transcode(mainChosenSubsFile, titlepMain);
    args.jobLog(`Adding ${args.inputs.langTag} SRT to MKV`);
    subtitleSettings.processFile = true;
  }
  if (forcedChosenSubsFile != null && boolGetForced && !boolHaveForced) {
    transcode(forcedChosenSubsFile, titleForced);
    args.jobLog(`Adding ${args.inputs.langTag} SRT FORCED to MKV`);
    subtitleSettings.processFile = true;
  }
  if (sdhChosenSubsFile != null && boolGetSdh && !boolHaveSdh) {
    transcode(sdhChosenSubsFile, titleSdh);
    args.jobLog(`Adding ${args.inputs.langTag} SRT SDH to MKV`);
    subtitleSettings.processFile = true;
  }
  if (ccChosenSubsFile != null && boolGetCc && !boolHaveCc) {
    transcode(ccChosenSubsFile, titleCc);
    args.jobLog(`Adding ${args.inputs.langTag} SRT CC to MKV`);
    subtitleSettings.processFile = true;
  }

  return subtitleSettings;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const dependencies = ['@cospired/i18n-iso-languages'];
  await args.installClassicPluginDeps(dependencies);

  const subtitleSettings = buildSubtitleConfiguration(args);

  if (subtitleSettings.processFile) {
    subtitleSettings.subInput.forEach((element) => {
      args.variables.ffmpegCommand.multiInputArguments.push(element);
    });
    subtitleSettings.subOutput.forEach((element) => {
      args.variables.ffmpegCommand.overallOuputArguments.push(element);
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
