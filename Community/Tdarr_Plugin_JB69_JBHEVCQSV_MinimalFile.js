// allow isNaN
/* eslint no-restricted-globals: 0 */
/* eslint no-template-curly-in-string: 0 */
/* eslint global-require: 0 */
/* eslint eqeqeq: 1 */

/*
/// ///////////////////////////////////////////////////////////////////////////////////////////////////
Author: JarBinks, Zachg99, Jeff47
Date: 03/22/2022
This is my attempt to create an all in one routine that will maintain my library in optimal format
!!!!FOR MY REQUIREMENTS!!!! Chances are very good you will need to make some changes to this routine
and it's partner in order to make it work for you.
Chances are also very good you will need to run linux commands and learn about ffmpeg, vaapi, Tdarr
and this script.
With that out of the way...Tdarr is awesome because it allowed me to create data driven code that
makes my library the best it could be. Thanks to everyone involved. Especially HaveAGitGat and Migz
whos existing code and assistance were invaluable
My belief is that given enough information about the video file an optimal configuration can be determined
specific to that file
This is based on what my goals are and uses external programs to gather as much useful information as possible
to make decisions.
There is a lot that goes into the gather and analysis part because:
It is the basis of the decisions and "garbage in, garbage out"
The video files are far from perfect when we get them and we need to make sure we learn as much as possible
The script adds metatags to the media files to control processing, or better yet not doing extra processing
on the same file.
This is especially useful when resetting Tdarr because each file gets touched again, so this expedites a full
library scan.
Tdarr does not seem to handle when a plugin code takes a while to run so all effort has been made minimize time
within the plugin code.
This is especially noticeable on a library reset and these scripts because of the extra time spent analyzing the
media files
Video:  (Only one video stream is used!!)
    The script computes a desired bitrate based on the following equation
    (videoHeight * videoWidth * videoFPS) * targetCodecCompression
    The first 3 give a raw number of bits that the stream requires, however with encoding there is a certain amount
    of acceptable loss, this is targetCodecCompression
    This number is pretty low for hevc. I have found 0.07 to be about the norm.
    This means that for hevc only 7% of the raw bitrate is necessary to produce some decent results and actually I
    have used, and seen, as low as 3.5%
    If the source video is less than this rate the script will either:
        Copy the existing stream, if the codec is hevc
        Transcode the stream to hevc using 80% of the original streams bitrate
          It could probably be less but if the source is of low bitrate we don�t want to compromise too much on
          the transcode
    If the source media bitrate is close, within 10%, of the target bitrate and the codec is hevc, it will copy
     instead of transcode to preserve quality
    The script will do an on chip transcode, meaning the decode and encode is all done on chip, except for mpeg4
    which must be decoded on the CPU
     (TODO: Videos with a framerate higher than a threshold, lets say 30, should be changed)
Audio:  (Only one audio stream is used!!)
     The script will choose one audio stream in the file that has:
        The desired language
        The highest channel count
     If the language is not set on the audio track it assumes it is in the desired language
     The audio bit rate is set to a threshold, currently 64K, * number channels in AAC.  This
     seems to give decent results
     If the source audio is less than this rate the script will either:
         Copy the existing stream, if the codec is aac
         Transcode the stream to aac using 100% of the original streams bitrate
             It could probably be less but if the source is of low bitrate but, we don�t want
             to compromise too much on the transcode
 Chapters:
     If chapters are found the script keeps them unless...
        Any chapter start time is a negative number (Yes I have seen it)
        Any duplicate start times are found
    (TODO: incomplete chapter info gets added to or removed...I have seen 2 chapters in the beginning and
    then nothing)
    The second routine will add chapters at set intervals to any file that has no chapters
 Metadata:
    Global metadata is cleared, I.E. title
    Stream specific metadata is copied
 Some requirements: (You should really really really really read this!!!)
! !!!! Docker on linux !!!!!
     Intel QSV compatible processor, I run it on an i5-9400 and I know earlier models have no
     HEVC capability or produce lessor results
 First off the Matching pair:
    Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile (JB - QSV(vaapi), H265, AAC, MKV, bitrate optimized)
    Tdarr_Plugin_JB69_JBHEVCQSZ_PostFix (JB - MKV Stats, Chapters, Audio Language)
 The order I run them in:
    Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile (JB - H265, AAC, MKV, bitrate optimized)
    Tdarr_Plugin_JB69_JBHEVCQSZ_PostFix (JB - MKV Stats, Chapters, Audio Language)
 I am running the docker image provided for Tdarr

/// ///////////////////////////////////////////////////////////////////////////////////////////////////
*/

