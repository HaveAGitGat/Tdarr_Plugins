// All credit for original plugin logic goes to Migz.
// This Plugin is essentially just his NVENC/CPU plugin modified to work with QSV & with extra hevc logic.
// Extra logic is mainly to control encoder quality/speed & to allow HEVC files to be reprocessed to reduce file size
// NOTE - This does not use VAAPI, it is QSV only. So newer intel igpus only. 8th+ gen should work.
function details() {
  return {
    id: 'Tdarr_Plugin_bsh1_Boosh_FFMPEG_QSV_HEVC',
    Stage: 'Pre-processing',
    Name: 'Boosh-Transcode using QSV GPU & FFMPEG',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `This is a QSV specific plugin, VAPPI is NOT used. So an INTEL QSV enabled CPU is required. 
    8th+ gen should work. Files not in H265/HEVC will be transcoded into H265/HEVC using Quick Sync Video (QSV) 
    via Intel GPU with ffmpeg. Settings are dependant on file bitrate working by the logic that H265 can support 
    the same ammount of data at half the bitrate of H264. This plugin will skip files already in HEVC, AV1 & VP9 
    unless "reconvert_hevc" is marked as true. If it is then these will be reconverted again into hevc if they 
    exceed the bitrate specified in "hevc_max_bitrate". Reminder! An INTEL QSV enabled CPU is required.`,
    Version: '1.0',
    Tags: 'pre-processing,ffmpeg,video only,qsv,h265,hevc,configurable',
    Inputs: [{
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
      tooltip: `Specifies the output container of the file
      \\n Ensure that all stream types you may have are supported by your chosen container.
      \\n MKV is recommended.
      \\nExample:\\n
      mkv
      \\nExample:\\n
      mp4`,
    },
    {
      name: 'encoder_speedpreset',
      type: 'string',
      defaultValue: 'slower',
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
      Slower options mean slower encode but better quality and faster have quicker encodes but worse quality.
      \\n Default is "slower". For almost best quality with slightly faster encode`,
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
      If this is enabled 10bit files will be processed and converted into 10bit 
      hevc using main10 profile and with p010le pixel format.`,
    },
    {
      name: 'bitrate_cutoff',
      tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be processed.
      \\n Rate is in kbps.
      \\n Leave empty to disable cutoff.
      \\nExample:\\n
      2500
      \\nExample:\\n
      1500`,
    },
    {
      name: 'max_average_bitrate',
      tooltip: `Specify a maximum average bitrate, when encoding we take the current bitrate and halve it 
      to get an average target. This option sets a upper limit to that average 
      (i.e if you have a video bitrate of 10000, half is 5000, if your maximum desired average bitrate is 4000
      then we use that as the target instead of 5000).
      \\n Rate is in kbps.
      \\n Leave empty to ignore.
      \\nExample:\\n
      4000
      \\nExample:\\n
      3000`,
    },
    {
      name: 'min_average_bitrate',
      tooltip: `Specify a minimum average bitrate, when encoding we take the current bitrate and halve it. 
      This option sets a lower limit to that average (i.e if you have a video bitrate of 3000, 
      half is 1500, if your minimum desired average bitrate is 2000 then we use that as the target instead of 1500).
      \\n Rate is in kbps.
      \\n Leave empty to ignore.
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
      tooltip: `Specify if we want to reprocess HEVC, vp9 or av1 files 
      (i.e reduce bitrate of files already in those codecs).NOT reccomeneded to use so leave blank if unsure. 
      NEEDS to be used in conjuntion with "bitrate_cutoff" otherwise is ignored.
      \\n Will allow files that are already HEVC, vp9 or av1 to be reprocessed
      \\n Useful in certain situations, perhaps you have a file which is HEVC 
      but extremely high bitrate and you'd like to reduce
      \\n\\n WARNING!! IF YOU HAVE VP9 OR AV1 FILES YOU WANT TO KEEP IN THOSE FORMATS THEN DO NOT USE THIS OPTION
      \\n
      \\nExample:\\n
      true
      \\nExample:\\n
      false`,
    },
    {
      name: 'hevc_max_bitrate',
      tooltip: `Specify a maximum allowed average bitrate for hevc or similar files. 
      This option is to be used if you want to ensure hevc files don't exceed a set bitrate.
      \\n Rate is in kbps.
      \\n If empty we will take the bitrate_cutoff and multiply x2 for a safe limit
      \\nExample:\\n
      4000
      \\nExample:\\n
      3000`,
    },
    ],
  };
}

