// jshint esversion: 6
// allow isNaN
/* eslint operator-linebreak: ["error", "after"] */
/* eslint eqeqeq: 1 */
/* eslint no-await-in-loop: 0 */
module.exports.dependencies = ['axios@0.27.2', '@cospired/i18n-iso-languages'];
// tdarrSkipTest

// Created by tehNiemer with thanks to JarBinks, drpeppershaker, and supersnellehenk for the plugins
// Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile, Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT
// and Tdarr_Plugin_henk_Keep_Native_Lang_Plus_Eng which served as the building blocks.
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
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,video,audio,subtitle,qsv,vaapi,h265,aac,configurable',
  Inputs: [{
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
      '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.' +
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
      'Filename must contain IMDb ID. \\nExample: \\ntt1234567' +
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
      '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.' +
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
    tooltip: 'Remove commentary subtitle streams from file.',
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
    tooltip: 'Remove CC/SDH subtitle streams from file.',
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

function findMediaInfoItem(file, index) {
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
}

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
    processFile: true,
    error: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if (inputs.minBitrate4K <= 4000 || inputs.minBitrate1080p <= 1000 || inputs.minBitrate720p <= 450 ||
    inputs.minBitrate480p <= 150 || inputs.audioBitrate <= 15 || inputs.audioChannels <= 0 ||
    inputs.audioLanguage === '' || (inputs.subLanguage === '' && (inputs.subExtract || inputs.subRmExtraLang ||
      inputs.subRmCommentary || inputs.subRmCC_SDH)) || (inputs.keepOrigLang && inputs.tmdbAPI === '')) {
    response.processFile = false;
    response.error = true;
    response.infoLog += 'Please configure all options with reasonable values. Skipping this plugin. \n';
    return response;
  }

  const currentFileName = file._id; // .replace(/'/g, "'\"'\"'");

  // Settings
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Process Handling
  const intStatsDays = 21; // Update stats if they are older than this many days

  // Video
  const targetVideoCodec = 'hevc'; // Desired Video Codec, if you change this it will might require code changes
  let bolUse10bit = inputs.re_encode10bit;
  const targetFrameRate = 24; // Any frame rate greater than this will be adjusted
  const maxVideoHeight = 2160; // Any thing over this size, I.E. 4K, will be reduced to this
  const qualityAdder = 0.05; // This is a multiplier of codec compression to increase target quality
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
  const targetAudioCodec = 'aac'; // Desired Audio Codec, if you change this it will might require code changes
  const targetAudioLanguage = [[], []];
  targetAudioLanguage[0] = inputs.audioLanguage.toLowerCase().replace(/\s+/g, '').split(',');
  const targetAudioBitratePerChannel = inputs.audioBitrate * 1000;
  const targetAudioChannels = inputs.audioChannels;
  const bolKeepOriginalLanguage = inputs.keepOrigLang;
  const tmdbAPI = inputs.apiKey;

  // Subtitle
  const targetSubLanguage = inputs.subLanguage.toLowerCase().replace(/\s+/g, '').split(',');
  const bolExtract = inputs.subExtract;
  let bolRemoveUnwanted = inputs.subRmExtraLang;
  const bolRemoveCommentary = inputs.subRmCommentary;
  const bolRemoveCC_SDH = inputs.subRmCC_SDH;
  const bolRemoveAll = inputs.subRmAll;
  const bolOverwright = inputs.subOverwrite;

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const proc = require('child_process');
  let bolStatsAreCurrent = false;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.error = true;
    response.infoLog += 'File is not a video. Exiting \n';
    return response;
  }

  // If the file has already been processed we dont need to do more
  if (file.container === 'mkv' && (file.mediaInfo.track[0].extra !== undefined &&
      file.mediaInfo.track[0].extra.TNPROCESSED !== undefined &&
      file.mediaInfo.track[0].extra.TNPROCESSED === '1')) {
    response.processFile = false;
    response.infoLog += 'File already Processed! \n';
    return response;
  }

  // If the existing container is mkv there is a possibility the stats were not updated during any previous transcode.
  if (file.container === 'mkv') {
    let datStats = Date.parse(new Date(70, 1).toISOString());
    if (
      file.ffProbeData.streams[0].tags !== undefined &&
      file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng'] !== undefined
    ) {
      datStats = Date.parse(`${file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng']} GMT`);
    }

    if (file.mediaInfo.track[0].extra !== undefined && file.mediaInfo.track[0].extra.TNDATE !== undefined) {
      const TNDate = Date.parse(file.mediaInfo.track[0].extra.TNDATE);

      response.infoLog += `TNDate: ${TNDate}, StatsDate: ${datStats}\n`;
      if (datStats >= TNDate) {
        bolStatsAreCurrent = true;
      }
    } else {
      const statsThres = Date.parse(new Date(new Date().setDate(new Date().getDate() - intStatsDays)).toISOString());

      response.infoLog += `StatsThres: ${statsThres}, StatsDate: ${datStats}\n`;
      if (datStats >= statsThres) {
        bolStatsAreCurrent = true;
      }
    }

    if (!bolStatsAreCurrent) {
      response.infoLog += 'Stats need to be updated! \n';

      try {
        proc.execSync(`mkvpropedit --add-track-statistics-tags "${currentFileName}"`);
        return response;
      } catch (err) {
        response.infoLog += 'Error Updating Status Probably Bad file, A remux will probably fix, will continue\n';
      }
      response.infoLog += 'Getting Stats Objects, again! \n';
    }
  }

  // Logic Controls
  // Video
  let bolScaleVideo = false;
  let bolTranscodeVideo = false;
  const bolChangeFrameRateVideo = false;
  let optimalVideoBitrate = 0;
  let minimumVideoBitrate = 0;
  let targetCodecCompression = 0;
  let videoNewWidth = 0;
  let bolSource10bit = false;
  let bolTranscodeSoftwareDecode = false;
  let videoIdx = -1;
  let videoIdxFirst = -1;

  // Audio
  let audioNewChannels = 0;
  let optimalAudioBitrate = 0;
  let bolTranscodeAudio = false;
  let bolDownMixAudio = false;
  let audioChannels = 0;
  let audioBitrate = 0;
  let audioIdxChannels = 0;
  let audioIdxBitrate = 0;
  let audioIdxOther = -1;

  // Determine original language if possible.
  if (bolKeepOriginalLanguage) {
    let imdbID = '';
    const idRegex = /(tt\d{7,8})/;
    const idMatch = currentFileName.match(idRegex);
    // eslint-disable-next-line prefer-destructuring
    if (idMatch) imdbID = idMatch[1];
    if (imdbID.length === 9 || 10) {
      response.infoLog += `IMDb ID: ${imdbID} \n`;

      // Poll TMDB for information.
      const result = await axios.get(`https://api.themoviedb.org/3/find/${imdbID}?api_key=` +
          `${tmdbAPI}&language=en-US&external_source=imdb_id`)
        .then((resp) => (resp.data.movie_results.length > 0 ? resp.data.movie_results[0] : resp.data.tv_results[0]));

      if (result) {
        // If the original language is pulled as Chinese 'cn' is used.  iso-language expects 'zh' for Chinese.
        const originalLanguage = result.original_language === 'cn' ? 'zh' : result.original_language;
        // Change two letter to three letter code.
        const original3Language = languages.alpha2ToAlpha3B(originalLanguage);
        response.infoLog += `Original language: ${originalLanguage}, Using code: ${original3Language}\n`;
        // Add original language to array if it doesn't already exist.
        if (targetAudioLanguage[0].indexOf(original3Language) === -1) {
          targetAudioLanguage[0].push(original3Language);
        }
      } else {
        response.infoLog += 'No IMDb result found. \n';
      }
    } else {
      response.infoLog += 'IMDb ID not found in filename. \n';
    }
  }

  // Subtitle
  let cmdRemoveSubs = '';
  let cmdExtractSubs = '';
  let bolDoSubs = false;
  let bolConvertSubs = false;
  let bolExtractAll = false;
  if (bolExtract && targetSubLanguage === 'all') {
    bolExtractAll = true;
  }
  if (bolRemoveAll) {
    bolRemoveUnwanted = false;
  }

  // Chapters
  const bolDoChapters = true;

  // Set up required variables
  let strStreamType = '';
  let MILoc = -1;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Video
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'video') {
      // First we need to check if it is included in the MediaInfo struture, it might not be (mjpeg??, others??)
      MILoc = findMediaInfoItem(file, i);

      response.infoLog += `Index ${i} MediaInfo stream: ${MILoc} \n`;

      if (MILoc > -1) {
        const streamHeight = file.ffProbeData.streams[i].height * 1;
        const streamWidth = file.ffProbeData.streams[i].width * 1;
        const streamFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
        let streamBR = file.mediaInfo.track[MILoc].BitRate * 1;

        // eslint-disable-next-line no-restricted-globals
        if (isNaN(streamBR) && file.mediaInfo.track[MILoc].extra !== undefined) {
          streamBR = file.mediaInfo.track[MILoc].extra.FromStats_BitRate * 1;
        }

        response.infoLog += `Video stream ${i}: ${Math.round(file.meta.Duration / 60)}min, ` +
          `${file.ffProbeData.streams[i].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
        response.infoLog += `, ${streamWidth} x ${streamHeight} x ${Math.round(streamFPS)}fps, ` +
          `${Math.round(streamBR / 1000)}kbps \n`;

        if (videoIdxFirst === -1) {
          videoIdxFirst = i;
        }

        if (videoIdx === -1) {
          videoIdx = i;
        } else {
          const MILocC = findMediaInfoItem(file, videoIdx);
          const curStreamWidth = file.ffProbeData.streams[videoIdx].width * 1;
          let curStreamBR = file.mediaInfo.track[MILocC].BitRate * 1;

          // eslint-disable-next-line no-restricted-globals
          if (isNaN(curStreamBR) && file.mediaInfo.track[MILocC].extra !== undefined) {
            curStreamBR = file.mediaInfo.track[MILocC].extra.FromStats_BitRate * 1;
          }

          // Only check here based on bitrate and video width
          if (streamBR > curStreamBR && streamWidth >= curStreamWidth) {
            videoIdx = i;
          }
        }
      }
    }

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Audio
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'audio') {
      audioChannels = file.ffProbeData.streams[i].channels * 1;
      audioBitrate = file.mediaInfo.track[findMediaInfoItem(file, i)].BitRate * 1;

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(audioBitrate) && file.mediaInfo.track[findMediaInfoItem(file, i)].extra !== undefined) {
        audioBitrate = file.mediaInfo.track[findMediaInfoItem(file, i)].extra.FromStats_BitRate * 1;
      }

      let streamLanguage = '???';
      if (file.ffProbeData.streams[i].tags !== undefined) {
        streamLanguage = file.ffProbeData.streams[i].tags.language;
      }

      response.infoLog += `Audio stream ${i}: ${streamLanguage}, ${file.ffProbeData.streams[i].codec_name}, ` +
        `${audioChannels}ch, ${Math.round(audioBitrate / 1000)}kbps `;

      const audioIdx = targetAudioLanguage[0].indexOf(streamLanguage);

      if (audioIdx !== -1) {
        if (targetAudioLanguage[1][audioIdx] === undefined) {
          response.infoLog += '- First Audio Stream ';
          targetAudioLanguage[1][audioIdx] = i;
        } else {
          audioIdxChannels = file.ffProbeData.streams[targetAudioLanguage[1][audioIdx]].channels * 1;
          audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, targetAudioLanguage[1][audioIdx])].BitRate;

          if (audioChannels > audioIdxChannels) {
            response.infoLog += '- More Audio Channels ';
            targetAudioLanguage[1][audioIdx] = i;
          } else if (audioChannels === audioIdxChannels && audioBitrate > audioIdxBitrate) {
            response.infoLog += '- Higher Audio Rate ';
            targetAudioLanguage[1][audioIdx] = i;
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (audioIdxOther === -1) {
          response.infoLog += '- Undesired Audio Stream ';
          audioIdxOther = i;
        } else {
          audioIdxChannels = file.ffProbeData.streams[audioIdxOther].channels * 1;
          audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdxOther)].BitRate;

          if (audioChannels > audioIdxChannels) {
            response.infoLog += '- Undesired Stream More Audio Channels ';
            audioIdxOther = i;
          } else if (audioChannels === audioIdxChannels && audioBitrate > audioIdxBitrate) {
            response.infoLog += '- Undesired Stream Higher Audio Rate ';
            audioIdxOther = i;
          }
        }
      }
      response.infoLog += ' \n';
    }

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Subtitles
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (!bolDoSubs && (strStreamType === 'subtitle' || strStreamType === 'text')) {
      bolDoSubs = true;
      response.infoLog += 'Subtitles Found \n';
    }
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  }

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Video Decision section
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (videoIdx === -1) {
    response.processFile = false;
    response.error = true;
    response.infoLog += 'No Video Track !! \n';
    return response;
  }

  response.infoLog += `Using video stream ${videoIdx} \n`;

  bolTranscodeVideo = true; // We will assume we will be transcoding
  MILoc = findMediaInfoItem(file, videoIdx);

  let videoHeight = file.ffProbeData.streams[videoIdx].height * 1;
  let videoWidth = file.ffProbeData.streams[videoIdx].width * 1;
  const videoFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
  let videoBR = file.mediaInfo.track[MILoc].BitRate * 1;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(videoBR) && file.mediaInfo.track[MILoc].extra !== undefined) {
    videoBR = file.mediaInfo.track[MILoc].extra.FromStats_BitRate * 1;
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
      `Source codex is ${file.ffProbeData.streams[videoIdx].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
    response.infoLog += `, need to convert to ${targetVideoCodec}${(bolUse10bit) ? '(10)' : ''} \n`;
    if (
      file.ffProbeData.streams[videoIdx].codec_name === 'mpeg4' ||
      (file.ffProbeData.streams[videoIdx].codec_name === 'h264' &&
        file.ffProbeData.streams[videoIdx].profile.includes('10'))
    ) {
      bolTranscodeSoftwareDecode = true;
      response.infoLog += 'Need to decode with software codec \n';
    }
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

  if (videoBR <= optimalVideoBitrate) {
    // We need to be careful here or else we could produce a bad quality stream
    response.infoLog += `Source bitrate: ${Math.round(videoBR / 1000)}kbps is less than optimal! \n`;
    if (file.ffProbeData.streams[videoIdx].codec_name === targetVideoCodec) {
      response.infoLog += `Codec is already ${targetVideoCodec}. \n`;
      if (!bolSource10bit && bolUse10bit) {
        response.infoLog += 'Transcoding to 10 bit with source bitrate. \n';
        optimalVideoBitrate = videoBR;
      } else {
        response.infoLog += 'Copying source stream. \n';
        optimalVideoBitrate = videoBR;
        bolTranscodeVideo = false;
      }
    } else {
      response.infoLog += 'Transcoding with a codec change using source bitrate. \n';
      optimalVideoBitrate = videoBR;
    }
    // eslint-disable-next-line no-restricted-globals
  } else if (isNaN(videoBR)) {
    // Cannot determine source bitrate
    response.infoLog +=
      'Cannot determine source bitrate, throwing in towel and using minimum acceptable bitrate. \n';
    optimalVideoBitrate = minimumVideoBitrate;
  } else {
    // Source bitrate has enough meat for a decent transcode
    response.infoLog +=
      `Source bitrate: ${Math.round(videoBR / 1000)}kbps, is high enough to transcode to optimal bitrate. \n`;
  }

  response.infoLog += `Post-process video stream will be: ${videoWidth} x ${videoHeight} x ` +
    `${Math.round(videoFPS)}fps, ${Math.round(optimalVideoBitrate / 1000)}kbps \n`;

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Audio Decision section
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (targetAudioLanguage[1].length === 0) {
    if (audioIdxOther !== -1) {
      targetAudioLanguage[1].push(audioIdxOther);
    } else {
      response.processFile = false;
      response.error = true;
      response.infoLog += 'No Audio Track !! \n';
      return response;
    }
  }

  let cmdAudioMap = '';

  for (let i = 0; i < targetAudioLanguage[1].length; i += 1) {
    if (targetAudioLanguage[1][i] !== undefined) {
      // Set per-stream variables
      const streamIdx = targetAudioLanguage[1][i];
      cmdAudioMap += ` -map 0:${streamIdx} `;
      response.infoLog += `Keeping audio stream ${streamIdx} \n`;

      let audioBR = file.mediaInfo.track[findMediaInfoItem(file, streamIdx)].BitRate * 1;

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(audioBR) && file.mediaInfo.track[findMediaInfoItem(file, streamIdx)].extra !== undefined) {
        audioBR = file.mediaInfo.track[findMediaInfoItem(file, streamIdx)].extra.FromStats_BitRate * 1;
      }

      if (file.ffProbeData.streams[streamIdx].channels > targetAudioChannels) {
        bolDownMixAudio = true;
        audioNewChannels = targetAudioChannels;
        response.infoLog += `Source audio channels: ${file.ffProbeData.streams[streamIdx].channels} ` +
          `is higher than target: ${targetAudioChannels} \n`;
      } else {
        audioNewChannels = file.ffProbeData.streams[streamIdx].channels;
      }

      optimalAudioBitrate = audioNewChannels * targetAudioBitratePerChannel;

      // Now what are we going todo with the audio part
      if (audioBR > (optimalAudioBitrate * 1.1)) {
        bolTranscodeAudio = true;
        response.infoLog += `Source audio bitrate: ${Math.round(audioBR / 1000)}kbps is higher than target: ` +
          `${Math.round(optimalAudioBitrate / 1000)}kbps \n`;
      }

      // If the audio codec is not what we want then we should transcode
      if (file.ffProbeData.streams[streamIdx].codec_name !== targetAudioCodec) {
        bolTranscodeAudio = true;
        response.infoLog += `Audio codec: ${file.ffProbeData.streams[streamIdx].codec_name} differs from target: ` +
          `${targetAudioCodec}, changing \n`;
      }

      // If the source bitrate is less than out target bitrate we should not ever go up
      if (audioBR <= optimalAudioBitrate) {
        response.infoLog += `Source audio bitrate: ${Math.round(audioBR / 1000)}kbps is less or equal to target: ` +
          `${Math.round(optimalAudioBitrate / 1000)}kbps, using existing `;
        optimalAudioBitrate = audioBR;
        if (file.ffProbeData.streams[streamIdx].codec_name !== targetAudioCodec) {
          response.infoLog += 'rate';
        } else {
          response.infoLog += 'stream';
        }
        response.infoLog += ' \n';
      }

      if (bolTranscodeAudio) {
        cmdAudioMap += ` -c:a:0 ${targetAudioCodec} -b:a ${optimalAudioBitrate} `;
      } else {
        cmdAudioMap += ' -c:a:0 copy ';
      }
      if (bolDownMixAudio) {
        cmdAudioMap += ` -ac ${audioNewChannels} `;
      }
    }
  }

  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Subtitle Decision section
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  if (bolDoSubs) {
    const subsArr = file.ffProbeData.streams.filter((row) => row.codec_type.toLowerCase() === 'subtitle' ||
      row.codec_type.toLowerCase() === 'text');
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
      if (targetSubLanguage.indexOf(lang) !== -1) {
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
      if ((targetSubLanguage.indexOf(lang) === -1) && !bolExtractAll) {
        bolExtractStream = false;
      }

      // Determine subtitle stream type
      if (codec === 'subrip' || codec === 'mov_text') {
        bolTextSubs = true;
        response.infoLog += 'Text ';
        if (codec === 'mov_text') {
          bolConvertSubs = true;
          response.infoLog += '(mov_text), will convert ';
        }
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
            cmdRemoveSubs += ` -map -0:${index}`;
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
            cmdExtractSubs += ` -map 0:${index} "${subsFile}"`;
          }
        }
        response.infoLog += '\n';
      }
    }
    if (bolRemoveAll) {
      response.infoLog += 'Removing all subtitles!\n';
    }
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

    if (bolScaleVideo || bolUse10bit || bolTranscodeSoftwareDecode || bolChangeFrameRateVideo) {
      let strOptions = '';
      let strFormat = '';
      if (bolScaleVideo) {
        // Used when video is above our target
        strOptions += `w=-1:h=${maxVideoHeight}`;
      }

      let strChangeVideoRateString = '';
      if (bolChangeFrameRateVideo) {
        // Used to change the framerate to the target framerate
        strChangeVideoRateString = `fps=${targetFrameRate},`;
      }

      if (strFormat.length > 0) {
        strFormat += '=';
      }

      if (bolUse10bit && !bolSource10bit) {
        // Used to make the output 10bit
        strFormat += 'p010';
      }

      if (bolTranscodeSoftwareDecode) {
        if (bolSource10bit) {
          if (strFormat.length > 0) {
            strFormat += ',';
          }
          // Used to make it sure the software decode is in the proper pixel format
          strFormat += 'nv12|vaapi,hwupload';
        }
        if (strFormat.length > 0) {
          strFormat += ',';
        }
        // Used to make it use software decode if necessary
        strFormat += 'nv12,hwupload';
      }

      if (strFormat.length > 0) {
        if (strOptions.length > 0) {
          strOptions += ',';
        }
        strOptions += `format=${strFormat}`;
      }

      if (bolTranscodeSoftwareDecode) {
        strFFcmd += ` -vf "${strChangeVideoRateString} ${strOptions}" `;
      } else {
        strFFcmd += ` -vf "${strChangeVideoRateString} scale_vaapi=${strOptions}" `;
      }
    }
    // Used when video is above our target
    strFFcmd += ` -b:v ${optimalVideoBitrate} `;
  } else {
    strFFcmd += ' -c:v:0 copy ';
  }

  strFFcmd += cmdAudioMap;

  if (bolDoSubs) {
    if (bolRemoveAll) {
      strFFcmd += ' -map -0:s ';
    } else if (bolConvertSubs) {
      strFFcmd += ' -map 0:s -c:s srt ';
    } else {
      strFFcmd += ' -map 0:s -scodec copy ';
    }
  }

  strFFcmd += ` -map_metadata:g -1 -metadata TNPROCESSED=1 -metadata TNDATE=${new Date().toISOString()} `;
  if (bolDoChapters) {
    strFFcmd += ' -map_chapters 0 ';
  } else {
    strFFcmd += ' -map_chapters -1 ';
  }

  strFFcmd += cmdRemoveSubs;
  strFFcmd += strTranscodeFileOptions;
  /// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  response.preset += strFFcmd;
  response.infoLog += 'File needs work. Transcoding. \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;