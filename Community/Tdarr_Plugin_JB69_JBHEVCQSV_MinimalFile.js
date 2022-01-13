// allow isNaN
/* eslint no-restricted-globals: 0 */
/* eslint no-template-curly-in-string: 0 */
/* eslint global-require: 0 */
/* eslint eqeqeq: 1 */

/*
/// ///////////////////////////////////////////////////////////////////////////////////////////////////
Author: JarBinks, Zachg99, Jeff47
Date: 01/13/2022
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
This is based on what my goals are and uses a mix of internal and external programs to gather as much
useful information as possible to make decisions.
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
Subtitles:
    All are removed?? (TODO: ensure this is correct and mention the flag to keep them if desired)
    All are copied (They usually take up little space so I keep them)
    Any that are in mov_text will be converted to srt
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
 I am running the docker image provided for Tdarr.

 This plugin needs (but doesn't require) the mkvtoolnix package. Install command within the container:

    apt install mkvtoolnix

 That needs to be rerun with every rebuild of the container to get the proper mediainfo tags.

 One outstanding issue is I'm getting errors from ffmpeg when I attempt to process .ts files.

 Here is my docker config (I am running compose so yours might be a little different)
   tdarr_server:
     container_name: tdarr_server
     image: haveagitgat/tdarr:latest
     privileged: true
     restart: unless-stopped
     environment:
       - PUID=${PUID} # default user id, defined in .env
       - PGID=${PGID} # default group id, defined in .env
       - TZ=${TZ} # timezone, defined in .env
       - serverIP=tdarr_server #using internal docker networking. This should at least work when the nodes are on
                               #the same docker compose as the server
       - serverPort=8266
       - webUIPort=8265
     volumes:
       - ${ROOT}/tdarr/server:/app/server/Tdarr # Tdarr server files
       - ${ROOT}/tdarr/configs:/app/configs # config files - can be same as NODE (unless separate server)
       - ${ROOT}/tdarr/logs:/app/logs # Tdarr log files
       - ${ROOT}/tdarr/cache:/temp # Cache folder, Should be same path mapped on NODE
       - ${ROOT}/tdarr/testmedia:/home/Tdarr/testmedia # Should be same path mapped on NODE if using a test folder
       - ${ROOT}/tdarr/scripts:/home/Tdarr/scripts # my random way of saving script files
       - /volume1/video:/media # video library Should be same path mapped on NODE
     ports:
       - 8265:8265 #Exposed to access webui externally
       - 8266:8266 #Exposed to allow external nodes to reach the server
     logging:
       options:
         max-size: "2m"
         max-file: "3"
   tdarr_node:
     container_name: tdarr_node
     image: haveagitgat/tdarr_node:latest
     privileged: true
     restart: unless-stopped
     devices:
       - /dev/dri:/dev/dri
     environment:
       - PUID=${PUID} # default user id, defined in .env
       - PGID=${PGID} # default group id, defined in .env
       - TZ=${TZ} # timezone, defined in .env
       - serverIP=192.168.x.x #container name of the server, should be modified if server is on another machine
       - serverPort=8266
       - nodeID=TDARRNODE_2
       - nodeIP=192.168.x.x #container name of the node
       - nodePort=9267 #not exposed via a "ports: " setting as the server/node communication is done on the internal
                       #docker network and can communicate on all ports
     volumes:
       - ${ROOT}/tdarr/configs:/app/configs # config files - can be same as server (unless separate server)
       - ${ROOT}/tdarr/logs:/app/logs # config files - can be same as server (unless separate server)
       - ${ROOT}/tdarr/testmedia:/home/Tdarr/testmedia # Should be same path mapped on server if using a test folder
       - ${ROOT}/tdarr/scripts:/home/Tdarr/scripts # my random way of saving script files
       - ${ROOT}/tdarr/cache:/temp # Cache folder, Should be same path mapped on server
       - /mnt/video:/media # video library Should be same path mapped on server
     ports:
       - 9267:9267
     logging:
       options:
         max-size: "2m"
         max-file: "3"
/// ///////////////////////////////////////////////////////////////////////////////////////////////////
*/

