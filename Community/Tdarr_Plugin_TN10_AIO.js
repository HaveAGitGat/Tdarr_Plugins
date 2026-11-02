// jshint esversion: 8
/* eslint operator-linebreak: ["error", "after"] */
/* eslint eqeqeq: 1 */
/* eslint no-await-in-loop: 0 */
module.exports.dependencies = ['axios@0.27.2', '@cospired/i18n-iso-languages'];
// tdarrSkipTest

// Created by tehNiemer with thanks to JarBinks, drpeppershaker, and supersnellehenk for the plugins
// Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile, Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT
// and Tdarr_Plugin_henk_Keep_Native_Lang_Plus_Eng which served as the building blocks.

// Known issues:
// 1. Some files with missing mediaInfo and subtitles will fail even after remuxing, stream mapping is
//    incorrect if they are kept. Removing all subtitles in these files seems to work.
// 2. Some files can not be hardware transcoded and will fail with "Impossible to convert between the formats
//    supported by the filter 'Parsed_null_0' and the filter 'auto_scaler_0'", these seem to work with software
//    transcoding.
const details = () => ({
  id: 'Tdarr_Plugin_TN10_AIO',
  Stage: 'Pre-processing',
  Name: 'tehNiemer - AIO: convert video, audio, and subtitles - user configurable',
  Type: 'Video',
  Operation: 'Transcode',
  Description: '(Re)encode files to h265 and AAC with user defined bitrate parameters, files are output to MKV. ' +
    'Removes all but one video stream. Keeps user defined audio language(s) as well as the original, ' +
    'as-filmed, language if enabled. At least one audio stream wil be kept regardless of settings, all others ' +
    'will be removed. Extract/copy/remove embedded text and image based subtitles. ' +
    'S_TEXT/WEBVTT subtitles will be removed.\n\n',
  Version: '1.02',
  Tags: 'pre-processing,ffmpeg,video,audio,subtitle,qsv,vaapi,h265,aac,configurable',
  Inputs: [{
    name: 'reProcess',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Allow previously processed file to be processed again with different parameters.',
  },
  {
    name: 'statsDays',
    type: 'number',
    defaultValue: 21,
    inputUI: {
      type: 'text',
    },
    tooltip: 'If the stats date on mkv files are older than this they will be updated.',
  },
  {
    name: 'minBitrate4K',
    type: 'number',
    defaultValue: 20000,
    inputUI: {
      type: 'text',
    },
    tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 3840 x 2160 stream.',
  },
  {
    name: 'minBitrate1080p',
    type: 'number',
    defaultValue: 5000,
    inputUI: {
      type: 'text',
    },
    tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 1920 x 1080 stream.',
  },
  {
    name: 'minBitrate720p',
    type: 'number',
    defaultValue: 2200,
    inputUI: {
      type: 'text',
    },
    tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 1280 x 720 stream.',
  },
  {
    name: 'minBitrate480p',
    type: 'number',
    defaultValue: 750,
    inputUI: {
      type: 'text',
    },
    tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 640 x 480 stream.',
  },
  {
    name: 'encode10bit',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Re-encode 8bit color depth to 10bit.',
  },
  {
    name: 'audioBitrate',
    type: 'number',
    defaultValue: 64,
    inputUI: {
      type: 'text',
    },
    tooltip: 'Desired audio bitrate per channel in kbps. 64K per channel gives you good lossy quality out of AAC.',
  },
  {
    name: 'audioChannels',
    type: 'number',
    defaultValue: 6,
    inputUI: {
      type: 'text',
    },
    tooltip: 'Maximum number of audio channels, anything more than this will be reduced.' +
      '\\nExample: \\n2.1 = 3, 5.1 = 6, 7.1 = 8',
  },
  {
    name: 'audioLanguage',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Specify language tag(s) here for the audio tracks you would like to keep.' +
      'Enter "all" without quotes to keep all audio tracks.' +
      '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes' +
      '\\nExample: \\neng\\nExample: \\neng,jpn,fre',
  },
  {
    name: 'keepOrigLang',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Keep original release language in addition to desired audio language, if it exists. ' +
      'File path must contain IMDb ID. \\nExample: \\ntt1234567' +
      '\\nTMDB api (v3) required for this option',
  },
  {
    name: 'apiKey',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: 'TMDB api (v3) to querey original release language. https://www.themoviedb.org/',
  },
  {
    name: 'subLanguage',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Specify language tag(s) here for the subtitle tracks you would like to keep/extract. ' +
      'Enter "all" without quotes to copy/extract all subtitle tracks. ' +
      'Leave blank and enable "rm_all" to remove all subtitles from file.' +
      '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes' +
      '\\nExample: \\neng\\nExample: \\neng,jpn,fre',
  },
  {
    name: 'subExtract',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Extract defined language subtitle stream(s) from file.',
  },
  {
    name: 'subOverwrite',
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
    name: 'subRmExtraLang',
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
    name: 'subRmCommentary',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Remove commentary subtitle streams from file.\nIf extract is set to true and this to false ' +
    'the stream will NOT be extracted.',
  },
  {
    name: 'subRmCC_SDH',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: 'Remove CC/SDH subtitle streams from file.\nIf extract is set to true and this to false ' +
    'the stream will NOT be extracted.',
  },
  {
    name: 'subRmAll',
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

// eslint-disable-next-line consistent-return
const findMediaInfoItem = (file, index) => {
  let currMIOrder = -1;
  const strStreamType = file.ffProbeData.streams[index].codec_type.toLowerCase();

  for (let i = 0; i < file.mediaInfo.track.length; i += 1) {
    if (file.mediaInfo.track[i].StreamOrder) {
      currMIOrder = file.mediaInfo.track[i].StreamOrder;
    } else if (strStreamType === 'subtitle' || strStreamType === 'text') {
      currMIOrder = file.mediaInfo.track[i].ID - 1;
    } else {
      currMIOrder = -1;
    }

    if (parseInt(currMIOrder, 10) === parseInt(index, 10) || currMIOrder === `0-${index}`) {
      return i;
    }
  }
  return -1;
};

// eslint-disable-next-line consistent-return
const findStreamInfo = (file, index, info) => {
  let disposition = '';
  let language = '???';
  let title = '';
  let bitrate;
  if (file.ffProbeData.streams[index].tags !== undefined) {
    if (file.ffProbeData.streams[index].tags.language !== undefined) {
      language = file.ffProbeData.streams[index].tags.language.toLowerCase();
    }
    if (file.ffProbeData.streams[index].tags.title !== undefined) {
      title = file.ffProbeData.streams[index].tags.title.toLowerCase();
    }
  }
  if (file.ffProbeData.streams[index].disposition !== undefined) {
    if (file.ffProbeData.streams[index].disposition.forced || (title.includes('forced'))) {
      disposition = '.forced';
    } else if (file.ffProbeData.streams[index].disposition.sdh || (title.includes('sdh'))) {
      disposition = '.sdh';
    } else if (file.ffProbeData.streams[index].disposition.cc || (title.includes('cc'))) {
      disposition = '.cc';
    } else if (file.ffProbeData.streams[index].disposition.commentary ||
      file.ffProbeData.streams[index].disposition.description ||
      (title.includes('commentary')) || (title.includes('description'))) {
      disposition = '.commentary';
    }
  }
  if (file.mediaInfo.track[findMediaInfoItem(file, index)].extra !== undefined) {
    bitrate = file.mediaInfo.track[findMediaInfoItem(file, index)].extra.FromStats_BitRate * 1;
  }
  // eslint-disable-next-line default-case
  switch (info) {
    case 'language':
      return language;
    case 'disposition':
      return disposition;
    case 'bitrate':
      return bitrate;
  }
};

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const fs = require('fs');
  // eslint-disable-next-line global-require
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // eslint-disable-next-line import/no-unresolved
  const axios = require('axios').default;
  // eslint-disable-next-line import/no-unresolved
  const languages = require('@cospired/i18n-iso-languages');

  const response = {
    processFile: false,
    error: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: '',
  };

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if (inputs.minBitrate4K <= 4000 || inputs.minBitrate1080p <= 1000 || inputs.minBitrate720p <= 450 ||
    inputs.minBitrate480p <= 150 || inputs.audioBitrate <= 15 || inputs.audioChannels <= 0 ||
    inputs.audioLanguage === '' || (inputs.subLanguage === '' && (inputs.subExtract || inputs.subRmExtraLang ||
    inputs.subRmCommentary || inputs.subRmCC_SDH)) || (inputs.keepOrigLang && inputs.tmdbAPI === '')) {
    response.infoLog += 'Please configure all options with reasonable values. Skipping this plugin.\n';
    response.error = true;
    return response;
  }

  // Settings
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Video
  const targetVideoCodec = 'hevc'; // Desired Video Codec, if you change this it might require code changes
  let bolUse10bit = inputs.re_encode10bit;
  const targetFrameRate = 24; // This is used to adjust target bitrate for streams with higher or lower frame rates
  const maxVideoHeight = 2160; // Any thing over this size, I.E. 4K, will be reduced to this
  // Since videos can have many widths and heights we need to convert to pixels
  // (WxH) to understand what we are dealing with and set a minimum bitrate
  const minVideoPixels4K = 3840 * 2160 * 0.50;
  const minBitrate4K = inputs.minBitrate4K * 1000;
  const minVideoPixels1080p = 1920 * 1080 * 0.50;
  const minBitrate1080p = inputs.minBitrate1080p * 1000;
  const minVideoPixels720p = 1280 * 720 * 0.50;
  const minBitrate720p = inputs.minBitrate720p * 1000;
  const minBitrate480p = inputs.minBitrate480p * 1000;

  // Audio
  const targetAudioCodec = 'aac'; // Desired Audio Codec, if you change this it might require code changes
  const targetAudioBitratePerChannel = inputs.audioBitrate * 1000;
  const targetAudioChannels = inputs.audioChannels;
  const bolKeepOriginalLanguage = inputs.keepOrigLang;
  const tmdbAPI = inputs.apiKey;
  const targetAudioLanguage = [[], []];
  targetAudioLanguage[0] = inputs.audioLanguage.toLowerCase().replace(/\s+/g, '').split(',');

  // Subtitle
  const bolExtract = inputs.subExtract;
  const bolRemoveUnwanted = inputs.subRmExtraLang;
  const bolRemoveCommentary = inputs.subRmCommentary;
  const bolRemoveCC_SDH = inputs.subRmCC_SDH;
  const bolRemoveAll = inputs.subRmAll;
  const bolOverwright = inputs.subOverwrite;
  const targetSubLanguage = [[], []];
  targetSubLanguage[0] = inputs.subLanguage.toLowerCase().replace(/\s+/g, '').split(',');

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Pre-Process Checks
  const intStatsDays = inputs.statsDays;
  const bolReProcess = inputs.reProcess;
  const proc = require('child_process');
  let bolStatsAreCurrent = false;

  // Check if file is a video, if it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.infoLog += 'File is not a video. Exiting \n';
    response.error = true;
    return response;
  }

  // Check file statistics.
  if (file.container === 'mkv') {
    let TNDate;
    let statsDate = Date.parse(new Date(70, 1).toISOString());
    if (file.ffProbeData.streams[0].tags !== undefined &&
      file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng'] !== undefined) {
      statsDate = Date.parse(`${file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng']} GMT`);
      const statsDateISO = new Date(statsDate).toISOString().split('.')[0];
      response.infoLog += `Date file statistics were updated: ${statsDateISO}\n`;
    }

    if (file.scannerReads.mediaInfoRead === 'success' &&
      (file.mediaInfo.track[0].extra !== undefined && file.mediaInfo.track[0].extra.TNDATE !== undefined)) {
      TNDate = Date.parse(file.mediaInfo.track[0].extra.TNDATE);
      const TNDateISO = new Date(TNDate).toISOString().split('.')[0];
      response.infoLog += `Date last processed by this plugin: ${TNDateISO}\n`;
      if (statsDate >= TNDate) {
        bolStatsAreCurrent = true;
      }
    } else {
      const statsThres = Date.parse(new Date(new Date().setDate(new Date().getDate() - intStatsDays)).toISOString());
      if (statsDate >= statsThres) {
        bolStatsAreCurrent = true;
      }
    }

    if (!bolStatsAreCurrent) {
      response.infoLog += 'Stats need to be updated!\n';
      try {
        proc.execSync(`mkvpropedit --add-track-statistics-tags "${file.file}"`);
      } catch (err) {
        response.infoLog += '- Error updating stats, will continue anyways.\n';
      }
    }

    // If the file was just processed we dont need to do it again.
    if (TNDate) {
      const processTimeout = 6 * 60 * 60 * 1000;
      const processLast = Date.now() - TNDate;
      const reProcessIn = Math.round(((TNDate + processTimeout) - Date.now()) / (1000 * 60));
      if (bolReProcess && (processLast > processTimeout)) {
        response.infoLog += 'Re-Processing!\n';
      } else {
        response.infoLog += 'Will not re-process!\n';
        if (bolReProcess) response.infoLog += `Eligible for re-processing in ${reProcessIn} minutes.\n`;
        return response;
      }
    }
  }

  // Check that all necessary information exists, if not, add it.
  if (file.scannerReads.mediaInfoRead !== 'success' || (file.container === 'mkv' && !bolStatsAreCurrent)) {
    if (file.scannerReads.mediaInfoRead !== 'success') {
      response.infoLog += 'MediaInfo is missing, make sure switch is enabled in library settings.\n';
    }
    response.infoLog += 'File needs work before this plugin can continue, remuxing!\n';
    response.preset += ' <io> -map 0 -c copy ';
    response.container = `.${file.container}`;
    response.processFile = true;
    return response;
  }

  // Logic Controls
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Video
  let bolTranscodeVideo = true; // We will assume we will be transcoding
  let bolScaleVideo = false;
  let bolSource10bit = false;
  let bolTranscodeSoftwareDecode = false;
  let optimalVideoBitrate = 0;
  let minimumVideoBitrate = 0;
  let targetCodecCompression = 0;
  let videoNewWidth = 0;
  let videoIdx = -1;
  let videoIdxFirst = -1;

  // Audio
  let cmdAudioMap = '';
  let bolTranscodeAudio = false;
  let bolModifyStream = false;
  let audioNewChannels = 0;
  let optimalAudioBitrate = 0;
  let audioChannels = 0;
  let audioBitrate = 0;
  let streamIdxChannels = 0;
  let streamIdxBitrate = 0;
  let streamIdxOther = -1;

  // Determine original language if possible.
  if (bolKeepOriginalLanguage) {
    let imdbID;
    let original3Language;
    const idRegex = /(tt\d{7,8})/;
    const idMatch = otherArguments.originalLibraryFile.file.match(idRegex);
    // eslint-disable-next-line prefer-destructuring
    if (idMatch) imdbID = idMatch[1];
    if (imdbID && (imdbID.length === 9 || imdbID.length === 10)) {
      response.infoLog += `IMDb ID: ${imdbID} \n`;

      // Poll TMDB for information.
      const result = await axios.get(`https://api.themoviedb.org/3/find/${imdbID}?api_key=` +
        `${tmdbAPI}&language=en-US&external_source=imdb_id`)
        .then((resp) => (resp.data.movie_results.length > 0 ? resp.data.movie_results[0] : resp.data.tv_results[0]));

      if (result) {
        // If the original language is pulled as Chinese 'cn' is used.  iso-language expects 'zh' for Chinese.
        const originalLanguage = result.original_language === 'cn' ? 'zh' : result.original_language;
        // Change two letter to three letter code.
        original3Language = languages.alpha2ToAlpha3B(originalLanguage);
        response.infoLog += `Original language code: ${originalLanguage}, changing to: ${original3Language}\n`;
        // Norweigen has four language codes, add them all if they don't already exist.
        if (originalLanguage === 'nb' || originalLanguage === 'nn' || originalLanguage === 'no') {
          const norsk = ['nno', 'nob', 'non', 'nor'];
          for (let i = 0; i < norsk.length; i += 1) {
            if (targetAudioLanguage[0].indexOf(norsk[i]) === -1) targetAudioLanguage[0].push(norsk[i]);
          }
        // Add original language to array if it doesn't already exist.
        } else if (targetAudioLanguage[0].indexOf(original3Language) === -1) {
          targetAudioLanguage[0].push(original3Language);
        }
      }
    } else {
      response.infoLog += 'No IMDb result found.\n';
    }
  } else {
    response.infoLog += 'IMDb ID not found in filename.\n';
  }

  // Subtitle
  let cmdCopySubs = '';
  let cmdExtractSubs = '';
  let bolTranscodeSubs = false;

  // Set up required variables
  let strStreamType = '';
  let MILoc = -1;

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();
    MILoc = findMediaInfoItem(file, i);

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Video
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'video') {
      // First we need to check if it is included in the MediaInfo struture, it might not be (mjpeg??, others??)

      response.infoLog += `Index ${i} MediaInfo stream: ${MILoc}\n`;

      if (MILoc > -1) {
        const streamHeight = file.ffProbeData.streams[i].height * 1;
        const streamWidth = file.ffProbeData.streams[i].width * 1;
        const streamFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
        let streamBR = file.mediaInfo.track[MILoc].BitRate * 1;

        // eslint-disable-next-line no-restricted-globals
        if (isNaN(streamBR) || streamBR === 0 || streamBR === null || streamBR === undefined) {
          streamBR = findStreamInfo(file, i, 'bitrate');
        }

        response.infoLog += `Video stream ${i}: ${Math.round(file.duration / 60)}min, ` +
          `${file.ffProbeData.streams[i].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
        response.infoLog += `, ${streamWidth} x ${streamHeight} x ${Math.round(streamFPS)}fps, ` +
          `${Math.round(streamBR / 1000)}kbps\n`;

        if (videoIdxFirst === -1) videoIdxFirst = i;

        if (videoIdx === -1) {
          videoIdx = i;
        } else {
          const MILocC = findMediaInfoItem(file, videoIdx);
          const curStreamWidth = file.ffProbeData.streams[videoIdx].width * 1;
          let curStreamBR = file.mediaInfo.track[MILocC].BitRate * 1;

          // eslint-disable-next-line no-restricted-globals
          if (isNaN(curStreamBR) || curStreamBR === 0 || curStreamBR === null || curStreamBR === undefined) {
            curStreamBR = findStreamInfo(file, i, 'bitrate');
          }

          // Only check here based on bitrate and video width
          if (streamBR > curStreamBR && streamWidth >= curStreamWidth) videoIdx = i;
        }
      }
    }

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Audio
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'audio') {
      audioChannels = file.ffProbeData.streams[i].channels * 1;
      audioBitrate = file.mediaInfo.track[MILoc].BitRate * 1;

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(audioBitrate) || audioBitrate === 0 || audioBitrate === null || audioBitrate === undefined) {
        audioBitrate = findStreamInfo(file, i, 'bitrate');
      }

      const streamLanguage = findStreamInfo(file, i, 'language');

      response.infoLog += `Audio stream ${i}: ${streamLanguage}, ${file.ffProbeData.streams[i].codec_name}, ` +
        `${audioChannels}ch, ${Math.round(audioBitrate / 1000)}kbps `;

      const streamIdx = targetAudioLanguage[0].indexOf(streamLanguage);

      if (targetAudioLanguage[0][0] !== 'all') {
        if (streamIdx !== -1) {
          if (targetAudioLanguage[1][streamIdx] === undefined) {
            response.infoLog += `- First ${streamLanguage} audio stream`;
            targetAudioLanguage[1][streamIdx] = i;
          } else {
            streamIdxChannels = file.ffProbeData.streams[targetAudioLanguage[1][streamIdx]].channels * 1;
            streamIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, targetAudioLanguage[1][streamIdx])].BitRate;

            if (audioChannels > streamIdxChannels) {
              response.infoLog += `- More ${streamLanguage} audio channels`;
              targetAudioLanguage[1][streamIdx] = i;
            } else if (audioChannels === streamIdxChannels && (audioBitrate > streamIdxBitrate ||
                file.ffProbeData.streams[i].disposition.default)) {
              response.infoLog += `- Higher ${streamLanguage} audio bitrate / stream tagged default`;
              targetAudioLanguage[1][streamIdx] = i;
            }
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (streamIdxOther === -1) {
            response.infoLog += '- Backup audio stream';
            streamIdxOther = i;
          } else {
            streamIdxChannels = file.ffProbeData.streams[streamIdxOther].channels * 1;
            streamIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, streamIdxOther)].BitRate;

            if (audioChannels > streamIdxChannels) {
              response.infoLog += '- Backup stream - More audio channels';
              streamIdxOther = i;
            } else if (audioChannels === streamIdxChannels && audioBitrate > streamIdxBitrate) {
              response.infoLog += '- Backup Stream - Higher audio bitrate / stream tagged default';
              streamIdxOther = i;
            }
          }
        }
      } else {
        response.infoLog += '- Keeping all audio stream(s)';
        targetAudioLanguage[1].push(i);
      }
      response.infoLog += '\n';
    }

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Subtitles
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'subtitle' || strStreamType === 'text') {
      const streamDisposition = findStreamInfo(file, i, 'disposition');
      const streamLanguage = findStreamInfo(file, i, 'language');

      response.infoLog += `Subtitle stream ${i}: ${streamLanguage}, ${file.ffProbeData.streams[i].codec_name}`;
      if (streamDisposition !== '') {
        response.infoLog += ` - ${streamDisposition.toUpperCase().replace('.', '')}`;
      }
      response.infoLog += '\n';
      targetSubLanguage[1].push(i);
    }
  }

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Video Decision section
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (videoIdx === -1) {
    response.infoLog += 'No video track !! \n';
    response.error = true;
    return response;
  }

  response.infoLog += `USING VIDEO STREAM ${videoIdx} \n`;

  MILoc = findMediaInfoItem(file, videoIdx);

  const videoFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
  let videoHeight = file.ffProbeData.streams[videoIdx].height * 1;
  let videoWidth = file.ffProbeData.streams[videoIdx].width * 1;
  let videoBR = file.mediaInfo.track[MILoc].BitRate * 1;
  let qualityAdder;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(videoBR) || videoBR === 0 || videoBR === null || videoBR === undefined) {
    videoBR = findStreamInfo(file, videoIdx, 'bitrate');
  }

  if (
    file.ffProbeData.streams[videoIdx].profile !== undefined &&
    file.ffProbeData.streams[videoIdx].profile.includes !== undefined &&
    file.ffProbeData.streams[videoIdx].profile.includes('10')
  ) {
    bolSource10bit = true;
    bolUse10bit = true;
  }

  // Lets see if we need to scale down the video size
  if (videoHeight > maxVideoHeight) {
    bolScaleVideo = true;
    videoNewWidth = Math.round((maxVideoHeight / videoHeight) * videoWidth);
    response.infoLog +=
      `Video resolution, ${videoWidth} x ${videoHeight}, need to convert to ${videoNewWidth} x ${maxVideoHeight} \n`;
    videoHeight = maxVideoHeight;
    videoWidth = videoNewWidth;
  }

  // Check if it is already hvec, if not then we must transcode
  if (file.ffProbeData.streams[videoIdx].codec_name !== targetVideoCodec) {
    response.infoLog +=
      `Source codec: ${file.ffProbeData.streams[videoIdx].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
    response.infoLog += `, differs from target: ${targetVideoCodec}${(bolUse10bit) ? '(10)' : ''}, changing.\n`;
    if (
      file.ffProbeData.streams[videoIdx].codec_name === 'mpeg4' ||
      (file.ffProbeData.streams[videoIdx].codec_name === 'h264' &&
        file.ffProbeData.streams[videoIdx].profile.includes('10'))
    ) {
      bolTranscodeSoftwareDecode = true;
      response.infoLog += 'Need to decode with software codec.\n';
    }
  }

  // Determine how much to increase quality over desired minimum
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(videoFPS) || videoFPS === 0 || videoFPS === null || videoFPS === undefined) {
    qualityAdder = 0.05;
  } else {
    qualityAdder = (videoFPS / targetFrameRate) / 20;
  }

  // We need to set the minimum bitrate and calculate the target codec compression
  if ((videoHeight * videoWidth) > minVideoPixels4K) {
    minimumVideoBitrate = minBitrate4K;
    response.infoLog +=
      `Video stream determined to be 4K. Minimum bitrate set as: ${(minimumVideoBitrate / 1000)}kbps. \n`;
    targetCodecCompression = ((minBitrate4K / (3840 * 2160 * targetFrameRate)) + qualityAdder);
  } else if ((videoHeight * videoWidth) > minVideoPixels1080p) {
    minimumVideoBitrate = minBitrate1080p;
    response.infoLog +=
      `Video stream determined to be 1080p. Minimum bitrate set as: ${(minimumVideoBitrate / 1000)}kbps. \n`;
    targetCodecCompression = ((minBitrate1080p / (1920 * 1080 * targetFrameRate)) + qualityAdder);
  } else if ((videoHeight * videoWidth) > minVideoPixels720p) {
    minimumVideoBitrate = minBitrate720p;
    response.infoLog +=
      `Video stream determined to be 720p. Minimum bitrate set as: ${(minimumVideoBitrate / 1000)}kbps. \n`;
    targetCodecCompression = ((minBitrate720p / (1280 * 720 * targetFrameRate)) + qualityAdder);
  } else {
    minimumVideoBitrate = minBitrate480p;
    response.infoLog +=
      `Video stream determined to be 480p or lower. Minimum bitrate set as: ${(minimumVideoBitrate / 1000)}kbps. \n`;
    targetCodecCompression = ((minBitrate480p / (640 * 480 * targetFrameRate)) + qualityAdder);
  }

  // Now calculate the optimal bitrate
  optimalVideoBitrate = Math.round((videoHeight * videoWidth * targetFrameRate) * targetCodecCompression);
  response.infoLog += `Optimal bitrate calculated to be: ${Math.round(optimalVideoBitrate / 1000)}kbps. \n`;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(videoBR) || videoBR === 0 || videoBR === null || videoBR === undefined) {
    // Cannot determine source bitrate
    response.infoLog +=
      'Cannot determine source bitrate, using minimum acceptable bitrate.\n';
    optimalVideoBitrate = minimumVideoBitrate;
  } else if (videoBR <= optimalVideoBitrate) {
    // If the source bitrate is less than our optimal bitrate we should not ever go up
    optimalVideoBitrate = videoBR;
    response.infoLog += `Source bitrate: ${Math.round(videoBR / 1000)}kbps, is less than optimal.\n`;
    if (file.ffProbeData.streams[videoIdx].codec_name === targetVideoCodec) {
      response.infoLog += `Codec is already ${targetVideoCodec}.\n`;
      if (!bolSource10bit && bolUse10bit) {
        response.infoLog += 'Transcoding to 10 bit with source bitrate.\n';
      } else {
        response.infoLog += 'Copying source stream.\n';
        bolTranscodeVideo = false;
      }
    } else {
      response.infoLog += 'Transcoding with a codec change using source bitrate.\n';
    }
  } else {
    // Source bitrate has enough meat for a decent transcode
    response.infoLog +=
      `Source bitrate: ${Math.round(videoBR / 1000)}kbps, is high enough to transcode to optimal bitrate.\n`;
  }

  response.infoLog += `Post-process video stream will be: ${videoWidth} x ${videoHeight} x ` +
    `${Math.round(videoFPS)}fps, ${Math.round(optimalVideoBitrate / 1000)}kbps\n`;

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Audio Decision section
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (targetAudioLanguage[1].length === 0) {
    if (streamIdxOther !== -1) {
      targetAudioLanguage[1].push(streamIdxOther);
    } else {
      response.infoLog += 'No audio track !!\n';
      response.error = true;
      return response;
    }
  }

  for (let i = 0; i < targetAudioLanguage[1].length; i += 1) {
    if (targetAudioLanguage[1][i] !== undefined) {
      // Set per-stream variables
      const streamIdx = targetAudioLanguage[1][i];
      cmdAudioMap += ` -map 0:${streamIdx} `;
      response.infoLog += `USING AUDIO STREAM ${streamIdx}\n`;

      // If the audio codec is not what we want then we should transcode
      if (file.ffProbeData.streams[streamIdx].codec_name !== targetAudioCodec) {
        bolModifyStream = true;
        response.infoLog += `Source codec: ${file.ffProbeData.streams[streamIdx].codec_name}, differs from target: ` +
          `${targetAudioCodec}, changing.\n`;
      }

      let audioBR = file.mediaInfo.track[findMediaInfoItem(file, streamIdx)].BitRate * 1;

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(audioBR) || audioBR === 0 || audioBR === null || audioBR === undefined) {
        audioBR = findStreamInfo(file, streamIdx, 'bitrate');
      }

      if (file.ffProbeData.streams[streamIdx].channels > targetAudioChannels) {
        bolModifyStream = true;
        audioNewChannels = targetAudioChannels;
        response.infoLog += `Source audio channels: ${file.ffProbeData.streams[streamIdx].channels}, ` +
          `is higher than target: ${targetAudioChannels}\n`;
      } else {
        audioNewChannels = file.ffProbeData.streams[streamIdx].channels;
      }

      // Now calculate the optimal bitrate
      optimalAudioBitrate = audioNewChannels * targetAudioBitratePerChannel;

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(audioBR) || audioBR === 0 || audioBR === null || audioBR === undefined) {
        // Cannot determine source bitrate
        optimalAudioBitrate = audioNewChannels * 32000;
        bolModifyStream = true;
        response.infoLog +=
          'Cannot determine source bitrate, using 32k per channel.\n';
      // If the source bitrate is less than our optimal bitrate we should not ever go up
      } else if (audioBR <= optimalAudioBitrate) {
        response.infoLog +=
          `Source bitrate: ${Math.round(audioBR / 1000)}kbps, is less than optimal. Keeping existing `;
        optimalAudioBitrate = audioBR;
        if (file.ffProbeData.streams[streamIdx].codec_name !== targetAudioCodec) {
          response.infoLog += 'bitrate.';
        } else {
          response.infoLog += 'stream.';
        }
        response.infoLog += '\n';
      } else {
        bolModifyStream = true;
        response.infoLog +=
          `Source bitrate: ${Math.round(audioBR / 1000)}kbps, is high enough to transcode to optimal bitrate.\n`;
      }

      if (bolModifyStream) {
        cmdAudioMap += ` -c:a:${i} ${targetAudioCodec} -b:a ${optimalAudioBitrate} -ac ${audioNewChannels} `;
        bolTranscodeAudio = true;
      } else {
        cmdAudioMap += ` -c:a:${i} copy `;
      }

      response.infoLog += `Post-process audio stream ${i} will be: ${findStreamInfo(file, streamIdx, 'language')} ` +
        `- ${Math.round(optimalAudioBitrate / 1000)}kbps, ${audioNewChannels} channels\n`;
    }
  }

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Subtitle Decision section
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (targetSubLanguage[1].length !== 0) {
    for (let i = 0; i < targetSubLanguage[1].length; i += 1) {
      // Set up per-stream variables
      const streamIdx = targetSubLanguage[1][i];
      let subsFile = '';
      let subsLog = '';
      let bolCommentary = false;
      let bolCC_SDH = false;
      let bolCopyStream = true;
      let bolExtractStream = true;
      let bolTextSubs = false;
      let bolConvertSubs = false;
      let bolExtractAll = false;
      const streamCodec = file.ffProbeData.streams[streamIdx].codec_name.toLowerCase();
      const streamDisposition = findStreamInfo(file, streamIdx, 'disposition');
      const streamLanguage = findStreamInfo(file, streamIdx, 'language');

      if (bolExtract && targetSubLanguage[0].indexOf('all') !== -1) bolExtractAll = true;

      // Determine if subtitle is of a special type
      if (streamDisposition === '.sdh') bolCC_SDH = true;
      if (streamDisposition === '.cc') bolCC_SDH = true;
      if (streamDisposition === '.commentary') bolCommentary = true;

      // Determine if subtitle should be extracted/copied/removed
      if (targetSubLanguage[0].indexOf(streamLanguage) !== -1) {
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
      if ((targetSubLanguage[0].indexOf(streamLanguage) === -1) && !bolExtractAll) {
        bolExtractStream = false;
      }

      // Determine subtitle stream type
      subsLog += 'USING SUBTITLE ';
      if (streamCodec === 'ass' || streamCodec === 'mov_text' ||
        streamCodec === 'ssa' || streamCodec === 'subrip') {
        bolTextSubs = true;
        subsLog += 'TEXT ';
        if (streamCodec === 'mov_text' && !bolRemoveAll) {
          bolConvertSubs = true;
        }
      } else if (streamCodec === 's_text/webvtt') {
        bolCopyStream = false;
        subsLog += 'S_TEXT/WEBVTT ';
      } else {
        subsLog += 'IMAGE ';
      }

      // Build subtitle file names.
      subsFile = otherArguments.originalLibraryFile.file.split('.');
      subsFile[subsFile.length - 2] += `.${streamLanguage}${streamDisposition}`;
      subsFile[subsFile.length - 1] = 'srt';
      subsFile = subsFile.join('.');

      subsLog += `STREAM ${streamIdx} `;
      // Copy subtitle stream
      if (bolCopyStream && !bolRemoveAll) {
        subsLog += '- Copying ';
        cmdCopySubs += ` -map 0:${streamIdx} -c:s:${i}`;
        if (bolConvertSubs) {
          cmdCopySubs += ' srt';
        } else {
          cmdCopySubs += ' copy';
        }
      }
      // Verify subtitle track is a format that can be extracted.
      if (bolExtractStream || bolExtractAll) {
        // Extract subtitle if it doesn't exist on disk or the option to overwrite is set.
        if (!bolTextSubs) {
          subsLog += '- Stream is not text based, can not extract. ';
        } else if (fs.existsSync(`${subsFile}`) && !bolOverwright) {
          subsLog += '- External subtitle file already exists, will not extract. ';
        } else {
          subsLog += '- Extracting ';
          cmdExtractSubs += ` -map 0:${streamIdx} "${subsFile}"`;
        }
      }
      if ((bolCopyStream && !bolRemoveAll) || bolExtractStream || bolExtractAll) {
        response.infoLog += subsLog;
        response.infoLog += '\n';
      }
    }
    if (cmdCopySubs !== '' || cmdExtractSubs !== '' || bolRemoveAll) bolTranscodeSubs = true;

    if (bolRemoveAll) response.infoLog += 'Removing all subtitle streams.\n';
  } else {
    response.infoLog += 'No subtitles found\n';
  }

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // lets assemble our ffmpeg command
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const strTranscodeFileOptions = ' ';

  let strFFcmd = '';

  if (bolTranscodeVideo) {
    if (bolTranscodeSoftwareDecode) {
      strFFcmd += ' -vaapi_device /dev/dri/renderD128 ';
    } else {
      strFFcmd += ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ';
    }
  }

  strFFcmd += ' -y <io>';
  strFFcmd += cmdExtractSubs;
  strFFcmd += ` -max_muxing_queue_size 8000 -map 0:${videoIdx} `;

  if (bolTranscodeVideo) {
    // Used to make the output 10bit, I think the quotes need to be this way for ffmpeg
    strFFcmd += ' -c:v:0 hevc_vaapi ';

    if (bolScaleVideo || bolUse10bit || bolTranscodeSoftwareDecode) {
      let strOptions = '';
      let strFormat = '';
      // Used when video is above our target
      if (bolScaleVideo) strOptions += `w=-1:h=${maxVideoHeight}`;

      if (strFormat.length > 0) strFormat += '=';

      // Used to make the output 10bit
      if (bolUse10bit && !bolSource10bit) strFormat += 'p010';

      if (bolTranscodeSoftwareDecode) {
        if (bolSource10bit) {
          if (strFormat.length > 0) strFormat += ',';
          // Used to make it sure the software decode is in the proper pixel format
          strFormat += 'nv12|vaapi';
        }
        if (strFormat.length > 0) strFormat += ',';
        // Used to make it use software decode if necessary
        strFormat += 'hwupload';
      }

      if (strFormat.length > 0) {
        if (strOptions.length > 0) strOptions += ',';
        strOptions += `format=${strFormat}`;
      }

      if (bolTranscodeSoftwareDecode) {
        strFFcmd += ` -vf "${strOptions}" `;
      } else {
        strFFcmd += ` -vf "scale_vaapi=${strOptions}" `;
      }
    }
    // Used when video is above our target
    strFFcmd += ` -b:v ${optimalVideoBitrate} `;
  } else {
    strFFcmd += ' -c:v:0 copy ';
  }

  strFFcmd += cmdAudioMap;
  strFFcmd += cmdCopySubs;
  strFFcmd += ` -map_metadata:g -1 -metadata TNDATE=${new Date().toISOString()} -map_chapters 0 `;
  strFFcmd += strTranscodeFileOptions;

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (bolTranscodeVideo || bolTranscodeAudio || bolTranscodeSubs) {
    response.infoLog += 'File needs work. Transcoding.\n';
    response.preset += strFFcmd;
    response.processFile = true;
  } else {
    response.infoLog += 'Nothing to do, skipping!\n';
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