const details = () => ({
  id: 'Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile',
  Stage: 'Pre-processing',
  Name: 'JB - QSV(vaapi), H265, AAC, MKV, Bitrate Optimized',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `***You should not use this*** until you read the comments at the top of the code and understand
how it works **this does a lot** and is 1 of 2 routines you should to run **Part 1** \n`,
  Version: '2.4',
  Tags: 'pre-processing,ffmpeg,video,audio,qsv,h265,aac',
  Inputs: [{
    name: 'Stats_Days',
    type: 'number',
    defaultValue: 21,
    inputUI: {
      type: 'text',
    },
    tooltip: `If the stats date on the file are older than this it will first update them,\\n
                usually for mkv only.`,
  }, {
    name: 'Target_Video_Codec',
    type: 'string',
    defaultValue: 'hevc',
    inputUI: {
      type: 'text',
    },
    tooltip: `This is the basis of the routine, if you want to change,\\n 
              it you probably want to use a different script`,
  }, {
    name: 'Use_10bit_Video',
    type: 'boolean',
    defaultValue: true,
    inputUI: {
      type: 'dropdown',
      options: [
        'true',
        'false',
      ],
    },
    tooltip: 'This will encode in 10 bit? Some processors can not.',
  }, {
    name: 'Target_Framerate',
    type: 'number',
    defaultValue: 25,
    inputUI: {
      type: 'text',
    },
    tooltip: 'Any frame rate greater than this will be adjusted.',
  }, {
    name: 'Min_Size_Difference_to_Transcode',
    type: 'number',
    defaultValue: 1.2,
    inputUI: {
      type: 'text',
    },
    tooltip: `If the existing bitrate is this much more than the target bitrate\\n
                it is ok to transcode, otherwise there might not be enough extra\\n
                to get decent quality.`,
  }, {
    name: 'Target_Reduction_for_Code_Switch',
    type: 'number',
    defaultValue: 0.8,
    inputUI: {
      type: 'text',
    },
    tooltip: `When a video codec change happens and the source bitrate is lower\\n
                than optimal, we still lower the bitrate by this since hevc is ok\\n
                with a lower rate.`,
  }, {
    name: 'Max_Video_Height',
    type: 'number',
    defaultValue: 2160,
    inputUI: {
      type: 'dropdown',
      options: [
        720,
        1080,
        2160,
        4320,
      ],
    },
    tooltip: 'Any thing over this size, I.E. 8K, will be reduced to this.',
  }, {
    name: 'Target_Codec_Compression',
    type: 'number',
    defaultValue: 0.08,
    inputUI: {
      type: 'text',
    },
    tooltip: 'This effects the target bitrate by assuming a compression ratio.',
  }, {
    name: 'Target_Audio_Codec',
    type: 'string',
    defaultValue: 'aac',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Desired Audio Codec, if you change this it might require code changes.',
  }, {
    name: 'Target_Audio_Language',
    type: 'string',
    defaultValue: 'eng',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Desired Audio Language.',
  }, {
    name: 'Target_Audio_Bitrate_Per_Channel',
    type: 'number',
    defaultValue: 64000,
    inputUI: {
      type: 'text',
    },
    tooltip: '64K per channel gives you the good lossy quality out of AAC.',
  }, {
    name: 'Target_Audio_Channels',
    type: 'number',
    defaultValue: 6,
    inputUI: {
      type: 'text',
    },
    tooltip: 'Any thing above this number of channels will be reduced to it.',
  }],
});