const details = () => ({
  id: 'Tdarr_Plugin_JB69_JBHEVCQSV_MinimalFile',
  Stage: 'Pre-processing',
  Name: 'JB - QSV(vaapi), H265, AAC, MKV, bitrate optimized',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `***You should not use this*** until you read the comments at the top of the code and understand
how it works **this does alot** and is 1 of 2 routines you should to run **Part 1** \n`,
  Version: '2.2',
  Tags: 'pre-processing,ffmpeg,video,audio,qsv h265,aac',
  Inputs: [],
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

  const currentFileName = file._id; // .replace(/'/g, "'\"'\"'");

  // Settings
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Process Handling
  const intStatsDays = 21; // If the stats date on the file, usually for mkv only,
  // are older than this it will first update them

  // Video
  const targetVideoCodec = 'hevc'; // This is the basis of the routine, if you want to change
  // it you probably want to use a different script
  const bolUse10bit = true; // This will encode in 10 bit
  const targetFrameRate = 25; // Any frame rate greater than this will be adjusted

  const minSizeDiffForTranscode = 1.2; // If the existing bitrate is this much more than the target
  // bitrate it is ok to transcode, otherwise there might not be enough extra
  // to get decent quality
  const targetReductionForCodecSwitchOnly = 0.8; // When a video codec change happens and the source bitrate is lower
  // than optimal, we still lower the bitrate by this since hevc is ok
  // with a lower rate

  const maxVideoHeight = 2160; // Any thing over this size, I.E. 8K, will be reduced to this
  const targetCodecCompression = 0.08; // This effects the target bitrate by assuming a compression ratio

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
  const targetAudioCodec = 'aac'; // Desired Audio Coded, if you change this it will might require code changes
  const targetAudioLanguage = 'eng'; // Desired Audio Language
  const targetAudioBitratePerChannel = 64000; // 64K per channel gives you the good lossy quality out of AAC
  const targetAudioChannels = 6; // Any thing above this number of channels will be
  // reduced to it, because I cannot listen to it

  // Subtitles
  // const bolIncludeSubs = true; //not used
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  const proc = require('child_process'); // Causes lint error, hopefully not needed
  let bolStatsAreCurrent = false;

  // Run MediaInfo and load the results it into an object
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // response.infoLog += "Getting Media Info.\n";
  // var objMedInfo = "";
  // objMedInfo = JSON.parse(proc.execSync('mediainfo "' + currentFileName + '" --output=JSON').toString());
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  // Run ffprobe with full info and load the results it into an object
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // response.infoLog += "Getting FFProbe Info.\n";
  // var objFFProbeInfo = "";
  // objFFProbeInfo = JSON.parse(proc.execSync('ffprobe -v error -print_format json
  // -show_format -show_streams -show_chapters "' + currentFileName + '"').toString());
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  //    response.processFile = false;
  //    response.infoLog += objMedInfo + " \n";
  //    return response;

  // response.infoLog += "HomePath:" + JSON.stringify(otherArguments, null, 4) + "\n";
  // response.infoLog += "FIID:" + file._id + "\n";
  // response.infoLog += "IPID:" + inputs._id + "\n";
  // response.infoLog += "FIDB:" + JSON.stringify(file, null, 4) + "\n";
  // response.infoLog += "CacheDir:" + librarySettings.cache + "\n";
  // response.infoLog += "filename:" + require("crypto").createHash("md5").update(file._id).digest("hex") + "\n";
  // response.infoLog += "MediaInfo:" + JSON.stringify(objMedInfo, null, 4) + "\n";
  // response.infoLog += "FFProbeInfo:" + JSON.stringify(objFFProbeInfo, null, 4) + "\n";
  // response.infoLog += "objFFProbeInfo:" + JSON.stringify(objFFProbeInfo, null, 4) + "\n";

  // response.processFile = false;
  // return response;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. Exiting \n';
    return response;
  }

  // If the file has already been processed we dont need to do more
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
      } catch (err) {
        response.infoLog += 'Error Updating Status Probably Bad file, A remux will probably fix, will continue\n';
      }
      response.infoLog += 'Getting Stats Objects, again!\n';
      // objMedInfo = JSON.parse(proc.execSync('mediainfo "' + currentFileName + '" --output=JSON').toString());
      // objFFProbeInfo = JSON.parse(proc.execSync('ffprobe -v error -print_format json' +
      // ' -show_format -show_streams -show_chapters "' + currentFileName + '"').toString());
    }
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

  // Set up required variables
  let videoIdx = -1;
  let videoIdxFirst = -1;
  let audioIdx = -1;
  let audioIdxOther = -1;

  let strStreamType = '';
  let MILoc = -1;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    strStreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

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

        response.infoLog
          += `Video stream ${i}:${Math.floor(file.meta.Duration / 60)}:`
          + `${file.ffProbeData.streams[i].codec_name}${(bolSource10bit) ? '(10)' : ''}`;
        response.infoLog += `:${streamWidth}x${streamHeight}x${streamFPS}:${streamBR}bps \n`;

        if (videoIdxFirst === -1) {
          videoIdxFirst = i;
        }

        if (videoIdx === -1) {
          videoIdx = i;
        } else {
          const MILocC = findMediaInfoItem(file, videoIdx);
          // const curstreamheight = file.ffProbeData.streams[videoIdx].height * 1; //Not needed
          const curStreamWidth = file.ffProbeData.streams[videoIdx].width * 1;
          // const curstreamFPS = file.mediaInfo.track[MILocC].FrameRate * 1; //Not needed
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
      // response.processFile = false;
      // response.infoLog += i + ":" + objFFProbeInfo.streams[i].tags.language + " \n";
      // audioIdxFirst = i;

      // response.infoLog += JSON.stringify(objFFProbeInfo.streams[i]) + " \n";

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

    // Looking For Subtitles -- These are causing problems let's just exclude for now
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
    // bolDoSubs = true;
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  }

  // return response;

  // Go through chapters in the file looking for badness
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Not processing chapters - fileobject doesn't seem to have the chapters section
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////
  // for (var i = 0; i < objFFProbeInfo.chapters.length; i+=1) {

  // Bad start times
  //    if (objFFProbeInfo.chapters[i].start_time < 0) {
  //        bolDoChapters = false;
  //        break;   //Dont need to continue because we know they are bad
  //    }

  // Duplicate start times
  //    for (var x = 0; i < objFFProbeInfo.chapters.length; i+=1) {
  //        if (i != x && objFFProbeInfo.chapters[i].start_time == objFFProbeInfo.chapters[x].start_time) {
  //            bolDoChapters = false;
  //            break;   //Dont need to continue because we know they are bad
  //        }
  //    }
  // }

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

  if (videoFPS > targetFrameRate) {
    bolChangeFrameRateVideo = true; // Need to fix this it does not work :-(
  }

  // Lets see if we need to scal down the video size
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
    // bolTranscodeVideo = true;
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

  let optimalaudiobitrate = audioNewChannels * targetAudioBitratePerChannel;

  // Now what are we going todo with the audio part
  if (audioBR > (optimalaudiobitrate * 1.1)) {
    bolTranscodeAudio = true;
    response.infoLog += `Audio existing Bitrate, ${audioBR}, is higher than target, ${optimalaudiobitrate} \n`;
  }

  // If the audio codec is not what we want then we should transcode
  if (file.ffProbeData.streams[audioIdx].codec_name !== targetAudioCodec) {
    bolTranscodeAudio = true;
    response.infoLog
    += `Audio Codec, ${file.ffProbeData.streams[audioIdx].codec_name}, is different than target, `
    + `${targetAudioCodec}, Changing \n`;
  }

  // If the source bitrate is less than out target bitrate we should not ever go up
  if (audioBR < optimalaudiobitrate) {
    response.infoLog += `Audio existing Bitrate, ${audioBR}, is lower than target,`
    + ` ${optimalaudiobitrate}, using existing `;
    optimalaudiobitrate = audioBR;
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
  const strTranCodeBaseHW = ' -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi ';
  const strTranCodeBaseSW = ' -vaapi_device /dev/dri/renderD128 ';
  const strTranscodeVideoMapping = ' <io> -max_muxing_queue_size 8000 -map 0:{0} ';
  const strTranscodeVideoCopy = ' -c:v:0 copy ';
  const strTranscodeVideoTranscoding = ' -c:v:0 hevc_vaapi ';
  // Used to make the output 10bit, I think the quotes need to be this way for ffmpeg
  const strTranscodeVideoOptions = ' -vf "{0}" ';
  const strTranscodeVideoScaling = 'w=-1:h=1080'; // Used when video is above our target of 1080
  const strTransCodeFrameRate = 'fps={0}'; // Used to change the framerate to the target framerate
  const strTranscodeVideoFormatHW = 'scale_vaapi='; // Used to make the output 10bit
  const strTranscodeVideoFormat = 'format={0}'; // Used to add filters to the hardware transcode
  const strTranscodeVideo10bit = 'p010'; // Used to make the output 10bit
  const strTranscodeVideo8bit = 'p008'; // Used to make the output 8bit
  const strTranscodeVideoSWDecode = 'hwupload'; // Used to make it use software decode if necessary
  // Used to make it sure the software decode is in the proper pixel format
  const strTranscodeVideoSWDecode10bit = 'nv12|vaapi';
  const strTranscodeVideoBitrate = ' -b:v {0} '; // Used when video is above our target of 1080
  const strTranscodeAudioMapping = ' -map 0:{0} ';
  const strTranscodeAudioCopy = ' -c:a:0 copy ';
  const strTranscodeAudioTranscoding = ' -c:a:0 ${targetAudioCodec} -b:a {0} ';
  const strTranscodeAudioDownMixing = ' -ac {0} ';
  const strTranscodeSubs = ' -map 0:s -scodec copy ';
  const strTranscodeSubsConvert = ' -map 0:s -c:s srt ';
  const strTranscodeSubsNone = ' -map -0:s ';
  const strTranscodeMetadata = ' -map_metadata:g -1 -metadata JBDONEVERSION=1 -metadata JBDONEDATE={0} ';
  const strTranscodeChapters = ' -map_chapters {0} ';

  const strTranscodeFileOptions = ' ';

  let strFFcmd = '';
  if (bolTranscodeVideo) {
    if (bolTranscodeSoftwareDecode) {
      strFFcmd += strTranCodeBaseSW;
    } else {
      strFFcmd += strTranCodeBaseHW;
    }
  }
  strFFcmd += strTranscodeVideoMapping.replace('{0}', videoIdx);
  if (bolTranscodeVideo) {
    strFFcmd += strTranscodeVideoTranscoding;

    if (bolScaleVideo || bolUse10bit || bolTranscodeSoftwareDecode || bolChangeFrameRateVideo) {
      let strOptions = '';
      let strFormat = '';
      if (bolScaleVideo) {
        strOptions += strTranscodeVideoScaling;
      }

      let strChangeVideoRateString = '';
      if (bolChangeFrameRateVideo) {
        strChangeVideoRateString = `${strTransCodeFrameRate.replace('{0}', targetFrameRate)},`;
      }

      if (strFormat.length > 0) {
        strFormat += '=';
      }

      if (bolUse10bit && !bolSource10bit) {
        strFormat += strTranscodeVideo10bit;
      }

      if (!bolUse10bit && bolSource10bit) {
        strFormat += strTranscodeVideo8bit;
      }

      if (bolTranscodeSoftwareDecode) {
        if (bolSource10bit) {
          if (strFormat.length > 0) {
            strFormat += ',';
          }
          strFormat += strTranscodeVideoSWDecode10bit;
        }
        if (strFormat.length > 0) {
          strFormat += ',';
        }
        strFormat += strTranscodeVideoSWDecode;
      }

      if (strFormat.length > 0) {
        if (strOptions.length > 0) {
          strOptions += ',';
        }
        strOptions += strTranscodeVideoFormat.replace('{0}', strFormat);
      }

      if (bolTranscodeSoftwareDecode) {
        strFFcmd += strTranscodeVideoOptions.replace('{0}', strChangeVideoRateString + strOptions);
      } else {
        strFFcmd += strTranscodeVideoOptions
          .replace('{0}', strChangeVideoRateString + strTranscodeVideoFormatHW + strOptions);
      }
    }
    strFFcmd += strTranscodeVideoBitrate.replace('{0}', optimalVideoBitrate);
  } else {
    strFFcmd += strTranscodeVideoCopy;
  }

  strFFcmd += strTranscodeAudioMapping.replace('{0}', audioIdx);
  if (bolTranscodeAudio) {
    strFFcmd += strTranscodeAudioTranscoding
      .replace('{0}', optimalaudiobitrate)
      .replace('${targetAudioCodec}', targetAudioCodec);
  } else {
    strFFcmd += strTranscodeAudioCopy;
  }
  if (bolDownMixAudio) {
    strFFcmd += strTranscodeAudioDownMixing.replace('{0}', audioNewChannels);
  }
  if (bolForceNoSubs) {
    strFFcmd += strTranscodeSubsNone;
  } else if (bolDoSubs) {
    if (bolDoSubsConvert) {
      strFFcmd += strTranscodeSubsConvert;
    } else {
      strFFcmd += strTranscodeSubs;
    }
  }

  strFFcmd += strTranscodeMetadata.replace('{0}', new Date().toISOString());
  if (bolDoChapters) {
    strFFcmd += strTranscodeChapters.replace('{0}', '0');
  } else {
    strFFcmd += strTranscodeChapters.replace('{0}', '-1');
  }

  strFFcmd += strTranscodeFileOptions;
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////

  // response.infoLog += strFFcmd + "\n";

  response.preset += strFFcmd;
  response.processFile = true;
  response.infoLog += 'File needs work. Transcoding. \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
