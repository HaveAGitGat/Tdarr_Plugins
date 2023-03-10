// All credit for original plugin logic goes to Migz.
// This Plugin is essentially just his NVENC/CPU plugin modified to work with QSV & with extra hevc logic.
// Extra logic is mainly to control encoder quality/speed & to allow HEVC files to be reprocessed to reduce file size

// NOTE - This does not use VAAPI, it is QSV only. So newer intel iGPUs only. 8th+ gen should work.
// Additionally this was designed and tested on UNRAID via docker, though there is logic to support use on
// Windows & Linux - Both platforms have now been confirmed working, however there is no way to test all use cases
// Mac is supported, however it does not use QSV. This is because ffmpeg on Mac does not actually leverage QSV and
// instead uses "VideoToolbox" which is more a general video encode accelerator.

// White paper from intel regarding QSV performance on linux using FFMPEG here:
// eslint-disable-next-line max-len
// https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/cloud-computing-quicksync-video-ffmpeg-white-paper.pdf

const details = () => ({
  id: 'Tdarr_Plugin_bsh1_Boosh_FFMPEG_QSV_HEVC',
  Stage: 'Pre-processing',
  Name: 'Boosh-Transcode using QSV GPU & FFMPEG',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `==DETAILS== This is a QSV plugin. 8th+ gen INTEL QSV enabled CPUs are recommended. VAAPI is NOT used. 
    \n\n==OS SUPPORT== This plugin supports Linux & Windows using QSV. Mac is supported though cannot use QSV and 
    relies on 'VideoToolBox' - Expect to see different encode speed & quality on Mac compared to other platforms. 
    Ensure you set your node settings accordingly!
    \n\n==LOGIC== Files will be transcoded into H265/HEVC using Quick Sync Video (QSV) via Intel GPU using ffmpeg. 
    Settings are dependant on file bitrate working by the logic that H265 can support the same amount of data at half 
    the bitrate of H264. This plugin will skip files already in HEVC, AV1 & VP9 unless "reconvert_hevc" is marked as 
    true. If it is then these will be reconverted again if they exceed the bitrate specified in "hevc_max_bitrate".
    This plugin will also attempt to use mkvpropedit to generate accurate bitrate metadata in MKV files.
    It's not required to enable mkvpropedit but highly recommended to ensure accurate bitrates are used when 
    encoding your media. 
    \n\n==NOTE== Intel ARC cards are reportedly working successfully with this plugin, however please bare in mind that 
    I've not officially tested with them yet and your results might vary. Don't just assume it will work and if it does
    ensure you properly test your files & workflow!`,
  Version: '1.2',
  Tags: 'pre-processing,ffmpeg,video only,qsv,h265,hevc,mkvpropedit,configurable',
  Inputs: [
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'mkv',
          'mp4',
        ],
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSpecifies the output container of the file.
      \\nEnsure that all stream types you may have are supported by your chosen container.
      \\n
      ==INFO==
      \\nOnly MP4 & MKV are supported and MKV is recommended.
      \\nExample:\\n
      mkv
      \\nExample:\\n
      mp4`,
    },
    {
      name: 'force_conform',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nMake the file conform to output containers requirements.
      Use if you need to ensure the encode works from mp4>mkv or mkv>mp4. \\n
      ==WARNING== \\n
      This will remove data of certain types so ensure you are happy with that,
      or use another plugin to convert these data types first!
      \\n
      ==INFO==
      \\nDrop hdmv_pgs_subtitle/eia_608/subrip/timed_id3 for MP4.
      \\nDrop data streams/mov_text/eia_608/timed_id3 for MKV.
      \\nDefault is false.
      \\nExample:\\n
      true
      \\nExample:\\n
      false`,
    },
    {
      name: 'enable_10bit',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSpecify if we want to enable 10bit encoding. 
      \\nIf this is enabled files will be processed and converted into 10bit 
      HEVC using main10 profile and with p010le pixel format. \n
      If you just want to retain files that are already 10 bit then this can be left as false, as 
      10bit to 10bit in ffmpeg should be automatic.
      \\n
      ==INFO==
      \\nDefault is "false". 
      \\nExample:\\n
      true
      \\nExample:\\n
      false`,
    },
    {
      name: 'encoder_speedpreset',
      type: 'string',
      defaultValue: 'slow',
      inputUI: {
        type: 'dropdown',
        options: [
          'veryfast',
          'faster',
          'fast',
          'medium',
          'slow',
          'slower',
          'veryslow',
        ],
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSpecify the encoder speed/preset to use. 
      Slower options mean a slower encode but better quality and faster options mean faster encodes but 
      worse quality.
      \\nFor more information see intel white paper on ffmpeg results using QSV: \\n`
        // eslint-disable-next-line max-len
        + `https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/cloud-computing-quicksync-video-ffmpeg-white-paper.pdf
      \\n
      ==INFO==
      \\nDefault is "slow". 
      \\nExample:\\n
      medium
      \\nExample:\\n
      slower`,
    },
    {
      name: 'extra_qsv_options',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nHere you can add extra options to the ffmpeg QSV ENCODE cmd. 
      This does not override the ffmpeg cmd, it just allows additions to it.
      \\n
      There are extra QSV options that can be
      forced on/off as desired. See here for some possible cmds - 
      https://ffmpeg.org/ffmpeg-codecs.html#toc-HEVC-Options-1
      \\n
      ==WARNING== \\n
      Just because a cmd is mentioned doesn't mean your installed version of ffmpeg supports it... 
      Be certain to verify the cmds work before adding to your workflow. \\n
      Check Tdarr Help Tab. Enter ffmpeg cmd - "-h encoder=hevc_qsv". This will give a list of supported commands. \\n
      MAC SPECIFIC - This option is ignored on Mac because videotoolbox is used rather than qsv.
      \\n
      ==INFO==
      \\nDefault is empty but the first example below has a suggested value. If unsure just leave empty.
      \\nEnsure to only use cmds valid to encoding QSV as the script handles other ffmpeg cmds relating to 
      bitrate etc. Anything else entered here might be supported but could cause undesired results.
      \\nExample:\\n
      -look_ahead 1 -look_ahead_depth 100 -extbrc 1 -rdo 1 -mbbrc 1 -b_strategy 1 -adaptive_i 1 -adaptive_b 1
      \\n Above enables look ahead, extended bitrate control, b-frames, etc.\\n
      \\nExample:\\n
      -vf scale_qsv=w=1280:h=720
      \\nScale video resolution Method 1\\n
      \\nExample:\\n
      -vf scale_qsv=1280:-1
      \\nScale video resolution Method 2\\n`,
    },
    {
      name: 'bitrate_cutoff',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSpecify bitrate cutoff, files with a video bitrate lower then this will not be processed. \n
      \\n
      ==INFO==
      \\nRate is in kbps.
      \\nDefaults to 0 which means this is disabled.
      \\nEnter a valid number to enable.
      \\nExample:\\n
      2500
      \\nExample:\\n
      1500`,
    },
    {
      name: 'max_average_bitrate',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSpecify a maximum average video bitrate. When encoding we take the current video bitrate and halve it 
      to get an average target. This option sets a upper limit to that average 
      (i.e if you have a video bitrate of 10000, half is 5000, if your maximum desired average bitrate is 4000
      then we use that as the target instead of 5000).
      \\n
      ==INFO==
      \\nBitrate here is referring to video bitrate as we want to set the video bitrate on encode.
      \\nRate is in kbps.
      \\nDefaults to 0 which means this is disabled.
      \\nEnter a valid number to enable.
      \\nExample:\\n
      4000
      \\nExample:\\n
      3000`,
    },
    {
      name: 'min_average_bitrate',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSpecify a minimum average video bitrate. When encoding we take the current video bitrate and halve 
      it to get an average target. This option sets a lower limit to that average (i.e if you have a video bitrate
      of 3000, half is 1500, if your minimum desired average bitrate is 2000 then we use that as the target instead
      of 1500).
      \\n
      ==INFO==
      \\nBitrate here is referring to video bitrate as we want to set the video bitrate on encode.
      \\nRate is in kbps.
      \\nDefaults to 0 which means this is disabled.
      \\nEnter a valid number to enable.
      \\nExample:\\n
      2000
      \\nExample:\\n
      1000`,
    },
    {
      name: 'reconvert_hevc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nSet to reprocess HEVC, VP9 or AV1 files (i.e reduce bitrate of files already in those codecs). 
      \\nSince this uses the same logic as normal, halving the current bitrate, this is NOT recommended 
      unless you know what you are doing, so please leave FALSE if unsure! 
      \\nNEEDS to be used in conjunction with "bitrate_cutoff" or "hevc_max_bitrate" otherwise is ignored.
      \\nThis is useful in certain situations, perhaps you have a file which is HEVC but has an extremely high
      bitrate and you'd like to reduce it.
      \\n
      ==WARNING== \\n
      IF YOU HAVE VP9 OR AV1 FILES YOU WANT TO KEEP IN THOSE FORMATS THEN DO NOT USE THIS OPTION. \\n
      \\nThis option has the potential to LOOP your encodes! You can encode a file to HEVC and still 
      be above your cutoff and it would be converted again & again if this is set to true (since it's now HEVC). 
      So if you use this be sure to set "hevc_max_bitrate" & "max_average_bitrate" to help prevent the plugin looping. 
      Also it is highly suggested that you have your "hevc_max_bitrate" higher than "max_average_bitrate".
      \\nPlease be certain you want this enabled before setting it otherwise leave this as FALSE!
      While the plugin will attempt to generate accurate video bitrate metadata, it can not always reliably do so 
      and will be forced to fall back onto estimates. Please bare this in mind when using the HEVC reprocess option.
      \\n
      \\nExample:\\n
      true
      \\nExample:\\n
      false`,
    },
    {
      name: 'hevc_max_bitrate',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip: `\\n
      ==DESCRIPTION==
      \\nHas no effect unless "reconvert_hevc" is set to true. This allows you to specify a maximum
      allowed average OVERALL bitrate for HEVC or similar files. Much like the "bitrate_cutoff" option, but
      specifically for HEVC files. It should be set HIGHER then your standard cutoff for safety.
      \\nAlso, it's highly suggested you use the min & max average bitrate options in combination with this. You
      will want those to control the encoded video bitrate, otherwise you may end up repeatedly reprocessing HEVC files.
      i.e your file might have a overall bitrate of 20000, if your hevc cutoff is 5000 then it's going to reconvert 
      multiple times before it'll fall below that cutoff. While HEVC reprocessing can be useful this is why it is NOT 
      recommended!
      \\n
      ==WARNING== \\n
      While the plugin will attempt to generate accurate video bitrate metadata, it can not always reliably do so 
      and will be forced to fall back onto estimates. Please bare this in mind when using the HEVC reprocess option.
      \\n
      ==INFO==
      \\nRate is in kbps.
      \\nDefaults to 0 which means this is disabled.
      \\nEnter a valid number to enable, otherwise we use "bitrate_cutoff" and multiply x2 for a safe limit.
      \\nExample:\\n
      4000
      \\nExample:\\n
      3000`,
    },
  ],
});

// Set up required variables.
let currentBitrate = 0;
let overallBitRate = 0;
let targetBitrate = 0;
let minimumBitrate = 0;
let maximumBitrate = 0;
let duration = '';
let videoIdx = 0;
let extraArguments = '';
let bitrateSettings = '';
let inflatedCutoff = 0;
let main10 = false;
let videoBR = 0;

// Finds the first video stream and get video bitrate

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  const os = require('os');
  const proc = require('child_process');
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
    container: `.${inputs.container}`,
  };

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += `☒ File seems to be ${file.fileMedium} & not video. Exiting \n`;
    return response;
  }

  // MKVPROPEDIT - Refresh video stats
  const intStatsDays = 7; // Use 1 week threshold for new stats
  let statsUptoDate = false;
  const currentFileName = file._id;
  let statsError = false;
  let metadataEncode = '';

  // Only process MKV files
  if (file.container === 'mkv') {
    let datStats = Date.parse(new Date(70, 1).toISOString()); // Placeholder date
    metadataEncode = `-map_metadata:g -1 -metadata JBDONEDATE=${datStats}`;
    if (file.mediaInfo.track[0].extra !== undefined && file.mediaInfo.track[0].extra.JBDONEDATE !== undefined) {
      datStats = Date.parse(file.mediaInfo.track[0].extra.JBDONEDATE);
    } else {
      try {
        if (
          file.mediaInfo.track[0].extra !== undefined
          && file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng'] !== undefined
        ) {
          // Set stats date to match info inside file
          datStats = Date.parse(`${file.ffProbeData.streams[0].tags['_STATISTICS_WRITING_DATE_UTC-eng']} GMT`);
        }
      } catch (err) {
        // Catch error - Ignore & carry on - If check can bomb out if the tag doesn't exist...
      }
    }

    // Threshold for stats date
    const statsThres = Date.parse(new Date(new Date().setDate(new Date().getDate() - intStatsDays)).toISOString());

    // Strings for easy to read dates in info log
    let statsThresString = new Date(statsThres);
    statsThresString = statsThresString.toUTCString();
    let datStatsString = new Date(datStats);
    datStatsString = datStatsString.toUTCString();
    response.infoLog += `Checking file stats - If stats are older than ${intStatsDays} days we'll grab new stats.\n
    Stats threshold: ${statsThresString}\n
    Current stats date: ${datStatsString}\n`;

    // Are the stats out of date?
    if (datStats >= statsThres) {
      statsUptoDate = true;
      response.infoLog += '☑ File stats are upto date! - Continuing...\n';
    } else {
      response.infoLog += '☒ File stats are out of date! - Will attempt to use mkvpropedit to refresh stats\n';
      try {
        if (otherArguments.mkvpropeditPath !== '') { // Try to use mkvpropedit path if it is set
          proc.execSync(`"${otherArguments.mkvpropeditPath}" --add-track-statistics-tags "${currentFileName}"`);
        } else { // Otherwise just use standard mkvpropedit cmd
          proc.execSync(`mkvpropedit --add-track-statistics-tags "${currentFileName}"`);
        }
      } catch (err) {
        response.infoLog += '☒ Error updating file stats - Possible mkvpropedit failure or file issue - '
          + ' Ensure mkvpropedit is set correctly in the node settings & check the filename for unusual characters.\n'
          + ' Continuing but file stats will likely be inaccurate...\n';
        statsError = true;
      }
      if (statsError !== true) {
        // File now updated with new stats
        response.infoLog += 'Remuxing file to write in updated file stats! \n';
        response.preset += `-fflags +genpts <io> -map 0 -c copy -max_muxing_queue_size 9999 -map_metadata:g -1 
        -metadata JBDONEDATE=${new Date().toISOString()}`;
        response.processFile = true;
        return response;
      }
    }
  } else {
    response.infoLog += 'Input file is not MKV so cannot use mkvpropedit to get new file stats. '
      + 'Continuing but file stats will likely be inaccurate...\n';
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const strstreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();
    videoIdx = -1;
    // Check if stream is a video.
    if (videoIdx === -1 && strstreamType === 'video') {
      videoIdx = i;
      videoBR = Number(file.mediaInfo.track[i + 1].BitRate) / 1000;

      // If MediaInfo fails somehow fallback to ffprobe - Try two types of tags that might exist
      if (videoBR <= 0) {
        if (Number(file.ffProbeData.streams[i].tags.BPS) > 0) {
          videoBR = file.ffProbeData.streams[i].tags.BPS / 1000;
        } else {
          try {
            if (Number(file.ffProbeData.streams[i].tags.BPS['-eng']) > 0) {
              videoBR = file.ffProbeData.streams[i].tags.BPS['-eng'] / 1000;
            }
          } catch (err) {
            // Catch error - Ignore & carry on - If check can bomb out if tags don't exist...
          }
        }
      }
    }
  }

  // Check if duration info is filled, if so convert time format to minutes.
  // If not filled then get duration of video stream and do the same.
  if (typeof file.meta.Duration !== 'undefined') {
    duration = file.meta.Duration;
    // Get seconds by using a Date & then convert to minutes
    duration = (new Date(`1970-01-01T${duration}Z`).getTime() / 1000) / 60;
  } else {
    duration = file.ffProbeData.streams[videoIdx].tags.DURATION;
    duration = (new Date(`1970-01-01T${duration}Z`).getTime() / 1000) / 60;
  }

  if (Number.isNaN(videoBR) || videoBR <= 0) {
    // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)"
    currentBitrate = Math.round(file.file_size / (duration * 0.0075));
    response.infoLog += '==WARNING== Failed to get an accurate video bitrate, ';
    response.infoLog += `falling back to old method to get OVERALL file bitrate of ${currentBitrate}kbps. `;
    response.infoLog += 'Bitrate calculations for video encode will likely be inaccurate... \n';
  } else {
    currentBitrate = Math.round(videoBR);
    response.infoLog += `☑ It looks like the current video bitrate is ${currentBitrate}kbps. \n`;
  }

  // Get overall bitrate for use with HEVC reprocessing
  overallBitRate = Math.round(file.file_size / (duration * 0.0075));
  // Halve current bitrate for Target bitrate, in theory h265 can be half the bitrate as h264 without losing quality.
  targetBitrate = Math.round(currentBitrate / 2);
  // Allow some leeway under and over the targetBitrate.
  minimumBitrate = Math.round(targetBitrate * 0.75);
  maximumBitrate = Math.round(targetBitrate * 1.25);

  // If targetBitrate or currentBitrate comes out as 0 then something
  // has gone wrong and bitrates could not be calculated.
  // Cancel plugin completely.
  if (targetBitrate <= 0 || currentBitrate <= 0) {
    response.infoLog += '☒ Target bitrate could not be calculated. Skipping this plugin. \n';
    return response;
  }

  // If targetBitrate is equal or greater than currentBitrate then something
  // has gone wrong as that is not what we want.
  // Cancel plugin completely.
  if (targetBitrate >= currentBitrate) {
    response.infoLog += `☒ Target bitrate has been calculated as ${targetBitrate}kbps. This is equal or greater `;
    response.infoLog += "than the current bitrate... Something has gone wrong and this shouldn't happen! "
      + 'Skipping this plugin. \n';
    return response;
  }

  // Ensure that bitrate_cutoff is set if reconvert_hevc is true since we need some protection against a loop
  // Cancel the plugin
  if (inputs.reconvert_hevc === true && inputs.bitrate_cutoff <= 0 && inputs.hevc_max_bitrate <= 0) {
    response.infoLog += `Reconvert HEVC is ${inputs.reconvert_hevc}, however there is no bitrate cutoff `;
    response.infoLog += 'or HEVC specific cutoff set so we have no way to know when to stop processing this file. \n'
      + 'Either set reconvert_HEVC to false or set a bitrate cutoff and set a hevc_max_bitrate cutoff. \n'
      + '☒ Skipping this plugin. \n';
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff > 0) {
    // Checks if currentBitrate is below inputs.bitrate_cutoff.
    // If so then cancel plugin without touching original files.
    if (currentBitrate <= inputs.bitrate_cutoff) {
      response.infoLog += `☑ Current bitrate is below set cutoff of ${inputs.bitrate_cutoff}kbps. \n`
        + 'Cancelling plugin. \n';
      return response;
    }
    // If above cutoff then carry on
    if (currentBitrate > inputs.bitrate_cutoff && inputs.reconvert_hevc === false) {
      response.infoLog += '☒ Current bitrate appears to be above the cutoff. Need to process \n';
    }
  }

  if (inputs.max_average_bitrate > 0) {
    // Checks if targetBitrate is above inputs.max_average_bitrate.
    // If so then clamp target bitrate
    if (targetBitrate > inputs.max_average_bitrate) {
      response.infoLog += 'Our target bitrate is above the max_average_bitrate ';
      response.infoLog += `so clamping at max of ${inputs.max_average_bitrate}kbps. \n`;
      targetBitrate = Math.round(inputs.max_average_bitrate);
      minimumBitrate = Math.round(targetBitrate * 0.75);
      maximumBitrate = Math.round(targetBitrate * 1.25);
    }
  }

  // Check if inputs.min_average_bitrate has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.min_average_bitrate > 0) {
    // Exit the plugin is the cutoff is less than the min average bitrate. Most likely user error
    if (inputs.bitrate_cutoff < inputs.min_average_bitrate) {
      response.infoLog += `☒ Bitrate cutoff ${inputs.bitrate_cutoff}k is less than the set minimum 
      average bitrate set of ${inputs.min_average_bitrate}kbps. We don't want this. Cancelling plugin. \n`;
      return response;
    }
    // Checks if inputs.bitrate_cutoff is below inputs.min_average_bitrate.
    // If so then set currentBitrate to the minimum allowed.)
    if (targetBitrate < inputs.min_average_bitrate) {
      response.infoLog += `Target average bitrate clamped at min of ${inputs.min_average_bitrate}kbps. \n`;
      targetBitrate = Math.round(inputs.min_average_bitrate);
      minimumBitrate = Math.round(targetBitrate * 0.75);
      maximumBitrate = Math.round(targetBitrate * 1.25);
    }
  }

  // It's possible to remux or flat out convert from mp4 to mkv so we need to conform to standards
  // So check streams and add any extra parameters required to make file conform with output format.
  // i.e drop mov_text for mkv files and drop pgs_subtitles for mp4
  if (inputs.force_conform === true) {
    if (inputs.container.toLowerCase() === 'mkv') {
      extraArguments += '-map -0:d ';
      for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
        try {
          if (
            file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'mov_text'
            || file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'eia_608'
            || file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'timed_id3'
          ) {
            extraArguments += `-map -0:${i} `;
          }
        } catch (err) {
          // Error
        }
      }
    }
    if (inputs.container.toLowerCase() === 'mp4') {
      for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
        try {
          if (
            file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'hdmv_pgs_subtitle'
            || file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'eia_608'
            || file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'subrip'
            || file.ffProbeData.streams[i].codec_name
              .toLowerCase() === 'timed_id3'
          ) {
            extraArguments += `-map -0:${i} `;
          }
        } catch (err) {
          // Error
        }
      }
    }
  }

  // Are we encoding to 10 bit? If so enable correct profile & pixel format.
  // With this set we also disable hardware decode for compatibility later
  if (inputs.enable_10bit === true) {
    main10 = true;
    extraArguments += '-profile:v main10 -pix_fmt p010le ';
    response.infoLog += '10 bit encode enabled. Setting Main10 Profile & 10 bit pixel format \n';
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    // Check if stream is a video.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
      // Check if codec of stream is mjpeg/png, if so then remove this "video" stream.
      // mjpeg/png are usually embedded pictures that can cause havoc with plugins.
      if (file.ffProbeData.streams[i].codec_name === 'mjpeg' || file.ffProbeData.streams[i].codec_name === 'png') {
        extraArguments += `-map -v:${videoIdx} `;
      }

      // Check for HDR in files. If so exit plugin. We assume HDR files have bt2020 color spaces. HDR can be complicated
      // and some aspects are still unsupported in ffmpeg I believe. Likely we don't want to re-encode anything HDR.
      if (file.ffProbeData.streams[i].color_space === 'bt2020nc'
        && file.ffProbeData.streams[i].color_transfer === 'smpte2084'
        && file.ffProbeData.streams[i].color_primaries === 'bt2020') {
        response.infoLog += '☒ This looks to be a HDR file. HDR files are unfortunately '
          + 'not supported by this plugin. Exiting plugin. \n\n';
        return response;
      }

      // Now check if we're reprocessing HEVC files, if not then ensure we don't convert HEVC again
      if (inputs.reconvert_hevc === false && (file.ffProbeData.streams[i].codec_name === 'hevc'
        || file.ffProbeData.streams[i].codec_name === 'vp9' || file.ffProbeData.streams[i].codec_name === 'av1')) {
        // Check if codec of stream is HEVC, VP9 or AV1 AND check if file.container matches inputs.container.
        // If so nothing for plugin to do.
        if ((file.ffProbeData.streams[i].codec_name === 'hevc' || file.ffProbeData.streams[i].codec_name === 'vp9'
          || file.ffProbeData.streams[i].codec_name === 'av1') && file.container === inputs.container) {
          response.infoLog += `☑ File is already HEVC, VP9 or AV1 & in ${inputs.container}. \n`;
          return response;
        }

        // Check if codec of stream is HEVC, Vp9 or AV1
        // AND check if file.container does NOT match inputs.container.
        // If so remux file.
        if ((file.ffProbeData.streams[i].codec_name === 'hevc' || file.ffProbeData.streams[i].codec_name === 'vp9'
          || file.ffProbeData.streams[i].codec_name === 'av1') && file.container !== inputs.container) {
          response.infoLog += `☒ File is HEVC, VP9 or AV1 but is not in ${inputs.container} container. Remuxing. \n`;
          response.preset = `<io> -map 0 -c copy ${extraArguments}`;
          response.processFile = true;
          return response;
        }

        // New logic for reprocessing HEVC. Mainly done for my own use.
        // We attempt to get accurate stats earlier - If we can't we fall back onto overall bitrate
        // which can be inaccurate. We may inflate the current bitrate check so we don't keep looping this logic.
      } else if (inputs.reconvert_hevc === true && (file.ffProbeData.streams[i].codec_name === 'hevc'
        || file.ffProbeData.streams[i].codec_name === 'vp9' || file.ffProbeData.streams[i].codec_name === 'av1')) {
        if (statsUptoDate !== true) {
          currentBitrate = overallBitRate; // User overall bitrate if we don't have upto date stats
          response.infoLog += `☒ Unable to get accurate stats for HEVC so falling back to Overall file Bitrate. 
          Remux to MKV to allow generation of accurate video bitrate statistics. 
          File overall bitrate is ${overallBitRate}kbps.\n`;
        }
        if (inputs.hevc_max_bitrate > 0) {
          if (currentBitrate > inputs.hevc_max_bitrate) {
            // If bitrate is higher then hevc_max_bitrate then need to re-encode
            response.infoLog += `Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, `
              + `VP9 or AV1. Using HEVC specific cutoff of ${inputs.hevc_max_bitrate}kbps. \n`;
            response.infoLog += '☒ The file is still above this new cutoff! Reconverting. \n';
          } else {
            // Otherwise we're now below the hevc cutoff and we can exit
            response.infoLog += `Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, `
              + `VP9 or AV1. Using HEVC specific cutoff of ${inputs.hevc_max_bitrate}kbps. \n`;
            response.infoLog += '☑ The file is NOT above this new cutoff. Exiting plugin. \n';
            return response;
          }

          // If we're not using the hevc max bitrate then we need a safety net to try and ensure we don't keep
          // looping this plugin. For maximum safety we simply multiply the cutoff by 2.
        } else if (currentBitrate > (inputs.bitrate_cutoff * 2)) {
          inflatedCutoff = Math.round(inputs.bitrate_cutoff * 2);
          response.infoLog += `Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, `;
          response.infoLog += 'VP9 or AV1. Will use Overall file Bitrate for HEVC files as safety, ';
          response.infoLog += `bitrate is ${overallBitRate}kbps. \n`;
          response.infoLog += 'HEVC specific cutoff not set so bitrate_cutoff is multiplied by 2 for safety! \n';
          response.infoLog += `Cutoff now temporarily ${inflatedCutoff}kbps. \n`;
          response.infoLog += '☒ The file is still above this new cutoff! Reconverting. \n';
        } else {
          // File is below cutoff so we can exit
          inflatedCutoff = Math.round(inputs.bitrate_cutoff * 2);
          response.infoLog += `Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, `;
          response.infoLog += 'VP9 or AV1. Will use Overall file Bitrate for HEVC files as safety, ';
          response.infoLog += `bitrate is ${overallBitRate}kbps. \n`;
          response.infoLog += 'HEVC specific cutoff not set so bitrate_cutoff is multiplied by 2 for safety! \n';
          response.infoLog += `Cutoff now temporarily ${inflatedCutoff}kbps. \n`;
          response.infoLog += '☑The file is NOT above this new cutoff. Exiting plugin. \n';
          return response;
        }
      }

      // If files are already 10bit then disable hardware decode to avoid problems with encode
      // 10 bit from source file should be retained without extra arguments.
      if (file.ffProbeData.streams[i].profile === 'High 10'
        || file.ffProbeData.streams[i].profile === 'Main 10'
        || file.ffProbeData.streams[i].bits_per_raw_sample === '10') {
        main10 = true;
        response.infoLog += 'Input file is 10bit. Disabling hardware decoding to avoid problems. \n';
      }

      // Increment video index. Needed to keep track of video id in case there is more than one video track.
      // (i.e png or mjpeg which we would remove at the start of the loop)
      videoIdx += 1;
    }
  }

  // Set bitrateSettings variable using bitrate information calculated earlier.
  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k `
    + `-maxrate ${maximumBitrate}k -bufsize ${currentBitrate}k`;
  // Print to infoLog information around file & bitrate settings.
  response.infoLog += `Container for output selected as ${inputs.container}. \n`;
  response.infoLog += 'Encode variable bitrate settings: \n';
  response.infoLog += `Target = ${targetBitrate}k \n`;
  response.infoLog += `Minimum = ${minimumBitrate}k \n`;
  response.infoLog += `Maximum = ${maximumBitrate}k \n`;

  // START PRESET
  // -fflags +genpts should regenerate timestamps if they end up missing...
  response.preset = '-fflags +genpts ';

  // HW ACCEL FLAGS
  // Account for different OS
  switch (os.platform()) {
    case 'darwin': // Mac OS - Enable videotoolbox instead of QSV
      response.preset += '-hwaccel videotoolbox';
      break;
    case 'linux': // Linux - Full device, should fix child_device_type warnings
      response.preset += `-hwaccel qsv -hwaccel_output_format qsv 
      -init_hw_device qsv:hw_any,child_device_type=vaapi `;
      break;
    case 'win32': // Windows - Full device, should fix child_device_type warnings
      response.preset += `-hwaccel qsv -hwaccel_output_format qsv 
      -init_hw_device qsv:hw_any,child_device_type=d3d11va `;
      break;
    default:
      response.preset += '-hwaccel qsv -hwaccel_output_format qsv -init_hw_device qsv:hw_any ';
  }

  // DECODE FLAGS
  if (os.platform() !== 'darwin') {
    if (main10 === false) { // Don't enable if 10bit is on - Seems to cause issues, may need different decode flags
      switch (file.video_codec_name) {
        case 'mpeg2':
          response.preset += '-c:v mpeg2_qsv';
          break;
        case 'h264':
          response.preset += '-c:v h264_qsv';
          break;
        case 'vc1':
          response.preset += '-c:v vc1_qsv';
          break;
        case 'mjpeg':
          response.preset += '-c:v mjpeg_qsv';
          break;
        case 'vp8':
          response.preset += '-c:v vp8_qsv';
          break;
        case 'hevc':
          response.preset += '-c:v hevc_qsv';
          break;
        case 'vp9': // Should be supported by 8th Gen +
          response.preset += '-c:v vp9_qsv';
          break;
        default:
          response.preset += '';
      }
    }
  }

  // ENCODE FLAGS
  response.preset += '<io> -map 0 -c:v ';

  // Account for different OS setup for QSV HEVC encode.
  switch (os.platform()) {
    case 'darwin':
      response.preset += 'hevc_videotoolbox';
      // Mac OS & uses hevc_videotoolbox not QSV - Only shows up on Mac installs
      break;
    case 'linux':
      response.preset += 'hevc_qsv';
      break;
    case 'win32':
      response.preset += 'hevc_qsv -load_plugin hevc_hw';
      // Windows needs the additional -load_plugin. Tested working on a Win 10 - i5-10505
      break;
    default:
      response.preset += 'hevc_qsv'; // Default to QSV
  }

  // Add the rest of the ffmpeg command
  switch (os.platform()) {
    case 'darwin':
      // Mac OS - Don't use extra_qsv_options - These are intended for QSV cmds so videotoolbox causes issues
      response.preset += ` ${bitrateSettings} `
        + `-preset ${inputs.encoder_speedpreset} -c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;
      response.infoLog += '==ALERT== OS detected as MAC - This will use VIDEOTOOLBOX to encode which is NOT QSV\n'
        + 'cmds set in extra_qsv_options will be IGNORED!\n';
      break;
    default:
      // Normal behavior
      response.preset += ` ${bitrateSettings} `
        + `-preset ${inputs.encoder_speedpreset} ${inputs.extra_qsv_options} `
        + `-c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments} ${metadataEncode}`;
  }

  response.processFile = true;
  response.infoLog += 'File Transcoding... \n';

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
