/* eslint-disable */
// tdarrSkipTest
module.exports.dependencies = ['@cospired/i18n-iso-languages'];
const details = () => ({
  id: 'Tdarr_Plugin_tws101_Add_Subs_to_mkv',
  Stage: 'Pre-processing',
  Name: 'tws101 - Add Subs to mkv',
  Type: 'Video',
  Operation: 'Transcode',
  Description: ` Add Subtitles of chosen language tag to MKV. One tag only, Source files must be MKV and SRT.  All files must be in the same directory.
  Naming must be source.mkv and source.eng.srt where source is the same name and eng is the chosen language. If source.eng.srt is not found source.en.srt will be used instead.`,
  //    Created by tws101
  //    Release Version 1.31
  Version: '1.31',
  Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
  Inputs: [
    {
      name: 'language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Choose language tag to insert into the mkv'
        + ' Case-insensitive. Three letter tag and one tag only.',
    },
    {
      name: 'include_forced',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Forced subtitles will also be added, required naming is source.eng.forced.srt, this example assumes chosen tag is eng.',
    },
    {
      name: 'include_sdh',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Sdh subtitles will also be added, required naming is source.eng.sdh.srt, this example assumes chosen tag is eng.',
    },
    {
      name: 'include_cc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Sdh subtitles will also be added, required naming is source.eng.cc.srt, this example assumes chosen tag is eng.',
    },
  ],
});

// #region Helper Classes/Modules

/**
 * Handles logging in a standardised way.
 */
class Log {
  constructor() {
    this.entries = [];
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  Add(entry) {
    this.entries.push(entry);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddSuccess(entry) {
    this.entries.push(`☑ ${entry}`);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddError(entry) {
    this.entries.push(`☒ ${entry}`);
  }

  /**
   * Returns the log lines separated by new line delimiter.
   */
  GetLogData() {
    return this.entries.join('\n');
  }
}

/**
 * Handles the storage of FFmpeg configuration.
 */
class Configurator {
  constructor(defaultOutputSettings = null) {
    this.shouldProcess = false;
    this.outputSettings = defaultOutputSettings || [];
    this.inputSettings = [];
  }

  AddInputSetting(configuration) {
    this.inputSettings.push(configuration);
  }

  AddOutputSetting(configuration) {
    this.shouldProcess = true;
    this.outputSettings.push(configuration);
  }

  ResetOutputSetting(configuration) {
    this.shouldProcess = false;
    this.outputSettings = configuration;
  }

  RemoveOutputSetting(configuration) {
    const index = this.outputSettings.indexOf(configuration);

    if (index === -1) return;
    this.outputSettings.splice(index, 1);
  }

  GetOutputSettings() {
    return this.outputSettings.join(' ');
  }

  GetInputSettings() {
    return this.inputSettings.join(' ');
  }
}

// #endregion

// #region Plugin Methods

/**
 * Abort Section 
 */
function checkAbort(inputs, file, logger) {
  if (file.fileMedium !== 'video') {
    logger.AddError('File is not a video.');
    return true;
  }
  if (file.container !== 'mkv') {
    logger.AddError('File is not an MKV.');
    return true;
  }
  return false;
}

/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
function loopOverStreamsOfType(file, type, method) {
  let id = 0;
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}

/**
 * Keep all Video.    Map ALL  "-map 0"   Map Video  "-map 0:v"    Copy Video  "-c:v copy"
 */
function buildVideoConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['-map 0']);
  return configuration;
}

/**
 * Keep all audio   Map Audio "-map 0:a"  Copy Audio  "-c:a copy"
 */
function buildAudioConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['']);
  return configuration;
}

/**
 * Keep all subtitles  Map subs "-map 0:s?" Map Data "-map 0:d?" Map Attachments "-map 0:t?"   Copy Subs  "-c:s copy"     Copy all "-c copy"
 */
