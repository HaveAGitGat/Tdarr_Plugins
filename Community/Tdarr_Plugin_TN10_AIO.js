// jshint esversion: 6
// allow isNaN
/* eslint no-restricted-globals: 0 */
/* eslint no-template-curly-in-string: 0 */
/* eslint global-require: 0 */
/* eslint eqeqeq: 1 */

/*
Author: tehNiemer, JarBinks, Zachg99, Jeff47
Date: 09/20/2021

This is a heavily modified version of Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile. 

(TODO: If the file name has non standard characters in it some calls to external programs will fail, 
I have seen it in about 0.2% of files)

Video:  (Only one video stream is used!!)
    The script computes a target codec compression percent based on the actual stream bitrate 
	and user defined minimums for an ideal stream. The formula is as follows:
	
    (videoHeight * videoWidth * videoFPS) * targetCodecCompression
	
    The first 3 variables give a raw number of bits that the stream requires, 
	the final variable is the calculation above

    If the source video is less than the calculated optimal rate the script will either:
        Transcode the stream to hevc using 80% of the source stream's bitrate
        or
        Transcode the stream to hevc using 100% of the source stream's bitrate 
		if the transode would result in a bitrate less than the defined minumum

    If the source media is hevc and the bitrate is less than the calculated optimal rate, 
	it will copy the stream instead of transcode to preserve quality

    The script will do an on chip transcode, meaning the decode and encode is all done on chip, 
	except for mpeg4 which must be decoded on the CPU

    (TODO: Videos with a framerate higher than a threshold, lets say 30, should be changed)

Audio:  (Only one audio stream is used!!)
    The script will choose one audio stream in the file that has:
        The desired language
        The highest channel count
    If the language is not set on the audio track it assumes it is in the desired language

    If the source audio is less than this rate the script will either:
        Copy the existing stream, if the codec is aac
        Transcode the stream to aac using 100% of the source stream's bitrate

Subtitles:
    All are copied (They usually take up little space so I keep them)
    Any that are in mov_text will be converted to srt

    (TODO: some subtitles produce a "Cannot read Property '0' of undefined" error)

Chapters:
    If chapters are found the script keeps them unless...
        Any chapter start time is a negative number (Yes I have seen it)
        Any duplicate start times are found

    (TODO: incomplete chapter info gets added to or removed...
	I have seen 2 chapters in the beginning and then nothing)

Metadata:
    Global metadata is cleared, I.E. title
    Stream specific metadata is copied
*/
const details = () => ({
  id: 'Tdarr_Plugin_TN10_AIO',
  Stage: 'Pre-processing',
  Name: 'tehNiemer - Extract subtitles, convert to MKV, h265, and AAC using QSV(vaapi), bitrate optimized',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Re-encodes files to h265 and AAC with user defined parameters. Removes all but one video and audio stream. ' +
    'Extracts embedded .srt subs and will optionally remove them as well as all image based subtitles. ' +
    'This will not extract commentary files. Subtitles are removed if s_text/webvtt \n',
  Version: '1.00',
  Link: '',
  Tags: 'pre-processing,ffmpeg,video,audio,qsv,vaapi,h265,aac,configurable',
  Inputs: [{
      name: 'minBitrate4K',
      type: 'number',
      defaultValue: '20000',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 3840 x 2160 stream.'
    },
    {
      name: 'minBitrate1080p',
      type: 'number',
      defaultValue: '5000',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 1920 x 1080 stream.'
    },
    {
      name: 'minBitrate720p',
      type: 'number',
      defaultValue: '2200',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 1280 x 720 stream.'
    },
    {
      name: 'minBitrate480p',
      type: 'number',
      defaultValue: '750',
      inputUI: {
        type: 'text',
      },
      tooltip: 'The minimum acceptable bitrate, in kbps, to allow downsampling of a 640 x 480 stream.'
    },
    {
      name: 'audioBitrate',
      type: 'number',
      defaultValue: '64',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Desired audio bitrate per channel in kbps. 64K per channel gives you good lossy quality out of AAC.'
    },
    {
      name: 'audioChannels',
      type: 'number',
      defaultValue: '6',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Maximum number of audio channels, anything more than this will be reduced.' +
        '\\nExample: 2.1 = 3, 5.1 = 6, 7.1 = 8\\n'
    },
    {
      name: 'audioLanguage',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Desired audio language.\\nMust follow ISO-639-2 3 letter format. ' +
        'https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.\\nExample: \\neng'
    },
    {
      name: 're_encode10bit',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Re-encode 8bit color depth to 10bit.'
    },
    {
      name: 'subLanguage',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify language tag(s) here for the subtitle tracks you would like to keep/extract.' +
        '\\nEnter "all" without quotes to copy/extract all subtitle tracks.' +
        '\\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.' +
        '\\nExample: \\neng\\nExample: \\neng,jpn,fre'
    }, {
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
      tooltip: 'Extract defined language subtitle stream(s) from file.'
    },
    {
      name: 'subRemoveCommentary',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove commentary streams from file.'
    },
    {
      name: 'subRemoveUnwanted',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove unwanted language subtitle streams from file. Defined language(s) will not be removed.'
    },
    {
      name: 'subRemoveAll',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'Remove all subtitle streams from file.'
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
      tooltip: 'Overwrite existing subtitle files on disk if they exist.'
    },
  ]
});