function plugin(file, librarySettings, inputs) {
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  let duration = '';

  // Set up required variables.
  let videoIdx = 0;
  let extraArguments = '';
  let bitrateSettings = '';
  let inflatedCutoff = '';
  let currentBitrate = '';
  let targetBitrate = '';
  let minimumBitrate = '';
  let maximumBitrate = '';
  let main10 = '';

  // Check if inputs.container has been configured. If it hasn't then exit plugin.
  if (inputs.container === '') {
    response.infoLog += '☒ Plugin has not been configured, please configure required options. Skipping this plugin. \n';
    response.processFile = false;
    return response;
  }
  response.container = `.${inputs.container}`;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
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
  currentBitrate = Math.round((file.file_size / (duration * 0.0075)));
  // Use the same calculation used for currentBitrate but divide it in half to get targetBitrate.
  // Logic of h265 can be half the bitrate as h264 without losing quality.
  targetBitrate = Math.round((file.file_size / (duration * 0.0075) / 2));
  // Allow some leeway under and over the targetBitrate.
  minimumBitrate = Math.round((targetBitrate * 0.75));
  maximumBitrate = Math.round((targetBitrate * 1.25));

  response.infoLog += `☑ It looks like the current bitrate is ${currentBitrate}. \n`;

  // If targetBitrate or currentBitrate comes out as 0 then something
  // has gone wrong and bitrates could not be calculated.
  // Cancel plugin completely.
  if (targetBitrate <= 0 || currentBitrate <= 0) {
    response.processFile = false;
    response.infoLog += '☒ Target bitrate could not be calculated. Skipping this plugin. \n';
    return response;
  }

  if (inputs.reconvert_hevc === 'true' && inputs.bitrate_cutoff === '' && inputs.hevc_max_bitrate === '') {
    response.processFile = false;
    response.infoLog += `☒ Reconvert HEVC is ${inputs.reconvert_hevc}, however there is no bitrate cutoff 
    or hevc specific cutoff set so we have no way to know when to stop processing this file. 
    Either set reconvert_HEVC to false or set a bitrate cutoff and set a hevc_max_bitrate cutoff. 
    Skipping this plugin. \n`;
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff !== '') {
    // Checks if currentBitrate is below inputs.bitrate_cutoff.
    // If so then cancel plugin without touching original files.
    if (currentBitrate <= inputs.bitrate_cutoff) {
      response.processFile = false;
      response.infoLog += `☑ Current bitrate is below set cutoff of ${inputs.bitrate_cutoff}. Cancelling plugin. \n`;
      return response;
    }
    if (currentBitrate > inputs.bitrate_cutoff && inputs.reconvert_hevc === 'false') {
      response.infoLog += '☒ Current bitrate appears to be above the cutoff. Need to process \n';
    }
  }

  if (inputs.max_average_bitrate !== '') {
    // Checks if targetBitrate is above inputs.max_average_bitrate.
    // If so then clamp target bitrate
    if (targetBitrate > inputs.max_average_bitrate) {
      response.infoLog += `Our target bitrate is above the max_average_bitrate so 
      target average bitrate clamped at max of ${inputs.max_average_bitrate}. \n`;
      targetBitrate = Math.round(inputs.max_average_bitrate);
      minimumBitrate = Math.round((targetBitrate * 0.75));
      maximumBitrate = Math.round((targetBitrate * 1.25));
    }
  }

  // Check if inputs.min_average_bitrate has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.min_average_bitrate !== '') {
    // Checks if inputs.bitrate_cutof is below inputs.min_average_bitrate.
    // If so then set currentBitrate to the minimum allowed.)
    if (inputs.bitrate_cutoff < inputs.min_average_bitrate) {
      response.processFile = false;
      response.infoLog += `☒ Bitrate cutoff ${inputs.bitrate_cutoff} is less than the set minimum 
      average bitrate set of ${inputs.min_average_bitrate}. We don't want this. Cancelling plugin. \n`;
      return response;
    }
    if (targetBitrate < inputs.min_average_bitrate) {
      response.infoLog += `Target average bitrate clamped at min of ${inputs.min_average_bitrate}. \n`;
      targetBitrate = Math.round(inputs.min_average_bitrate);
      minimumBitrate = Math.round((targetBitrate * 0.75));
      maximumBitrate = Math.round((targetBitrate * 1.25));
    }
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
      // First check if we're reprocessing HEVC files, if not then we can ensure we don't convert HEVC again
      if (inputs.reconvert_hevc !== 'true' && (file.ffProbeData.streams[i].codec_name === 'hevc'
        || file.ffProbeData.streams[i].codec_name === 'vp9' || file.ffProbeData.streams[i].codec_name === 'av1')) {
        // Check if codec of stream is hevc vp9, or av1 AND check if file.container matches inputs.container.
        // If so nothing for plugin to do.
        if ((file.ffProbeData.streams[i].codec_name === 'hevc' || file.ffProbeData.streams[i].codec_name === 'vp9'
          || file.ffProbeData.streams[i].codec_name === 'av1') && file.container === inputs.container) {
          response.processFile = false;
          response.infoLog += `☑ File is already hevc or vp9 & in ${inputs.container}. \n`;
          return response;
        }
        // Check if codec of stream is hevc, vp9 or av1
        // AND check if file.container does NOT match inputs.container.
        // If so remux file.
        if ((file.ffProbeData.streams[i].codec_name === 'hevc' || file.ffProbeData.streams[i].codec_name === 'vp9'
          || file.ffProbeData.streams[i].codec_name === 'av1') && file.container !== inputs.container) {
          response.infoLog += `☒ File is hevc or vp9 but is not in ${inputs.container} container. Remuxing. \n`;
          response.preset = `, -map 0 -c copy ${extraArguments}`;
          response.processFile = true;
          return response;
        }
        // New logic for reprocessing HEVC. Mainly done for my own use. Since we're reprocessing we're checking
        // bitrate again and since this can be inaccurate (It calculates overall bitrate not video specific)
        // we have to inflate the current bitrate so we don't keep looping this logic.
      } else if (inputs.reconvert_hevc === 'true' && (file.ffProbeData.streams[i].codec_name === 'hevc'
        || file.ffProbeData.streams[i].codec_name === 'vp9' || file.ffProbeData.streams[i].codec_name === 'av1')) {
        // If we're using the hevc max bitrate then update the cutoff to use it
        if (inputs.hevc_max_bitrate !== '') {
          if (currentBitrate > inputs.hevc_max_bitrate) {
            inflatedCutoff = Math.round(inputs.bitrate_cutoff);
            response.infoLog += `☒ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already hevc, vp9 or av1. 
            Using hevc specific cutoff of ${inputs.hevc_max_bitrate}. 
            \n☒ The file is still above this new cutoff! Reconverting. \n`;
          } else {
            response.processFile = false;
            inflatedCutoff = Math.round(inputs.bitrate_cutoff);
            response.infoLog += `☑ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already hevc, vp9 or av1. 
            Using hevc specific cutoff of ${inputs.hevc_max_bitrate}. 
            \n☑ The file is NOT above this new cutoff. Exiting plugin. \n`;
            return response;
          }
          // If we're not using the hevc max bitrate then we need a safety net
          // to try and ensure we don't keep looping this plugin.
        } else if (currentBitrate > (inputs.bitrate_cutoff * 2)) {
          inflatedCutoff = Math.round((inputs.bitrate_cutoff * 2));
          response.infoLog += `☒ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already hevc, vp9 or av1. 
          hevc specific cutoff not set so bitrate_cutoff is multiplied by 2 for safety! 
          Cutoff now temporarily ${inflatedCutoff}. \n The file is still above this new cutoff! Reconverting. \n\n`;
        } else {
          response.processFile = false;
          inflatedCutoff = Math.round((inputs.bitrate_cutoff * 2));
          response.infoLog += `☑ Reconvert_hevc is ${inputs.reconvert_hevc} & the file is already hevc, vp9 or av1 
          so bitrate_cutoff is multiplied by 2! Cutoff now temporarily ${inflatedCutoff}. 
          \n The file is NOT above this new cutoff. Exiting plugin. \n\n`;
          return response;
        }
      }
    }

    // Are we encoding 10 bit files?
    if (inputs.enable_10bit === 'true') {
      // Check if video stream is 10bit. Currently set profile main10 and pixel format.
      // Still need to test if this really works correctly
      if (file.ffProbeData.streams[i].profile === 'High 10'
        || file.ffProbeData.streams[i].bits_per_raw_sample === '10') {
        main10 = '-profile:v main10 -pix_fmt p010le';
        response.infoLog += '☑ File is 10bit or HDR. Setting Main10 Profile & pixel format \n\n';
      }
    }

    // Increment videoIdx.
    videoIdx += 1;
  }

  // Set bitrateSettings variable using bitrate information calulcated earlier.
  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k `
    + `-maxrate ${maximumBitrate}k -bufsize ${currentBitrate}k`;
  // Print to infoLog information around file & bitrate settings.
  response.infoLog += `\nContainer for output selected as ${inputs.container}. \n`;
  response.infoLog += `The current file bitrate = ${currentBitrate} \n`;
  response.infoLog += 'Bitrate settings: \n';
  response.infoLog += `Target = ${targetBitrate} \n`;
  response.infoLog += `Minimum = ${minimumBitrate} \n`;
  response.infoLog += `Maximum = ${maximumBitrate} \n`;

  // Codec will be checked so it can be transcoded correctly
  // (QSV doesn't support HW decode of all older codecs, h263 & mpeg1 are SW based currently)
  // If 10 bit is being used then don't hardware decode, this can cause issues.
  // Best just to cpu decode to ensure it works.
  if (main10 === '') {
    if (file.video_codec_name === 'h263') {
      response.preset = '-hwaccel qsv -c:v h263';
    } else if (file.video_codec_name === 'h264') {
      response.preset = '-hwaccel qsv -c:v h264_qsv';
    } else if (file.video_codec_name === 'mjpeg') {
      response.preset = '-hwaccel qsv -c:v mjpeg_qsv';
    } else if (file.video_codec_name === 'hevc') {
      response.preset = '-hwaccel qsv -c:v hevc_qsv';
    } else if (file.video_codec_name === 'mpeg1') {
      response.preset = '-hwaccel qsv -c:v mpeg1';
    } else if (file.video_codec_name === 'mpeg2') {
      response.preset = '-hwaccel qsv -c:v mpeg2_qsv';
    } else if (file.video_codec_name === 'vc1') {
      response.preset = '-hwaccel qsv -c:v vc1_qsv';
    } else if (file.video_codec_name === 'vp8') {
      response.preset = '-hwaccel qsv -c:v vp8_qsv';
    } else if (file.video_codec_name === 'av1') {
      response.preset = '-hwaccel qsv -c:v av1';
    }
  }

  response.preset += `,-map 0 -c:v hevc_qsv ${bitrateSettings} `
    + `-preset ${inputs.encoder_speedpreset} -look_ahead 1 ${main10} 
    -c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;
  // Other settings to consider.
  // -b_strategy 1 -adaptive_b 1 -adaptive_i 1 -async_depth 1 -look_ahead 1 -look_ahead_depth 100
  response.processFile = true;
  response.infoLog += 'File Transcoding. \n';
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
