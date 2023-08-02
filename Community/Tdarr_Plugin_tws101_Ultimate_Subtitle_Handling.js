/* eslint-disable */
const details = () => ({
  id: 'Tdarr_Plugin_tws101_Ultimate_Subtitle_Handling',
  Stage: 'Pre-processing',
  Name: 'tws101 -  Ultimate Subtitle Handling',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: `This plugin will extract and remove subtitles as configured.  Extractions can only be done with text subs. 
  S_TEXT/WEBVTT subtitles will be removed as ffmpeg does not handle them properly.`,
  //    Created by tws101 
  //    Inspired by tehNiemer who was inspired by drpeppershaker
  //    Release Version 1.30
  Version: '1.30',
  Tags: 'pre-processing,subtitle only,ffmpeg,configurable',
  Inputs: [
    {
      name: 'language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
      type: 'text',
      },
      tooltip: 'Specify language tag(s) here for the subtitle tracks you would like to keep/extract.'
        + '\\nEnter "all" without quotes to extract all subtitle tracks.  '
        + '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.'
        + '\\nExample: \\neng\\nExample: \\neng,jpn,fre',
    },
    {
      name: 'extract',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Extract defined language subtitle stream(s) to disk.',
    },
    {
      name: 'overwrite',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Overwrite existing subtitle files on disk if they exist. Not recomended unless you are removing all as loop is possible. 
      If you are going to have this on and not remove all, consider a break from stack plugin to address the loop`,
    },
    {
      name: 'keep_all',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `If true don't remove langauges that are not listed above. If remove_commentary, remove_signs_and_songs, remove_cc_sdh 
      are true those setting are authoritative over this one, and the track will be removed. Do not use this with remove_all.`
    },
    {
      name: 'keep_undefinded',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Keep any undefined subtitle track. '
    },
    {
      name: 'remove_commentary',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove commentary streams from file. Even if keep_all is true.',
    },
    {
      name: 'remove_signs_and_songs',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove signs and songs streams from file. Even if keep_all is true.',
    },
    {
      name: 'remove_cc_sdh',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove CC/SDH streams from file. Even if keep_all is true.',
    },
    {
      name: 'remove_all',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove all subtitle streams from file. do not use this with keep_all',
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
    return this.entries.join("\n");
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
    this.shouldProcess = true;
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
    return this.outputSettings.join(" ");
  }

  GetInputSettings() {
    return this.inputSettings.join(" ");
  }
}

// #endregion

// #region Plugin Methods

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
 * Video, Map EVERYTHING
 */
function buildVideoConfiguration(inputs, file, logger) {
  const configuration = new Configurator(["-map 0"]);
  return configuration;
}

/**
 * Audio, No Audio Config
 */
function buildAudioConfiguration(inputs, file, logger) {
  const configuration = new Configurator([""]);
  return configuration;
}

/**
 * Subtitles set ALL streams to copy and unmap unwanted subs
 */
function buildSubtitleConfiguration(inputs, file, logger, otherArguments) {
  const fs = require('fs');
  const configuration = new Configurator(["-c copy"]);
  const processLanguage = inputs.language.toLowerCase().split(',');
  const boolExtract = inputs.extract;
  const boolRemoveCommentary = inputs.remove_commentary;
  const boolRemoveSignsAndSongs = inputs.remove_signs_and_songs;
  const boolRemoveCc_Sdh = inputs.remove_cc_sdh;
  const boolKeepAll = inputs.keep_all;
  const boolRemoveAll = inputs.remove_all;
  const boolOverwright = inputs.overwrite;
  const boolKeepUndefined = inputs.keep_undefinded;

  let boolExtractAll = false;
  if (boolExtract && processLanguage === 'all') {
    boolExtractAll = true;
  }

  function subProcess(stream, id) {
    const { originalLibraryFile } = otherArguments;
    let subsFile = '';
    let lang = '';
    let title = '';
    let codec = '';
    let strDisposition = '';
    let boolCommentary = false;
    let boolSigns = false;
    let boolCc_Sdh = false;
    let boolCopyStream = true;
    let boolExtractStream = true;
    let boolTextSubs = false;

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

    if (stream.disposition.forced || (title.includes('forced'))) {
      strDisposition = '.forced';
    } else if (stream.disposition.sdh || (title.includes('sdh'))) {
      strDisposition = '.sdh';
      boolCc_Sdh = true;
    } else if (stream.disposition.cc || (title.includes('cc'))) {
      strDisposition = '.cc';
      boolCc_Sdh = true;
    } else if (stream.disposition.commentary || stream.disposition.description
      || (title.includes('commentary')) || (title.includes('description'))) {
      strDisposition = '.commentary';
      boolCommentary = true;
    } else if (stream.disposition.lyrics
      || (title.includes('signs')) || (title.includes('songs'))) {
      strDisposition = '.signsandsongs';
      boolSigns = true;
    }

    // Determine if subtitle should be extracted/copied/removed
    if (processLanguage.indexOf(lang) !== -1) {
      if ((boolCommentary && boolRemoveCommentary) || (boolCc_Sdh && boolRemoveCc_Sdh) || (boolSigns && boolRemoveSignsAndSongs)) {
        boolCopyStream = false;
        boolExtractStream = false;
      }
      if (!boolExtract) {
        boolExtractStream = false;
      }
    } else if (!boolKeepAll) {
      if (boolKeepUndefined) {
        if (!stream.tags.language || stream.tags.language.toLowerCase().includes('und')) {
        } else {
          boolCopyStream = false;
        }
      } else {
        boolCopyStream = false;
      }
    }
    if ((processLanguage.indexOf(lang) === -1) && !boolExtractAll) {
      if (boolKeepUndefined) {
        if (!stream.tags.language || stream.tags.language.toLowerCase().includes('und')) {
        } else {
          boolExtractStream = false;
        }
      } else {
        boolExtractStream = false;
      }
    }

    // Determine subtitle stream type
    if (codec === 'ass' || codec === 'mov_text' || codec === 'ssa' || codec === 'subrip') {
      boolTextSubs = true;
    } else if (codec === 's_text/webvtt') {
      boolCopyStream = false;
    }

    // Build subtitle file names.
    subsFile = originalLibraryFile.file;
    subsFile = subsFile.split('.');
    if (lang === '') {
      subsFile[subsFile.length - 2] += `.und${strDisposition}`;
    } else {
      subsFile[subsFile.length - 2] += `.${lang}${strDisposition}`;
    }
    subsFile[subsFile.length - 1] = 'srt';
    subsFile = subsFile.join('.');

    if (stream.length !== 0) {
      if (!boolRemoveAll) {
        // Copy subtitle stream
        if (boolCopyStream) {
          logger.AddSuccess(`Subtitle stream ${id}: ${lang}${strDisposition} is wanted keeping. `);
          // Skip/Remove undesired subtitle streams.
        } else {
          logger.AddError(`Subtitle stream ${id}: ${lang}${strDisposition} will be removed.`);
          configuration.AddOutputSetting(` -map -0:s:${id}`);
        }
      }
      // Verify subtitle track is a format that can be extracted.
      if (boolExtractStream || boolExtractAll) {
        // Extract subtitle if it doesn't exist on disk or the option to overwrite is set.
        if (!boolTextSubs) {
          logger.AddSuccess(`Subtitle stream ${id}: ${lang}${strDisposition} is not text based, can not extract. no action needed.`);
        } else if (fs.existsSync(`${subsFile}`) && !boolOverwright) {
          logger.AddSuccess(`Subtitle stream ${id}: ${lang}${strDisposition} External subtitle already exists, will not extract, no action needed.`);
        } else {
          logger.AddError(`Subtitle stream ${id}: ${lang}${strDisposition} will be extracted to file.`);
          configuration.AddInputSetting(` -map 0:s:${id} "${subsFile}"`);
        }
      }
    }
    return;
  }

  loopOverStreamsOfType(file, "subtitle", subProcess);

  if (boolRemoveAll) {
    logger.AddError(`Removing all subtitles!`);
    configuration.AddOutputSetting(` -map -0:s`);
  }

  return configuration;
}

//end process subs needs work

// Final Region
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: true,
  };

  const logger = new Log();
  const boolRemoveAll = inputs.remove_all;
  const boolKeepAll = inputs.keep_all;

  // Begin Abort Section
  
  // Varibles for abort section
  let hasSubs = false;

  // Verify video
  if (file.fileMedium !== 'video') {
    logger.AddError("File is not a video.");
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

  //check has subs
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();
    if (strStreamType === 'text' || strStreamType === 'subtitle') {
      hasSubs = true;
    }
  }

  if (hasSubs === true) {
    logger.AddSuccess(`Found subs!`);
  } else {
    logger.AddSuccess(`No subs in file, skipping!`);
    response.infoLog += logger.GetLogData();
    response.processFile = false;
    return response;
  }

  if (boolKeepAll && boolRemoveAll) {
    logger.AddError(`Cant remove all and keep all at the same time wise guy`);
    response.infoLog += logger.GetLogData();
    response.processFile = false;
    return response;
  }

  // End Abort Section

  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const audioSettings = buildAudioConfiguration(inputs, file, logger);
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger, otherArguments);

  response.preset = '-y <io>';
  response.preset += ` ${subtitleSettings.GetInputSettings()}`
  response.preset += ` ${videoSettings.GetOutputSettings()}`
  response.preset += ` ${audioSettings.GetOutputSettings()}`
  response.preset += ` ${subtitleSettings.GetOutputSettings()}`

  response.processFile =
    subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess("No need to process file");
  }

  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;