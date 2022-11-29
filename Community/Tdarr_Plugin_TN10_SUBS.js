// jshint esversion: 6
// tdarrSkipTest

// Created by tehNiemer with thanks to drpeppershaker for the plugin
// Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT which served as the base for this.
const details = () => ({
  id: 'Tdarr_Plugin_TN10_SUBS',
  Stage: 'Pre-processing',
  Name: 'tehNiemer - Extract/Copy/Remove embedded subtitles',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: 'This plugin will extract/copy/remove embedded text and image based subtitles '
    + 'according to user defined preferences in one pass inside Tdarr, '
    + 'S_TEXT/WEBVTT subtitles will be removed as ffmpeg does not handle them properly.\n\n ',
  Version: '1.00',
  Tags: 'pre-processing,subtitle only,ffmpeg,configurable',
  Inputs: [{
    name: 'language',
    type: 'string',
    defaultValue: '',
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
    tooltip: 'Remove extra language subtitle streams from file. '
      + '\\nLanguage(s) defined above will not be removed.',
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
    tooltip: 'Remove commentary streams from file.',
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
    tooltip: 'Remove CC/SDH streams from file.',
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
  // Must return this object at some point in the function else plugin will fail.
  const response = {
    processFile: true,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    response.infoLog += 'File is not video \n';
    response.processFile = false;
    return response;
  }

  // Make sure file has subtitles.
  let hasSubs = false;
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();
    if (strStreamType === ('subtitle' || 'text')) {
      hasSubs = true;
    }
  }

  if (hasSubs === true) {
    response.infoLog += 'Found subs!\n';
  } else {
    response.infoLog += 'No subs in file, skipping!\n';
    response.processFile = false;
    return response;
  }

  // Set global variables.
  let cmdRemove = '';
  let cmdExtract = '';
  const processLanguage = inputs.language.toLowerCase().split(',');
  const bolExtract = inputs.extract;
  const bolRemoveCommentary = inputs.rm_commentary;
  const bolRemoveCC_SDH = inputs.rm_cc_sdh;
  let bolRemoveUnwanted = inputs.rm_extra_lang;
  const bolRemoveAll = inputs.rm_all;
  const bolOverwright = inputs.overwrite;

  const subsArr = file.ffProbeData.streams.filter((row) => row.codec_type.toLowerCase() === ('subtitle' || 'text'));

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
    let strDisposition = '';
    let bolCommentary = false;
    let bolCC_SDH = false;
    let bolCopyStream = true;
    let bolExtractStream = true;
    let bolTextSubs = false;

    if (subStream && subStream.tags && subStream.tags.language) {
      lang = subStream.tags.language;
    }

    if (subStream && subStream.tags && subStream.tags.title) {
      title = subStream.tags.title;
    }

    if (subStream.disposition.forced || (title.toLowerCase().includes('forced'))) {
      strDisposition = '.forced';
    } else if (subStream.disposition.sdh || (title.toLowerCase().includes('sdh'))) {
      strDisposition = '.sdh';
      bolCC_SDH = true;
    } else if (subStream.disposition.cc || (title.toLowerCase().includes('cc'))) {
      strDisposition = '.cc';
      bolCC_SDH = true;
    } else if (subStream.disposition.commentary || subStream.disposition.description
      || (title.toLowerCase().includes('commentary')) || (title.toLowerCase().includes('description'))) {
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
    if (subStream.codec_name === ('subrip' || 'mov_text')) {
      bolTextSubs = true;
      response.infoLog += 'Text ';
    } else if (subStream.codec_name === ('S_TEXT/WEBVTT')) {
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
    response.infoLog += 'Nothing to do, skipping!\n';
    response.processFile = false;
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
