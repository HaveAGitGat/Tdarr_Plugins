const details = () => ({
  id: 'Tdarr_Plugin_tws101_Ultimate_Subtitle_Handling',
  Stage: 'Pre-processing',
  Name: 'tws101 Ultimate Subtitle Handling',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: `This plugin will extract and remove subtitles as configured.  Extractions can only be done with text subs. 
  S_TEXT/WEBVTT subtitles will be removed as ffmpeg does not handle them properly.`,
  //    Created by tws101 
  //    Inspired by tehNiemer who was inspired by drpeppershaker
  //    Release Version 1.10
  Version: '1.10',
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
        + '\\nEnter "all" without quotes to copy/extract all subtitle tracks.'
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
      tooltip: `When false languages not listed will be removed. If remove_commentary, remove_signs_and_songs, remove_cc_sdh 
      are true those setting are authoritative over this one. Do not use this remove_all.`
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
      tooltip: 'Remove commentary streams from file. May be used with keep_all.',
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
      tooltip: 'Remove signs and songs streams from file. May be used with keep_all.',
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
      tooltip: 'Remove CC/SDH streams from file. May be used with keep_all.',
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
    var index = this.outputSettings.indexOf(configuration);

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
  var id = 0;
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}

/**
 * Keep all audio
 */
function buildAudioConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:a copy"]);
  return configuration;
}

/**
 * Keep all Video
 */
function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0", "-c:v copy"]);
  return configuration;
}

/**
 * Process subtitles section needs work
 */
function buildSubtitleConfiguration(inputs, file, logger, otherArguments) {
  const fs = require('fs');
  var configuration = new Configurator(["-c copy"]);
  const processLanguage = inputs.language.toLowerCase().split(',');
  const bolExtract = inputs.extract;
  const bolRemoveCommentary = inputs.remove_commentary;
  const bolRemovesignsandsongs = inputs.remove_signs_and_songs;
  const bolRemoveCC_SDH = inputs.remove_cc_sdh;
  const bolKeepAll = inputs.keep_all;
  const bolRemoveAll = inputs.remove_all;
  const bolOverwright = inputs.overwrite;
  const bolKeepUndefined = inputs.keep_undefinded;

  let bolExtractAll = false;
  if (bolExtract && processLanguage === 'all') {
    bolExtractAll = true;
  }

  function subProcess(stream, id) {
    const { originalLibraryFile } = otherArguments;
    let subsFile = '';
    let lang = '';
    let title = '';
    let strDisposition = '';
    let bolCommentary = false;
    let bolSigns = false;
    let bolCC_SDH = false;
    let bolCopyStream = true;
    let bolExtractStream = true;
    let bolTextSubs = false;

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
      bolCC_SDH = true;
    } else if (stream.disposition.cc || (title.includes('cc'))) {
      strDisposition = '.cc';
      bolCC_SDH = true;
    } else if (stream.disposition.commentary || stream.disposition.description
      || (title.includes('commentary')) || (title.includes('description'))) {
      strDisposition = '.commentary';
      bolCommentary = true;
    } else if (stream.disposition.lyrics
      || (title.includes('signs')) || (title.includes('songs'))) {
      strDisposition = '.signsandsongs';
      bolSigns = true;
    }

    // Determine if subtitle should be extracted/copied/removed
    if (processLanguage.indexOf(lang) !== -1) {
      if ((bolCommentary && bolRemoveCommentary) || (bolCC_SDH && bolRemoveCC_SDH) || (bolSigns && bolRemovesignsandsongs)) {
        bolCopyStream = false;
        bolExtractStream = false;
      }
      if (!bolExtract) {
        bolExtractStream = false;
      }
    } else if (!bolKeepAll) {
      if (bolKeepUndefined) {
        if (!stream.tags.language || stream.tags.language.toLowerCase().includes('und')) {}
      } else {
        bolCopyStream = false;
      }
    }
    if ((processLanguage.indexOf(lang) === -1) && !bolExtractAll) {
      if (bolKeepUndefined) {
        if (!stream.tags.language || stream.tags.language.toLowerCase().includes('und')) {}
      } else {
        bolExtractStream = false;
      }
    }

    // Determine subtitle stream type
    if (codec === 'ass' || codec === 'mov_text' || codec === 'ssa' || codec === 'subrip') {
      bolTextSubs = true;
    } else if (codec === 's_text/webvtt') {
      bolCopyStream = false;
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
      if (!bolRemoveAll) {
        // Copy subtitle stream
        if (bolCopyStream) {
          logger.AddSuccess(`Subtitle stream ${id}: ${lang}${strDisposition} will be copied. `);
          // Skip/Remove undesired subtitle streams.
        } else {
          logger.AddError(`Subtitle stream ${id}: ${lang}${strDisposition} will be removed`);
          configuration.AddOutputSetting(` -map -0:s:${id}`);
        }
      }
      // Verify subtitle track is a format that can be extracted.
      if (bolExtractStream || bolExtractAll) {
        // Extract subtitle if it doesn't exist on disk or the option to overwrite is set.
        if (!bolTextSubs) {
          logger.AddSuccess(`Subtitle stream ${id}: ${lang}${strDisposition} is not text based, can not extract.`);
        } else if (fs.existsSync(`${subsFile}`) && !bolOverwright) {
          logger.AddSuccess(`Subtitle stream ${id}: ${lang}${strDisposition} External subtitle already exists, will not extract`);
        } else {
          logger.AddError(`Subtitle stream ${id}: ${lang}${strDisposition} will be extracted to file.`);
          configuration.AddInputSetting(` -map 0:s:${id} "${subsFile}"`);
        }
      }
    }
    return;
  }

  loopOverStreamsOfType(file, "subtitle", subProcess);

  if (bolRemoveAll) {
    logger.AddError(`Removing all subtitles!`);
    configuration.AddOutputSetting(` -map -0:s`);
  }

  return configuration;
}

//end process subs needs work

// Final Region
// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
// eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: true,
  };

  var logger = new Log();
  const bolRemoveAll = inputs.remove_all;
  const bolKeepAll = inputs.keep_all;

  // Begin Abort Section
  let hasSubs = false;
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

  if (bolKeepAll && bolRemoveAll) {
    logger.AddError(`Cant remove all and keep all at the same time wise guy`);
    response.infoLog += logger.GetLogData();
    response.processFile = false;
    return response;
  }

  // End Abort Section

  var audioSettings = buildAudioConfiguration(inputs, file, logger);
  var videoSettings = buildVideoConfiguration(inputs, file, logger);
  var subtitleSettings = buildSubtitleConfiguration(inputs, file, logger, otherArguments);

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