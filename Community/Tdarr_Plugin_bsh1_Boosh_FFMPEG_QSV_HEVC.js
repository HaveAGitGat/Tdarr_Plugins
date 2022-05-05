// All credit for original plugin logic goes to Migz.
// This Plugin is essentially just his NVENC/CPU plugin modified to work with QSV & with extra hevc logic.
// Extra logic is mainly to control encoder quality/speed & to allow HEVC files to be reprocessed to reduce file size
// NOTE - This does not use VAAPI, it is QSV only. So newer intel iGPUs only. 8th+ gen should work.
// Extra Note - This was designed and tested on UNRAID via docker. There is logic to enable use on Windows & Mac
// however it is untested...
// White paper from intel regarding QSV performance on linux using FFMPEG here:
// eslint-disable-next-line max-len
// https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/cloud-computing-quicksync-video-ffmpeg-white-paper.pdf

const details = () => ({
  id: 'Tdarr_Plugin_bsh1_Boosh_FFMPEG_QSV_HEVC',
  Stage: 'Pre-processing',
  Name: 'Boosh-Transcode using QSV GPU & FFMPEG',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `This is a QSV specific plugin, VAAPI is NOT used. So an INTEL QSV enabled CPU is required. 
    8th+ gen CPUs should work. Files not in H265/HEVC will be transcoded into H265/HEVC using Quick Sync Video (QSV) 
    via Intel GPU with ffmpeg. Settings are dependant on file bitrate working by the logic that H265 can support 
    the same amount of data at half the bitrate of H264. This plugin will skip files already in HEVC, AV1 & VP9 
    unless "reconvert_hevc" is marked as true. If it is then these will be reconverted again into HEVC if they 
    exceed the bitrate specified in "hevc_max_bitrate". Reminder! An INTEL QSV enabled CPU is required.
    NOTE - Created with Linux/UNRAID in mind so may not be fully compatible with Windows/Mac etc.`,
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,video only,qsv,h265,hevc,configurable',
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
      tooltip: `Specifies the output container of the file.
      \\n Ensure that all stream types you may have are supported by your chosen container.
      \\n Only MP4 & MKV are supported and MKV is recommended.
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
      tooltip: `Make the file conform to output containers requirements.
      Use if you need to ensure the encode works from mp4>mkv or mkv>mp4.
      WARNING! This will remove data of certain types so ensure you are happy with that,
      or use another plugin to convert these data types first!
                  \\n Drop hdmv_pgs_subtitle/eia_608/subrip/timed_id3 for MP4.
                  \\n Drop data streams/mov_text/eia_608/timed_id3 for MKV.
                  \\n Default is false.
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
      tooltip: `Specify the encoder speed/preset to use. 
      Slower options mean a slower encode but better quality and faster options mean faster encodes but 
      worse quality.
      \\n For more information see intel white paper on ffmpeg results using qsv: \\n`
        // eslint-disable-next-line max-len
        + `https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/cloud-computing-quicksync-video-ffmpeg-white-paper.pdf
      \\n Default is "slow". 
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
      tooltip: `Add extra options to the ffmpeg QSV ENCODE cmd. There are extra qsv options that can be
      forced on/off as desired. See here for some possible cmds - 
      https://ffmpeg.org/ffmpeg-codecs.html#toc-HEVC-Options-1
      \\n
      WARNING! - Just because a cmd is mentioned doesn't mean your installed version of ffmpeg supports it... 
      Be certain to verify the cmds work before adding to your workflow. \\n
      Check Tdarr Help Tab. Enter ffmpeg cmd - "-h encoder=hevc_qsv". This will give a list of supported commands
      \\n
      \\n Default is empty but a suggested value is below. If unsure just leave empty.
      \\nExample:\\n
      -extbrc 1 -rdo 1 -mbbrc 1 -b_strategy 1 -adaptive_i 1 -adaptive_b 1`,
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
      tooltip: `Specify if we want to enable 10bit encoding. 
      \\n If this is enabled files will be processed and converted into 10bit 
      HEVC using main10 profile and with p010le pixel format. \n
      If you just want to retain files that are already 10 bit then this can be left as false, as 
      10bit to 10bit in ffmpeg should be automatic.
      \\n Default is "false". 
      \\nExample:\\n
      true
      \\nExample:\\n
      false`,
    },
    {
      name: 'bitrate_cutoff',
      type: 'number',
      defaultValue: 0,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify bitrate cutoff, files with a total bitrate lower then this will not be processed.
      Since getting the bitrate of the video from files is unreliable, bitrate here refers to the total 
      bitrate of the file and not just the video steam.
      \\n Rate is in kbps.
      \\n Defaults to 0 which means this is disabled.
      \\n Enter a valid number to enable.
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
      tooltip: `Specify a maximum average video bitrate. When encoding we take the current total bitrate and halve it 
      to get an average target. This option sets a upper limit to that average 
      (i.e if you have a video bitrate of 10000, half is 5000, if your maximum desired average bitrate is 4000
      then we use that as the target instead of 5000).
      \\n Bitrate here is referring to video bitrate as we want to set the video bitrate on encode.
      \\n Rate is in kbps.
      \\n Defaults to 0 which means this is disabled.
      \\n Enter a valid number to enable.
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
      tooltip: `Specify a minimum average video bitrate. When encoding we take the current total bitrate and halve 
      it to get an average target. This option sets a lower limit to that average (i.e if you have a video bitrate
      of 3000, half is 1500, if your minimum desired average bitrate is 2000 then we use that as the target instead
      of 1500).
      \\nBitrate here is referring to video bitrate as we want to set the video bitrate on encode.
      \\n Rate is in kbps.
      \\n Defaults to 0 which means this is disabled.
      \\n Enter a valid number to enable.
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
      tooltip: `Specify if we want to reprocess HEVC, VP9 or AV1 files 
      (i.e reduce bitrate of files already in those codecs). 
      \\n Since this uses the same logic as normal, halving the current bitrate, this is NOT recommended 
      unless you know what you are doing, so leave false if unsure. 
      NEEDS to be used in conjunction with "bitrate_cutoff" or "hevc_max_bitrate" otherwise is ignored.
      This is useful in certain situations, perhaps you have a file which is HEVC but has an extremely high
      bitrate and you'd like to reduce it.
      \\n Bare in mind that you can convert a file to HEVC and still be above your cutoff meaning it would 
      be converted again if this is set to true (since it's now HEVC). So if you use this be sure to set
      "hevc_max_bitrate" & "max_average_bitrate" to prevent the plugin looping. Also it is highly suggested 
      that you have your "hevc_max_bitrate" higher than "max_average_bitrate".
      \\n Again if you are unsure, please leave this as false!
      \\n\\n WARNING!! IF YOU HAVE VP9 OR AV1 FILES YOU WANT TO KEEP IN THOSE FORMATS THEN DO NOT USE THIS OPTION.
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
      tooltip: `Has no effect unless "reconvert_hevc" is set to true. This allows you to specify a maximum
      allowed average bitrate for HEVC or similar files. Much like the "bitrate_cutoff" option, but
      specifically for HEVC files. It should be set HIGHER then your standard cutoff for safety.
      \\n Also, it's highly suggested you use the min & max average bitrate options in combination with this. You
      will want those to control the bitrate otherwise you may end up repeatedly reprocessing HEVC files.
      i.e your file might have a bitrate of 20000, if your hevc cutoff is 5000 then it's going to reconvert 
      multiple times before it'll fall below that cutoff. While HEVC reprocessing can be useful
      this is why it is NOT recommended!
      \\n As with the cutoff, getting the bitrate of the video from files is unreliable, so bitrate
      here refers to the total bitrate of the file and not just the video steam.
      \\n Rate is in kbps.
      \\n Defaults to 0 which means this is disabled.
      \\n Enter a valid number to enable, otherwise we use "bitrate_cutoff" and multiply x2 for a safe limit.
      \\nExample:\\n
      4000
      \\nExample:\\n
      3000`,
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')(); const os = require('os');
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

  // Set up required variables.
  let duration = 0;
  let videoIdx = 0;
  let extraArguments = '';
  let bitrateSettings = '';
  let inflatedCutoff = 0;
  let main10 = false;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.infoLog += 'File is not a video. \n';
    return response;
  }

  // Check if duration info is filled, if so times it by 0.0166667 to get time in minutes.
  // If not filled then get duration of stream 0 and do the same.
  if (typeof file.meta.Duration !== 'undefined') {
    duration = file.meta.Duration * 0.0166667;
  } else {
    duration = file.ffProbeData.streams[0].duration * 0.0166667;
  }

  // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)"
  // Used from here https://blog.frame.io/2017/03/06/calculate-video-bitrates/
  const currentBitrate = Math.round(file.file_size / (duration * 0.0075));
  // Use the same calculation used for currentBitrate but divide it in half to get targetBitrate.
  // Logic of h265 can be half the bitrate as h264 without losing quality.
  let targetBitrate = Math.round((file.file_size / (duration * 0.0075)) / 2);
  // Allow some leeway under and over the targetBitrate.
  let minimumBitrate = Math.round(targetBitrate * 0.75);
  let maximumBitrate = Math.round(targetBitrate * 1.25);

  response.infoLog += `☑ It looks like the current bitrate is ${currentBitrate}k. \n`;

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
    response.infoLog += `☒ Target bitrate has been calculated as ${targetBitrate}k. This is equal or greater
    than the current bitrate... Something has gone wrong and this shouldn't happen! Skipping this plugin. \n`;
    return response;
  }

  // Ensure that bitrate_cutoff is set if reconvert_hevc is true since we need some protection against a loop
  // Cancel the plugin
  if (inputs.reconvert_hevc === true && inputs.bitrate_cutoff <= 0 && inputs.hevc_max_bitrate <= 0) {
    response.infoLog += `☒ Reconvert HEVC is ${inputs.reconvert_hevc}, however there is no bitrate cutoff 
    or HEVC specific cutoff set so we have no way to know when to stop processing this file. 
    Either set reconvert_HEVC to false or set a bitrate cutoff and set a hevc_max_bitrate cutoff. 
    Skipping this plugin. \n`;
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff > 0) {
    // Checks if currentBitrate is below inputs.bitrate_cutoff.
    // If so then cancel plugin without touching original files.
    if (currentBitrate <= inputs.bitrate_cutoff) {
      response.infoLog += `☑ Current bitrate is below set cutoff of ${inputs.bitrate_cutoff}k. Cancelling plugin. \n`;
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
      response.infoLog += `Our target bitrate is above the max_average_bitrate so 
      target average bitrate clamped at max of ${inputs.max_average_bitrate}k. \n`;
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
      average bitrate set of ${inputs.min_average_bitrate}k. We don't want this. Cancelling plugin. \n`;
      return response;
    }
    // Checks if inputs.bitrate_cutoff is below inputs.min_average_bitrate.
    // If so then set currentBitrate to the minimum allowed.)
    if (targetBitrate < inputs.min_average_bitrate) {
      response.infoLog += `Target average bitrate clamped at min of ${inputs.min_average_bitrate}k. \n`;
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
        response.infoLog += `☒ This looks to be a HDR file. HDR files are unfortunately
        not supported by this plugin. Exiting plugin. \n\n`;
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

        // New logic for reprocessing HEVC. Mainly done for my own use. Since we're reprocessing we're checking
        // bitrate again and since this can be inaccurate (It calculates overall bitrate not video specific)
        // we have to inflate the current bitrate so we don't keep looping this logic.
      } else if (inputs.reconvert_hevc === true && (file.ffProbeData.streams[i].codec_name === 'hevc'
        || file.ffProbeData.streams[i].codec_name === 'vp9' || file.ffProbeData.streams[i].codec_name === 'av1')) {
        // If we're using the hevc max bitrate then update the cutoff to use it

        if (inputs.hevc_max_bitrate > 0) {
          if (currentBitrate > inputs.hevc_max_bitrate) {
            // If bitrate is higher then hevc_max_bitrate then need to re-encode
            response.infoLog += `☒ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, VP9 or AV1. 
            Using HEVC specific cutoff of ${inputs.hevc_max_bitrate}k. \n
            ☒ The file is still above this new cutoff! Reconverting. \n\n`;
          } else {
            // Otherwise we're now below the hevc cutoff and we can exit
            response.infoLog += `☑ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, VP9 or AV1. 
            Using HEVC specific cutoff of ${inputs.hevc_max_bitrate}k. \n
            ☑ The file is NOT above this new cutoff. Exiting plugin. \n\n`;
            return response;
          }

          // If we're not using the hevc max bitrate then we need a safety net to try and ensure we don't keep
          // looping this plugin. For maximum safety we simply multiply the cutoff by 2.
        } else if (currentBitrate > (inputs.bitrate_cutoff * 2)) {
          inflatedCutoff = Math.round(inputs.bitrate_cutoff * 2);
          response.infoLog += `☒ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, VP9 or AV1. 
          HEVC specific cutoff not set so bitrate_cutoff is multiplied by 2 for safety! 
          Cutoff now temporarily ${inflatedCutoff}k. \n The file is still above this new cutoff! Reconverting. \n\n`;
        } else {
          // File is below cutoff so we can exit
          inflatedCutoff = Math.round(inputs.bitrate_cutoff * 2);
          response.infoLog += `☑ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already HEVC, VP9 or AV1 
          so bitrate_cutoff is multiplied by 2! Cutoff now temporarily ${inflatedCutoff}k. \n
          The file is NOT above this new cutoff. Exiting plugin. \n\n`;
          return response;
        }
      }

      // If files are already 10bit then disable hardware decode to avoid problems with encode
      // 10 bit from source file should be retained without extra arguments.
      if (file.ffProbeData.streams[i].profile === 'High 10'
        || file.ffProbeData.streams[i].profile === 'Main 10'
        || file.ffProbeData.streams[i].bits_per_raw_sample === '10') {
        main10 = true;
        response.infoLog += 'Input file is 10bit. Disabling hardware decoding to avoid problems. \n\n';
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
  response.infoLog += `\nContainer for output selected as ${inputs.container}. \n`;
  response.infoLog += 'Encode variable bitrate settings: \n';
  response.infoLog += `Target = ${targetBitrate}k \n`;
  response.infoLog += `Minimum = ${minimumBitrate}k \n`;
  response.infoLog += `Maximum = ${maximumBitrate}k \n`;

  // START PRESET
  // DECODE FLAGS
  // -fflags +genpts should regenerate timestamps if they end up missing...
  response.preset = '-fflags +genpts ';

  // Attempt to enable HW Decoding...
  // If source file is 10 bit then bail as this can cause issues. Believe it's the -c:v option that breaks during 10bit
  if (main10 === false) {
    // Currently supported HW decode types
    switch (file.video_codec_name) {
      case 'mpeg2':
        response.preset += '-hwaccel qsv -c:v mpeg2_qsv';
        break;
      case 'h264':
        response.preset += '-hwaccel qsv -c:v h264_qsv';
        break;
      case 'vc1':
        response.preset += '-hwaccel qsv -c:v vc1_qsv';
        break;
      case 'mjpeg':
        response.preset += '-hwaccel qsv -c:v mjpeg_qsv';
        break;
      case 'vp8':
        response.preset += '-hwaccel qsv -c:v vp8_qsv';
        break;
      case 'hevc':
        response.preset += '-hwaccel qsv -c:v hevc_qsv';
        break;
      case 'vp9': // Should be supported by 8th Gen +
        response.preset += '-hwaccel qsv -c:v vp9_qsv';
        break;
      default:
        response.preset += '-hwaccel qsv';
    }
  } else {
    response.preset += '-hwaccel qsv';
    // Enable basic hwaccel regardless. Seems to work...
  }

  // ADD ENCODE FLAGS TO PRESET
  response.preset += '<io> -map 0 -c:v ';

  // Account for different OS setup for QSV.
  // FYI Darwin is Mac OS
  switch (os.platform()) {
    case 'darwin':
      response.preset += 'hevc_qsv';
      // Using default for now but is here in case it needs something specific.
      // hevc_videotoolbox seems to be a Mac cmd to use but that doesn't seem to be included in Jellyfin ffmpeg...
      break;
    case 'linux':
      response.preset += 'hevc_qsv';
      break;
    case 'win32':
      response.preset += 'hevc_qsv -load_plugin hevc_hw';
      // Windows seems to need the plugin cmd as well. Tested working on a Win 10 - i3-10105
      break;
    default:
      response.preset += 'hevc_qsv';
  }

  response.preset += ` ${bitrateSettings} `
    + `-preset ${inputs.encoder_speedpreset} ${inputs.extra_qsv_options} 
     -c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;

  response.processFile = true;
  response.infoLog += 'File Transcoding... \n';

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