function buildSubtitleConfiguration(inputs, file, logger, otherArguments) {
  const configuration = new Configurator(['']);
  const fs = require('fs');
  const languages = require('@cospired/i18n-iso-languages');

  // Setup Required Variables
  const processLanguage = inputs.language.toLowerCase();
  const processLanguage2 = languages.alpha3BToAlpha2(processLanguage);
  const { originalLibraryFile } = otherArguments;
  let embeddedSubs = 0;
  let boolHaveMain = false;
  let boolHaveForced = false;
  let boolHaveSdh = false;
  let boolHaveCc = false;

  // Loop through the streams
  function subProcess(stream, id) {
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
    if (codec !== 'subrip') {
      return;
    }

    // Ignore languages we dont want
    if (processLanguage !== lang && processLanguage2 !== lang) {
      return;
    }

    // Check these titles
    if (processLanguage === lang || processLanguage2 === lang) {
      if (stream.disposition.forced || (title.includes('forced'))) {
        boolHaveForced = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} forced disposition`);
      } else if (stream.disposition.sdh || (title.includes('sdh'))) {
        boolHaveSdh = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} sdh disposition`);
      } else if (stream.disposition.cc || (title.includes('cc'))) {
        boolHaveCc = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} cc disposition`);
      } else {
        boolHaveMain = true;
        logger.AddSuccess(`Subtitle stream ${id} is ${processLanguage} `);
      }
    }
  }

  loopOverStreamsOfType(file, 'subtitle', subProcess);

  // Determine what we are needing
  let boolGetForced = false;
  let boolGetSdh = false;
  let boolGetCc = false;
  if (inputs.include_forced === true) {
    boolGetForced = true;
  }
  if (inputs.include_sdh === true) {
    boolGetSdh = true;
  }
  if (inputs.include_cc === true) {
    boolGetCc = true;
  }

  // Check if all Good
  let boolCheckForSrt = false;
  if (boolHaveMain === false) {
    boolCheckForSrt = true;
  }
  if (boolGetForced === true) {
    if (boolHaveForced === false) {
      boolCheckForSrt = true;
    }
  }
  if (boolGetSdh === true) {
    if (boolHaveSdh === false) {
      boolCheckForSrt = true;
    }
  }
  if (boolGetCc === true) {
    if (boolHaveCc === false) {
      boolCheckForSrt = true;
    }
  }
  if (boolCheckForSrt === false) {
    return configuration;
  }

  logger.Add(`Did not find all requested ${processLanguage} streams with subrip codec, looking for srt.`);

  // Setup Variable to Trasnscode
  let boolFoundMainSrt = false;
  let boolFoundForcedSrt = false;
  let boolFoundSdhSrt = false;
  let boolFoundCcSrt = false;
  const dispostionMain = '';
  const dispostionForced = '.forced';
  const dispostionSdh = '.sdh';
  const dispostionCc = '.cc';

  function buildSrtFile(lang, disposition) {
    let srtFile = '';
    if (originalLibraryFile && originalLibraryFile.file) {
      srtFile = originalLibraryFile.file;
    } else {
      srtFile = file.file;
    }
    srtFile = srtFile.split('.');
    srtFile[srtFile.length - 2] += `.${lang}${disposition}`;
    srtFile[srtFile.length - 1] = 'srt';
    srtFile = srtFile.join('.');
    return srtFile;
  }

  const mainSubFile = buildSrtFile(processLanguage, dispostionMain);
  const mainAltSubFile = buildSrtFile(processLanguage2, dispostionMain);
  const forcedSubFile = buildSrtFile(processLanguage, dispostionForced);
  const forcedAltSubFile = buildSrtFile(processLanguage2, dispostionForced);
  const sdhSubFile = buildSrtFile(processLanguage, dispostionSdh);
  const sdhAltSubFile = buildSrtFile(processLanguage2, dispostionSdh);
  const ccSubFile = buildSrtFile(processLanguage, dispostionCc);
  const ccAltSubFile = buildSrtFile(processLanguage2, dispostionCc);

  // Check to make sure srt exists
  function findSrtFile(subFile, altSubFile) {
    if (fs.existsSync(`${subFile}`)) {
      return subFile;
    } if (fs.existsSync(`${altSubFile}`)) {
      return altSubFile;
    }
  }

  const mainChosenSubsFile = findSrtFile(mainSubFile, mainAltSubFile);
  if (mainChosenSubsFile != null) {
    boolFoundMainSrt = true;
  }
  const forcedChosenSubsFile = findSrtFile(forcedSubFile, forcedAltSubFile);
  if (forcedChosenSubsFile != null) {
    boolFoundForcedSrt = true;
  }
  const sdhChosenSubsFile = findSrtFile(sdhSubFile, sdhAltSubFile);
  if (sdhChosenSubsFile != null) {
    boolFoundSdhSrt = true;
  }
  const ccChosenSubsFile = findSrtFile(ccSubFile, ccAltSubFile);
  if (ccChosenSubsFile != null) {
    boolFoundCcSrt = true;
  }

  // Trascode
  let subIndex = 1;
  const titlepMain = 'default';
  const logDispostionMain = 'disposition default';
  const titleForced = 'forced';
  const logDispostionForced = 'disposition forced';
  const titleSdh = 'sdh';
  const logDispostionSdh = 'disposition sdh';
  const titleCc = 'cc';
  const logDispostionCc = 'disposition cc';

  function transcode(chosenSubsFile, title, displog) {
    logger.AddError(`Adding SRT ${chosenSubsFile} to MKV ${displog}`);
    let disposition = title;
    if (disposition === 'sdh' || disposition === 'cc') {
      disposition = 'hearing_impaired';
    }
    configuration.AddInputSetting(` -sub_charenc "UTF-8" -f srt -i "${chosenSubsFile}"`);
    configuration.AddOutputSetting(
      ` -map ${subIndex}:s -metadata:s:s:${embeddedSubs} language=${processLanguage} -metadata:s:s:${embeddedSubs} title=${title} -disposition:s:${embeddedSubs} ${disposition}`,
    );
    embeddedSubs++;
    subIndex++;
  }

  let convert = false;
  if (boolFoundMainSrt === true && boolHaveMain === false) {
    transcode(mainChosenSubsFile, titlepMain, logDispostionMain);
    convert = true;
  }
  if (boolFoundForcedSrt === true && boolGetForced === true && boolHaveForced === false) {
    transcode(forcedChosenSubsFile, titleForced, logDispostionForced);
    convert = true;
  }
  if (boolFoundSdhSrt === true && boolGetSdh === true && boolHaveSdh === false) {
    transcode(sdhChosenSubsFile, titleSdh, logDispostionSdh);
    convert = true;
  }
  if (boolFoundCcSrt === true && boolGetCc === true && boolHaveCc === false) {
    transcode(ccChosenSubsFile, titleCc, logDispostionCc);
    convert = true;
  }

  if (convert === false) {
    logger.Add('Did not locate any requested SRT to import, nothing to do here.');
  }

  return configuration;
}

// #end region

// #Final Region
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: '',
    processFile: false,
    preset: '',
    reQueueAfter: true,
  };

  const logger = new Log();

  const abort = checkAbort(inputs, file, logger);
  if (abort) {
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const audioSettings = buildAudioConfiguration(inputs, file, logger);
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger, otherArguments);

  response.preset = `${videoSettings.GetInputSettings()},${subtitleSettings.GetInputSettings()} ${videoSettings.GetOutputSettings()}`;
  response.preset += ` ${audioSettings.GetOutputSettings()}`;
  response.preset += ` ${subtitleSettings.GetOutputSettings()}`;
  response.preset += ' -c copy';

  response.processFile = subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess('No need to process file');
  }

  response.infoLog += logger.GetLogData();
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
