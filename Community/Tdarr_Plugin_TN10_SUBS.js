// jshint esversion: 6
/* eslint operator-linebreak: ["error", "after"] */
/* eslint eqeqeq: 1 */
// tdarrSkipTest

// Created by tehNiemer with thanks to drpeppershaker for the plugin
// Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT which served as the building blocks.
const details = () => ({
  id: 'Tdarr_Plugin_TN10_SUBS',
  Stage: 'Pre-processing',
  Name: 'tehNiemer - Extract/Copy/Remove embedded subtitles',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: 'This plugin will extract/copy/remove embedded text and image based subtitles ' +
    'according to user defined preferences in one pass inside Tdarr, ' +
    'S_TEXT/WEBVTT subtitles will be removed as ffmpeg does not handle them properly.\n\n ',
  Version: '1.00',
  Tags: 'pre-processing,subtitle only,ffmpeg,configurable',
  Inputs: [{
    name: 'language',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Specify language tag(s) here for the subtitle tracks you would like to keep/extract. ' +
      'Enter "all" without quotes to copy/extract all subtitle tracks. ' +
      'Leave blank and enable "rm_all" to remove all subtitles from file.' +
      '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.' +
      '\\nExample: \\neng\\nExample: \\neng,jpn,fre',
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
    tooltip: 'Overwrite existing subtitle files on disk if they exist.',
  },
  {
    name: 'rm_extra_lang',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Remove unwanted language subtitle streams from file. Defined language(s) will not be removed.',
  },
  {
    name: 'rm_commentary',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Remove commentary subtitle streams from file.',
  },
  {
    name: 'rm_cc_sdh',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Remove CC/SDH subtitle streams from file.',
  },
  {
    name: 'rm_all',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Remove all subtitle streams from file.',
  },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  const fs = require('fs');
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    processFile: true,
    error: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if (inputs.language === '' && (inputs.extract === true || inputs.rm_extra_lang === true ||
    inputs.rm_commentary === true || inputs.rm_cc_sdh === true)) {
    response.processFile = false;
    response.error = true;
    response.infoLog += 'Please configure language. Skipping this plugin. \n';
    return response;
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    response.processFile = false;
    response.error = true;
    response.infoLog += 'File is not video \n';
    return response;
  }

  // Make sure file has subtitles.
  let hasSubs = false;
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();
    if (strStreamType === 'subtitle' || strStreamType === 'text') {
      hasSubs = true;
    }
  }

  if (hasSubs === true) {
    response.infoLog += 'Found subs!\n';
  } else {
    response.processFile = false;
    response.infoLog += 'No subs in file, skipping!\n';
    return response;
  }

  // Set global variables.
  let cmdRemove = '';
  let cmdExtract = '';
  const processLanguage = inputs.language.toLowerCase().replace(/\s+/g, '').split(',');
  const bolExtract = inputs.extract;
  const bolRemoveCommentary = inputs.rm_commentary;
  const bolRemoveCC_SDH = inputs.rm_cc_sdh;
  let bolRemoveUnwanted = inputs.rm_extra_lang;
  const bolRemoveAll = inputs.rm_all;
  const bolOverwright = inputs.overwrite;

  const subsArr = file.ffProbeData.streams.filter((row) => row.codec_type.toLowerCase() === 'subtitle' ||
    row.codec_type.toLowerCase() === 'text');

  let bolExtractAll = false;
  if (bolExtract && processLanguage === 'all') {
    bolExtractAll = true;
  }

  if (bolRemoveAll) {
    bolRemoveUnwanted = false;
  }

  for (let i = 0; i < subsArr.length; i += 1) {
    // Set per-stream variables
    const subStream = subsArr[i];
    const { originalLibraryFile } = otherArguments;
    let subsFile = '';
    let lang = '';
    let title = '';
    let codec = '';
    let strDisposition = '';
    let bolCommentary = false;
    let bolCC_SDH = false;
    let bolCopyStream = true;
    let bolExtractStream = true;
    let bolTextSubs = false;

    if (subStream.tags !== undefined) {
      if (subStream.tags.language !== undefined) {
        lang = subStream.tags.language.toLowerCase();
      }
      if (subStream.tags.title !== undefined) {
        title = subStream.tags.title.toLowerCase();
      }
    }
    if (subStream.codec_name !== undefined) {
      codec = subStream.codec_name.toLowerCase();
    }

    if (subStream.disposition.forced || (title.includes('forced'))) {
      strDisposition = '.forced';
    } else if (subStream.disposition.sdh || (title.includes('sdh'))) {
      strDisposition = '.sdh';
      bolCC_SDH = true;
    } else if (subStream.disposition.cc || (title.includes('cc'))) {
      strDisposition = '.cc';
      bolCC_SDH = true;
    } else if (subStream.disposition.commentary || subStream.disposition.description ||
      (title.includes('commentary')) || (title.includes('description'))) {
      strDisposition = '.commentary';
      bolCommentary = true;
    }

    // Determine if subtitle should be extracted/copied/removed
    if (processLanguage.indexOf(lang) !== -1) {
      if ((bolCommentary && bolRemoveCommentary) || (bolCC_SDH && bolRemoveCC_SDH)) {
        bolCopyStream = false;
        bolExtractStream = false;
      }
      if (!bolExtract) {
        bolExtractStream = false;
      }
    } else if (bolRemoveUnwanted) {
      bolCopyStream = false;
    }
    if ((processLanguage.indexOf(lang) === -1) && !bolExtractAll) {
      bolExtractStream = false;
    }

    // Determine subtitle stream type
    if (codec === 'ass' || codec === 'mov_text' ||
      codec === 'ssa' || codec === 'subrip') {
      bolTextSubs = true;
      response.infoLog += 'Text ';
    } else if (codec === 's_text/webvtt') {
      bolCopyStream = false;
      response.infoLog += 'S_TEXT/WEBVTT ';
    } else {
      response.infoLog += 'Image ';
    }

    // Build subtitle file names.
    subsFile = originalLibraryFile.file;
    subsFile = subsFile.split('.');
    subsFile[subsFile.length - 2] += `.${lang}${strDisposition}`;
    subsFile[subsFile.length - 1] = 'srt';
    subsFile = subsFile.join('.');

    if (subsArr.length !== 0) {
      const { index } = subStream;
      response.infoLog += `stream ${index}: ${lang}${strDisposition}. `;
      if (!bolRemoveAll) {
        // Copy subtitle stream
        if (bolCopyStream) {
          response.infoLog += 'Stream will be copied. ';
          // Skip/Remove undesired subtitle streams.
        } else {
          response.infoLog += 'Stream is unwanted, removing. ';
          cmdRemove += ` -map -0:${index}`;
        }
      }
      // Verify subtitle track is a format that can be extracted.
      if (bolExtractStream || bolExtractAll) {
        // Extract subtitle if it doesn't exist on disk or the option to overwrite is set.
        if (!bolTextSubs) {
          response.infoLog += 'Subtitle is not text based, can not extract. ';
        } else if (fs.existsSync(`${subsFile}`) && !bolOverwright) {
          response.infoLog += 'External subtitle already exists, will not extract. ';
        } else {
          response.infoLog += 'Stream will be extracted to file. ';
          cmdExtract += ` -map 0:${index} "${subsFile}"`;
        }
      }
      response.infoLog += '\n';
    }
  }

  if (cmdRemove === '' && cmdExtract === '' && !bolRemoveAll) {
    response.processFile = false;
    response.infoLog += 'Nothing to do, skipping!\n';
    return response;
  }

  // Build process command
  response.preset = '-y <io>';
  response.preset += cmdExtract;
  response.preset += ' -map 0';
  if (bolRemoveAll) {
    response.infoLog += 'Removing all subtitles!\n';
    response.preset += ' -map -0:s';
  }
  response.preset += ' -c copy';
  response.preset += cmdRemove;
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