const findMediaInfoItem = (file, index) => {
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
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  // eslint-disable-next-line global-require
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
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

  // const currentFileName = file._id; // .replace(/'/g, "'\"'\"'");

  // Settings
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Process Handling
  const intStatsDays = inputs.Stats_Days;

  // Video
  const targetVideoCodec = inputs.Target_Video_Codec;
  const bolUse10bit = inputs.Use_10bit_Video;
  const targetFrameRate = inputs.Target_Framerate;
  const minSizeDiffForTranscode = inputs.Min_Size_Difference_to_Transcode;
  const targetReductionForCodecSwitchOnly = inputs.Target_Reduction_for_Code_Switch;
  const maxVideoHeight = inputs.Max_Video_Height;
  const targetCodecCompression = inputs.Target_Codec_Compression;

  // Since videos can have many widths and heights we need to convert to pixels (WxH) to understand what we
  // are dealing with and set a minimal optimal bitrate to not go below
  const minVideoPixels4K = 6500000;
  const minVideoRate4K = 8500000;

  const minVideoPixels2K = 1500000;
  const minVideoRate2K = 2400000;

  const minVideoPixelsHD = 750000;
  const minVideoRateHD = 1100000;

  const minVideoRateSD = 450000;

  // Audio
  const targetAudioCodec = inputs.Target_Audio_Codec;
  const targetAudioLanguage = inputs.Target_Audio_Language;
  const targetAudioBitratePerChannel = inputs.Target_Audio_Bitrate_Per_Channel;
  const targetAudioChannels = inputs.Target_Audio_Channels;

  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  // let bolStatsAreCurrent = false;

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. Exiting \n';
    return response;
  }

  if (file.container === 'mkv' && (
    file.mediaInfo.track[0].extra !== undefined
    && file.mediaInfo.track[0].extra.JBDONEVERSION !== undefined
    && file.mediaInfo.track[0].extra.JBDONEVERSION === '1')
  ) {
    response.processFile = false;
    response.infoLog += 'File already Processed! \n';
    return response;
  }

  // If the existing container is mkv there is a possibility the stats were not updated during any previous transcode,
  // lets make sure
  if (file.container === 'mkv') {
    let datStats = Date.parse(new Date(70, 1).toISOString());
    if (
      file.ffProbeData.streams[0].tags !== undefined
      && file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng'] !== undefined
    ) {
      datStats = Date.parse(`${file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng']} GMT`);
    }

    if (file.mediaInfo.track[0].extra !== undefined && file.mediaInfo.track[0].extra.JBDONEDATE !== undefined) {
      const JBDate = Date.parse(file.mediaInfo.track[0].extra.JBDONEDATE);

      response.infoLog += `JBDate: ${JBDate}, StatsDate: ${datStats}\n`;
      if (datStats >= JBDate) {
        // bolStatsAreCurrent = true;
      }
    } else {
      const statsThres = Date.parse(new Date(new Date().setDate(new Date().getDate() - intStatsDays)).toISOString());

      if (inputs.test === true) {
        response.infoLog += 'StatsThres: 1696281941214, StatsDate: 1528998569000\n';
      } else {
        response.infoLog += `StatsThres: ${statsThres}, StatsDate: ${datStats}\n`;
      }
      if (datStats >= statsThres) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // bolStatsAreCurrent = true;
      }
    }
    // No longer needed if updating stats in Tdarr
    // if (!bolStatsAreCurrent) {
    //  response.infoLog += 'Stats need to be updated! \n';

    //  try {
    //    proc.execSync(`mkvpropedit --add-track-statistics-tags "${currentFileName}"`);
    //    return response;
    //  } catch (err) {
    //    response.infoLog += 'Error Updating Status Probably Bad file, A remux will probably fix, will continue\n';
    //  }
    // }
  }

  // Logic Controls
  let bolScaleVideo = false;
  let bolTranscodeVideo = false;
  let bolChangeFrameRateVideo = false;
  let optimalVideoBitrate = 0;
  let videoNewWidth = 0;
  let bolSource10bit = false;
  let bolTranscodeSoftwareDecode = false;

  let audioNewChannels = 0;
  let bolTranscodeAudio = false;
  let bolDownMixAudio = false;

  let audioChannels = 0;
  let audioBitrate = 0;
  let audioIdxChannels = 0;
  let audioIdxBitrate = 0;

  let bolDoSubs = false;
  let bolForceNoSubs = false;
  let bolDoSubsConvert = false;

  const bolDoChapters = true;

  let videoIdx = -1;
  let videoIdxFirst = -1;
  let audioIdx = -1;
  let audioIdxOther = -1;

  let strStreamType = '';
  let MILoc = -1;

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

    // Looking For Video
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
    if (strStreamType === 'video') {
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

        let duration = 0;
        if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
          duration = parseFloat(file.ffProbeData?.format?.duration);
        } else {
          duration = file.meta.Duration;
        }

        response.infoLog
          += `Video stream ${i}:${Math.floor(duration / 60)}:`
          + `${file.ffProbeData.streams[i].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
        response.infoLog += `:${streamWidth}x${streamHeight}x${streamFPS}:${streamBR}bps \n`;

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
        file.ffProbeData.streams[i].tags !== undefined
        && file.ffProbeData.streams[i].tags.language === targetAudioLanguage
      ) {
        response.infoLog
          += `Audio stream ${i}:${targetAudioLanguage}`
          + `:${file.ffProbeData.streams[i].codec_name}:${audioChannels}:${audioBitrate}bps:`;

        if (audioIdx === -1) {
          response.infoLog += 'First Audio Stream \n';
          audioIdx = i;
        } else {
          audioIdxChannels = file.ffProbeData.streams[audioIdx].channels * 1;
          audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].BitRate;

          if (audioChannels > audioIdxChannels) {
            response.infoLog += 'More Audio Channels \n';
            audioIdx = i;
          } else if (audioChannels === audioIdxChannels && audioBitrate > audioIdxBitrate) {
            response.infoLog += 'Higher Audio Rate \n';
            audioIdx = i;
          }
        }
      } else {
        response.infoLog += `Audio stream ${i}:???:${file.ffProbeData.streams[i].codec_name}`
          + `:${audioChannels}:${audioBitrate}bps:`;

        if (audioIdxOther === -1) {
          response.infoLog += 'First Audio Stream \n';
          audioIdxOther = i;
        } else {
          audioIdxChannels = file.ffProbeData.streams[audioIdxOther].channels * 1;
          audioIdxBitrate = file.mediaInfo.track[findMediaInfoItem(file, audioIdxOther)].BitRate;

          if (audioChannels > audioIdxChannels) {
            response.infoLog += 'More Audio Channels \n';
            audioIdxOther = i;
          } else if (audioChannels === audioIdxChannels && audioBitrate > audioIdxBitrate) {
            response.infoLog += 'Higher Audio Rate \n';
            audioIdxOther = i;
          }
        }
      }
    }
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////

    // Looking For Subtitles
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
    if (!bolForceNoSubs && !bolDoSubs && (strStreamType === 'text' || strStreamType === 'subtitle')) {
      // A sub has an S_TEXT/WEBVTT codec, ffmpeg will fail with it
      if (file.mediaInfo.track[findMediaInfoItem(file, i)].CodecID !== 'S_TEXT/WEBVTT') {
        bolDoSubs = true;
        if (file.ffProbeData.streams[i].codec_name === 'mov_text') {
          bolDoSubsConvert = true;
          response.infoLog += 'SubTitles Found (mov_text), will convert \n';
        } else {
          response.infoLog += 'SubTitles Found, will copy \n';
        }
      } else {
        response.infoLog += 'SubTitles Found (S_TEXT/WEBVTT), will not copy \n';
        bolForceNoSubs = true;
      }
    }
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  }

  // Video Decision section
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  if (videoIdx === -1) {
    response.processFile = false;
    response.infoLog += 'No Video Track !! \n';
    return response;
  }

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
    file.ffProbeData.streams[videoIdx].profile !== undefined
    && file.ffProbeData.streams[videoIdx].profile.includes !== undefined
    && file.ffProbeData.streams[videoIdx].profile.includes('10')) {
    bolSource10bit = true;
  }

  // Source is Variable Frame rate but we will transcode to fixed
  if (file.mediaInfo.track[MILoc].FrameRate_Mode === 'VFR') videoFPS = 9999;

  if (videoFPS > targetFrameRate && file.container !== 'ts') {
    bolChangeFrameRateVideo = true; // Need to fix this it does not work :-(
  }

  // Lets see if we need to scale down the video size
  if (videoHeight > maxVideoHeight) {
    bolScaleVideo = true;
    videoNewWidth = Math.floor((maxVideoHeight / videoHeight) * videoWidth);
    response.infoLog
      += `Video Resolution, ${videoWidth}x${videoHeight}, need to convert to ${videoNewWidth}x${maxVideoHeight} \n`;
    videoHeight = maxVideoHeight;
    videoWidth = videoNewWidth;
  }

  // Figure out the desired bitrate
  optimalVideoBitrate = Math.floor((videoHeight * videoWidth * targetFrameRate) * targetCodecCompression);
  response.infoLog += `Pre Video Calc: ${videoHeight}, ${videoWidth}, ${videoFPS}, ${optimalVideoBitrate} \n`;

  // We need to check for a minimum bitrate
  if ((videoHeight * videoWidth) > minVideoPixels4K && optimalVideoBitrate < minVideoPixels4K) {
    response.infoLog
      += `Video Bitrate calulcated for 4K, ${optimalVideoBitrate}, is below minimum, ${minVideoPixels4K} \n`;
    optimalVideoBitrate = minVideoRate4K;
  } else if ((videoHeight * videoWidth) > minVideoPixels2K && optimalVideoBitrate < minVideoRate2K) {
    response.infoLog
      += `Video Bitrate calulcated for 2K, ${optimalVideoBitrate}, is below minimum, ${minVideoRate2K} \n`;
    optimalVideoBitrate = minVideoRate2K;
  } else if ((videoHeight * videoWidth) > minVideoPixelsHD && optimalVideoBitrate < minVideoRateHD) {
    response.infoLog
      += `Video Bitrate calulcated for HD, ${optimalVideoBitrate}, is below minimum, ${minVideoRateHD} \n`;
    optimalVideoBitrate = minVideoRateHD;
  } else if (optimalVideoBitrate < minVideoRateSD) {
    response.infoLog
      += `Video Bitrate calulcated for SD, ${optimalVideoBitrate}, is below minimum, ${minVideoRateSD} \n`;
    optimalVideoBitrate = minVideoRateSD;
  }

  // Check if it is already hvec, if not then we must transcode
  if (file.ffProbeData.streams[videoIdx].codec_name !== targetVideoCodec) {
    response.infoLog
      += `Video existing Codex is ${file.ffProbeData.streams[videoIdx].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
    response.infoLog += `, need to convert to ${targetVideoCodec}${(bolUse10bit) ? '(10)' : ''} \n`;

    if (file.ffProbeData.streams[videoIdx].codec_name === 'mpeg4') {
      bolTranscodeSoftwareDecode = true;
      response.infoLog
        += `Video existing Codex is ${file.ffProbeData.streams[videoIdx].codec_name}, `
        + 'need to decode with software codec \n';
    } else if (
      file.ffProbeData.streams[videoIdx].codec_name === 'h264'
      && file.ffProbeData.streams[videoIdx].profile.includes('10')
    ) {
      // If the source is 10 bit then we must software decode since qsv will not decode 264 10 bit??
      bolTranscodeSoftwareDecode = true;
      response.infoLog
      += `Video existing Codex is ${file.ffProbeData.streams[videoIdx].codec_name} 10 bit,`
      + ' need to decode with software codec \n';
    }
  }

  if (videoBR < (optimalVideoBitrate * minSizeDiffForTranscode)) {
    // We need to be careful here are else we could produce a bad quality
    response.infoLog += 'Low source bitrate! \n';
    if (file.ffProbeData.streams[videoIdx].codec_name === targetVideoCodec) {
      if (bolSource10bit === bolUse10bit) {
        response.infoLog
        += `Video existing Bitrate, ${videoBR}, is close to target Bitrate, `
        + `${optimalVideoBitrate}, using existing stream \n`;
        bolTranscodeVideo = false;
      } else {
        response.infoLog
        += 'Video existing bit depth is different from target, without a codec change, using using existing bitrate \n';
        optimalVideoBitrate = videoBR;
      }
    } else {
      // We have a codec change with not much meat so we need to adjust are target rate
      response.infoLog += `Video existing Bitrate, ${videoBR}, is close to, or lower than, target Bitrate, `;
      response.infoLog
      += `${optimalVideoBitrate}, with a codec change, using ${Math.floor(targetReductionForCodecSwitchOnly * 100)}`
      + '% of existing \n';
      optimalVideoBitrate = Math.floor(videoBR * targetReductionForCodecSwitchOnly);
      bolTranscodeVideo = true;
    }
  } else {
    // We already know the existing bitrate has enough meat for a decent transcode
    response.infoLog += `Video existing Bitrate, ${videoBR}, is higher than target,`
    + ` ${optimalVideoBitrate}, transcoding \n`;
  }
  response.infoLog += `Post Video Calc: ${videoHeight}, ${videoWidth}, ${videoFPS}, ${optimalVideoBitrate} \n`;
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  // Audio Decision section
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  if (audioIdx === -1) {
    if (audioIdxOther !== -1) {
      response.infoLog += 'Using Unknown Audio Track !! \n';
      audioIdx = audioIdxOther;
    } else {
      response.processFile = false;
      response.infoLog += 'No Audio Track !! \n';
      return response;
    }
  }

  let audioBR = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].BitRate * 1;

  if (isNaN(audioBR)) {
    audioBR = file.mediaInfo.track[findMediaInfoItem(file, audioIdx)].extra.FromStats_BitRate * 1;
  }

  if (file.ffProbeData.streams[audioIdx].channels > targetAudioChannels) {
    bolDownMixAudio = true;
    audioNewChannels = targetAudioChannels;
    response.infoLog
    += `Audio existing Channels, ${file.ffProbeData.streams[audioIdx].channels}, `
    + `is higher than target, ${targetAudioChannels} \n`;
  } else {
    audioNewChannels = file.ffProbeData.streams[audioIdx].channels;
  }

  let optimalAudioBitrate = audioNewChannels * targetAudioBitratePerChannel;

  // Now what are we going todo with the audio part
  if (audioBR > (optimalAudioBitrate * 1.1)) {
    bolTranscodeAudio = true;
    response.infoLog += `Audio existing Bitrate, ${audioBR}, is higher than target, ${optimalAudioBitrate} \n`;
  }

  // If the audio codec is not what we want then we should transcode
  if (file.ffProbeData.streams[audioIdx].codec_name !== targetAudioCodec) {
    bolTranscodeAudio = true;
    response.infoLog
    += `Audio Codec, ${file.ffProbeData.streams[audioIdx].codec_name}, is different than target, `
    + `${targetAudioCodec}, Changing \n`;
  }

  // If the source bitrate is less than out target bitrate we should not ever go up
  if (audioBR < optimalAudioBitrate) {
    response.infoLog += `Audio existing Bitrate, ${audioBR}, is lower than target,`
    + ` ${optimalAudioBitrate}, using existing `;
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

      if (!bolUse10bit && bolSource10bit) {
        // Used to make the output 8bit
        strFormat += 'p008';
      }

      if (bolTranscodeSoftwareDecode) {
        if (bolSource10bit) {
          if (strFormat.length > 0) {
            strFormat += ',';
          }
          // Used to make it sure the software decode is in the proper pixel format
          strFormat += 'nv12|vaapi';
        }
        if (strFormat.length > 0) {
          strFormat += ',';
        }
        // Used to make it use software decode if necessary
        strFormat += 'hwupload';
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
  if (bolForceNoSubs) {
    strFFcmd += ' -map -0:s ';
  } else if (bolDoSubs) {
    if (bolDoSubsConvert) {
      strFFcmd += ' -map 0:s -c:s srt ';
    } else {
      strFFcmd += ' -map 0:s -scodec copy ';
    }
  }

  if (inputs.test === true) {
    strFFcmd += ' -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE=2023-10-12T00:00:49.483Z ';
  } else {
    strFFcmd += ` -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE=${new Date().toISOString()} `;
  }

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