function findMediaInfoItem(file, index) {
  let currMIOrder = -1;
  const strStreamType = file.ffProbeData.streams[index].codec_type.toLowerCase();

  for (let i = 0; i < file.mediaInfo.track.length; i += 1) {
    if (file.mediaInfo.track[i].StreamOrder) {
      currMIOrder = file.mediaInfo.track[i].StreamOrder;
    } else if (strStreamType === 'text' || strStreamType === 'subtitle') {
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
const plugin = (file, librarySettings, inputs, otherArguments) => {
  // eslint-disable-next-line global-require
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  // Check if all inputs have been configured. If they haven't then exit plugin.
  if ((inputs.re_encode10bit === '') || (inputs.minBitrate4K === '') || (inputs.minBitrate1080p === '') ||
      (inputs.minBitrate720p === '') || (inputs.minBitrate480p === '') || (inputs.audioBitrate === '') ||
      (inputs.audioChannels === '') || (inputs.audioLanguage === '')) {
    response.infoLog += 'Please configure options. Skipping this plugin. \n';
    response.processFile = false;
    return response;
  }

  const currentFileName = file._id; // .replace(/'/g, "'\"'\"'");

  // Settings
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Process Handling
  const intStatsDays =
  21; // If the stats date on the file, usually for mkv only, are older than this it will first update them

  // Video
  const targetVideoCodec = 'hevc'; // Desired Video Codec, if you change this it will might require code changes
  let bolUse10bit = inputs.re_encode10bit; // Encode 8 bit to 10 bit
  const targetFrameRate = 24; // Any frame rate greater than this will be adjusted 

  const maxVideoHeight = 2160; // Any thing over this size, I.E. 4K, will be reduced to this
  const qualityAdder =
  0.05; // This is a multiplier of codec compression to increase target quality above defined minimum

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
  const targetAudioLanguage = inputs.audioLanguage; // Desired Audio Language
  const targetAudioBitratePerChannel = inputs.audioBitrate * 1000; // 64K per channel gives you good lossy quality
  const targetAudioChannels = inputs.audioChannels; // Any thing above this number of channels will be reduced to it

  // Subtitle
  let cmdRemove = '';
  let cmdExtract = '';
  let processLanguage = inputs.subLanguage.toLowerCase().split(',');
  let bolExtract = inputs.subExtract;
  let bolRemoveCommentary = inputs.subRemoveCommentary;
  let bolRemoveUnwanted = inputs.subRemoveUnwanted;
  let bolRemoveAll = inputs.subRemoveAll;
  let bolOverwright = inputs.subOverwrite;

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  const proc = require('child_process');
  let bolStatsAreCurrent = false;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. Exiting \n';
    return response;
  }

  // If the file has already been processed we dont need to do more
  if (file.container === 'mkv' && (
      file.mediaInfo.track[0].extra !== undefined &&
      file.mediaInfo.track[0].extra.TNPROCESSED !== undefined &&
      file.mediaInfo.track[0].extra.TNPROCESSED === '1')) {
    response.processFile = false;
    response.infoLog += 'File already Processed! \n';
    return response;
  }

  // If the existing container is mkv there is a possibility the stats were not updated during any previous transcode, lets make sure
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
  let bolScaleVideo = false;
  let bolTranscodeVideo = false;
  let bolChangeFrameRateVideo = false;
  let optimalVideoBitrate = 0;
  let minimumVideoBitrate = 0;
  let targetCodecCompression = 0;
  let videoNewWidth = 0;
  let bolSource10bit = false;
  let bolTranscodeSoftwareDecode = false;

  let audioNewChannels = 0;
  let optimalAudioBitrate = 0;
  let bolTranscodeAudio = false;
  let bolDownMixAudio = false;

  let audioChannels = 0;
  let audioBitrate = 0;
  let audioIdxChannels = 0;
  let audioIdxBitrate = 0;

  let bolCopySubs = false;
  let bolCopySubsConvert = false;
  let bolExtractAll = false;
  if (bolExtract && processLanguage === 'all') {
    bolExtractAll = true;
  }
  if (bolRemoveAll) {
    bolRemoveUnwanted = false;
  }
  const subsArr = file.ffProbeData.streams.filter((row) => row.codec_type.toLowerCase() === ('subtitle'));

  const bolDoChapters = true;

  // Set up required variables
  let videoIdx = -1;
  let videoIdxFirst = -1;
  let audioIdx = -1;
  let audioIdxOther = -1;

  let strStreamType = '';

  let MILoc = -1;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {

    strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Video
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'video') {
      // First we need to check if it is included in the MediaInfo struture, it might not be (mjpeg??, others??)
      MILoc = findMediaInfoItem(file, i);

      response.infoLog += `Index ${i} MediaInfo stream: ${MILoc} \n`;

      if (MILoc > -1) {
        const streamHeight = file.ffProbeData.streams[i].height * 1;
        const streamWidth = file.ffProbeData.streams[i].width * 1;
        const streamFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
        let streamBR = file.mediaInfo.track[MILoc].BitRate * 1;

        if (isNaN(streamBR)) {
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

          if (isNaN(curStreamBR)) {
            curStreamBR = file.mediaInfo.track[MILocC].extra.FromStats_BitRate * 1;
          }

          // Only check here based on bitrate and video width
          if (streamBR > curStreamBR && streamWidth >= curStreamWidth) {
            videoIdx = i;
          }
        }
      }
    }

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Audio
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////

    if (strStreamType === 'audio') {
      audioChannels = file.ffProbeData.streams[i].channels * 1;
      audioBitrate = file.mediaInfo.track[findMediaInfoItem(file, i)].BitRate * 1;

      if (isNaN(audioBitrate)) {
        audioBitrate = file.mediaInfo.track[findMediaInfoItem(file, i)].extra.FromStats_BitRate * 1;
      }

      if (
        file.ffProbeData.streams[i].tags !== undefined &&
        file.ffProbeData.streams[i].tags.language === targetAudioLanguage
      ) {
        response.infoLog += `Audio stream ${i}: ${targetAudioLanguage}, ` +
          `${file.ffProbeData.streams[i].codec_name}, ${audioChannels}ch, ` +
          `${Math.round(audioBitrate / 1000)}kbps `;

        if (audioIdx === -1) {
          response.infoLog += '- First Audio Stream ';
          audioIdx = i;

        } else {
          audioIdxChannels = file.ffProbeData.streams[audioIdx].channels * 1;
          audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].BitRate;

          if (audioChannels > audioIdxChannels) {
            response.infoLog += '- More Audio Channels ';
            audioIdx = i;
          } else if (audioChannels === audioIdxChannels && audioBitrate > audioIdxBitrate) {
            response.infoLog += '- Higher Audio Rate ';
            audioIdx = i;
          }
        }
      } else {
        response.infoLog += `Audio stream ${i}: ???, ${file.ffProbeData.streams[i].codec_name}, ` +
          `${audioChannels}ch, ${Math.round(audioBitrate / 1000)}kbps `;

        if (audioIdxOther === -1) {
          response.infoLog += '- Unknown Audio Stream ';
          audioIdxOther = i;

        } else {
          audioIdxChannels = file.ffProbeData.streams[audioIdxOther].channels * 1;
          audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdxOther)].BitRate;

          if (audioChannels > audioIdxChannels) {
            response.infoLog += '- Unknown Stream More Audio Channels ';
            audioIdxOther = i;
          } else if (audioChannels === audioIdxChannels && audioBitrate > audioIdxBitrate) {
            response.infoLog += '- Unknown Stream Higher Audio Rate ';
            audioIdxOther = i;
          }
        }
      }
      response.infoLog += ' \n';
    }

    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Looking For Subtitles
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////

    if (!bolRemoveSubs && !bolCopySubs && (strStreamType === 'text' || strStreamType === 'subtitle')) {
      // A sub has an S_TEXT/WEBVTT codec, ffmpeg will fail with it																   
      if (file.mediaInfo.track[findMediaInfoItem(file, i)].CodecID !== 'S_TEXT/WEBVTT') {
        bolCopySubs = true;
        if (file.ffProbeData.streams[i].codec_name === 'mov_text') {
          bolCopySubsConvert = true;
          response.infoLog += 'SubTitles Found (mov_text), will convert \n';
        } else {
          response.infoLog += 'SubTitles Found, will copy \n';
        }
      } else {
        response.infoLog += 'SubTitles Found (S_TEXT/WEBVTT), will not copy \n';
        bolRemoveSubs = true;
      }
    }
  }

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Video Decision section
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  if (videoIdx === -1) {
    response.processFile = false;
    response.infoLog += 'No Video Track !! \n';
    return response;
  }

  response.infoLog += `Using video stream ${videoIdx} \n`;

  bolTranscodeVideo = true; // We will assume we will be transcoding
  MILoc = findMediaInfoItem(file, videoIdx);

  let videoHeight = file.ffProbeData.streams[videoIdx].height * 1;
  let videoWidth = file.ffProbeData.streams[videoIdx].width * 1;
  let videoFPS = file.mediaInfo.track[MILoc].FrameRate * 1;
  let videoBR = file.mediaInfo.track[MILoc].BitRate * 1;

  if (isNaN(videoBR)) {
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
    response.infoLog += `Video resolution, ${videoWidth} x ${videoHeight}, ` +
      `need to convert to ${videoNewWidth} x ${maxVideoHeight} \n`;
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
    response.infoLog += `Video stream determined to be 480p or lower. ` +
      `Minimum bitrate set as: ${(minimumVideoBitrate / 1000)}kbps. \n`;
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
  } else if (isNaN(videoBR)) {
    // Cannot determine source bitrate
    response.infoLog += 'Cannot determine source bitrate, throwing in towel and using minimum acceptable bitrate. \n';
    optimalVideoBitrate = minimumVideoBitrate;
  } else {
    // Source bitrate has enough meat for a decent transcode
    response.infoLog +=
      `Source bitrate: ${Math.round(videoBR / 1000)}kbps, is high enough to transcode to optimal bitrate. \n`;
  }

  response.infoLog +=
    `Post-process video stream will be: ${videoWidth} x ${videoHeight} x ${Math.round(videoFPS)}fps, ` +
    `${Math.round(optimalVideoBitrate / 1000)}kbps \n`;

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Audio Decision section
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  if (audioIdx === -1) {
    if (audioIdxOther !== -1) {
      response.infoLog += `Unable to determine audio stream language, proceeding anyways !! \n`;
      audioIdx = audioIdxOther;
    } else {
      response.processFile = false;
      response.infoLog += 'No Audio Track !! \n';
      return response;
    }
  }

  response.infoLog += `Using audio stream ${audioIdx} \n`;

  let audioBR = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].BitRate * 1;

  if (isNaN(audioBR)) {
    audioBR = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].extra.FromStats_BitRate * 1;
  }

  if (file.ffProbeData.streams[audioIdx].channels > targetAudioChannels) {
    bolDownMixAudio = true;
    audioNewChannels = targetAudioChannels;
    response.infoLog += `Source audio channels: ${file.ffProbeData.streams[audioIdx].channels} ` +
      `is higher than target: ${targetAudioChannels} \n`;
  } else {
    audioNewChannels = file.ffProbeData.streams[audioIdx].channels;
  }

  optimalAudioBitrate = audioNewChannels * targetAudioBitratePerChannel;

  // Now what are we going todo with the audio part
  if (audioBR > (optimalAudioBitrate * 1.1)) {
    bolTranscodeAudio = true;
    response.infoLog += `Source audio bitrate: ${Math.round(audioBR / 1000)}kbps is higher than target: ` +
      `${Math.round(optimalAudioBitrate / 1000)}kbps \n`;
  }

  // If the audio codec is not what we want then we should transcode
  if (file.ffProbeData.streams[audioIdx].codec_name !== targetAudioCodec) {
    bolTranscodeAudio = true;
    response.infoLog += `Audio codec: ${file.ffProbeData.streams[audioIdx].codec_name} differs from target: ` +
      `${targetAudioCodec}, changing \n`;
  }

  // If the source bitrate is less than out target bitrate we should not ever go up
  if (audioBR <= optimalAudioBitrate) {
    response.infoLog += `Source audio bitrate: ${Math.round(audioBR / 1000)}kbps is less or equal to target: ` +
      `${Math.round(optimalAudioBitrate / 1000)}kbps, using existing `;
    optimalAudioBitrate = audioBR;
    if (file.ffProbeData.streams[audioIdx].codec_name !== targetAudioCodec) {
      response.infoLog += 'rate';
    } else {
      response.infoLog += 'stream';
    }
    response.infoLog += ' \n';
  }

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // lets assemble our ffmpeg command
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  const strTranscodeFileOptions = ' ';

  let strFFcmd = '';

  if (bolTranscodeVideo) {
    if (bolTranscodeSoftwareDecode) {
      strFFcmd += ' -vaapi_device /dev/dri/renderD128 ';
    } else {
      strFFcmd += ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ';
    }
  }

  strFFcmd += ` <io> -max_muxing_queue_size 8000 -map 0:${videoIdx} `;
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

  strFFcmd += ` -map 0:${audioIdx} `;
  if (bolTranscodeAudio) {
    strFFcmd += ` -c:a:0 ${targetAudioCodec} -b:a ${optimalAudioBitrate} `;
  } else {
    strFFcmd += ' -c:a:0 copy ';
  }
  if (bolDownMixAudio) {
    strFFcmd += ` -ac ${audioNewChannels} `;
  }

  if (bolRemoveSubs) {
    strFFcmd += ' -map -0:s ';
  } else if (bolCopySubs) {
    if (bolCopySubsConvert) {
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

  strFFcmd += strTranscodeFileOptions;
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  response.preset += strFFcmd;
  response.processFile = true;
  response.infoLog += 'File needs work. Transcoding. \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;