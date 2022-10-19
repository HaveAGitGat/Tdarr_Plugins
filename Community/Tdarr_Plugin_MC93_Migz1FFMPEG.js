/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz1FFMPEG',
  Stage: 'Pre-processing',
  Name: 'Migz-Transcode Using Nvidia GPU & FFMPEG',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Files not in H265 will be transcoded into H265 using Nvidia GPU with ffmpeg.
                  Settings are dependant on file bitrate
                  Working by the logic that H265 can support the same ammount of data at half the bitrate of H264.
                  NVDEC & NVENC compatable GPU required.
                  This plugin will skip any files that are in the VP9 codec.
                  This Plugin makes use of "nvidia-smi" if it is accessible from the node.
                  Measures GPU utilization from nvidia-smi and assigns task to GPU with least GPU utilization.`,
  Version: '3.2',
  Tags: 'pre-processing,ffmpeg,video only,nvenc h265,configurable,NVIDIA,GPU,multiple GPUs',
  Inputs: [{
    name: 'container',
    type: 'string',
    defaultValue: 'mkv',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify output container of file
                \\n Ensure that all stream types you may have are supported by your chosen container.
                \\n mkv is recommended.
                    \\nExample:\\n
                    mkv

                    \\nExample:\\n
                    mp4`,
  },
  {
    name: 'exclude_gpus',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify the names of any GPUs that needs to be excluded from assigning transcoding tasks.
               \\n Rate is in kbps.
               \\n Leave empty to disable.
                    \\nExample:\\n
                    6000

                    \\nExample:\\n
                    4000`,
  },
  {
    name: 'bitrate_cutoff',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded.
               \\n Rate is in kbps.
               \\n Leave empty to disable.
                    \\nExample:\\n
                    6000

                    \\nExample:\\n
                    4000`,
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
    tooltip: `Specify if output file should be 10bit. Default is false.
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
  },
  {
    name: 'enable_bframes',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if b frames should be used.
                 \\n Using B frames should decrease file sizes but are only supported on newer GPUs.
                 \\n Default is false.
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
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
                \\n Drop hdmv_pgs_subtitle/eia_608/subrip/timed_id3 for MP4.
                \\n Drop data streams/mov_text/eia_608/timed_id3 for MKV.
                \\n Default is false.
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
  },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  const execSync = require('child_process').execSync;
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  let duration = '';

  // Check if inputs.container has been configured. If it hasn't then exit plugin.
  if (inputs.container === '') {
    response.infoLog += 'Plugin has not been configured, please configure required options. Skipping this plugin. \n';
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

  // Set up required variables.
  let videoIdx = 0;
  let CPU10 = false;
  let extraArguments = '';
  let genpts = '';
  let bitrateSettings = '';
  // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)"
  // Used from here https://blog.frame.io/2017/03/06/calculate-video-bitrates/
  // eslint-disable-next-line no-bitwise
  const currentBitrate = ~~(file.file_size / (duration * 0.0075));
  // Use the same calculation used for currentBitrate but divide it in half to get targetBitrate.
  // Logic of h265 can be half the bitrate as h264 without losing quality.
  // eslint-disable-next-line no-bitwise
  const targetBitrate = ~~(file.file_size / (duration * 0.0075) / 2);
  // Allow some leeway under and over the targetBitrate.
  // eslint-disable-next-line no-bitwise
  const minimumBitrate = ~~(targetBitrate * 0.7);
  // eslint-disable-next-line no-bitwise
  const maximumBitrate = ~~(targetBitrate * 1.3);

  // If Container .ts or .avi set genpts to fix unknown timestamp
  if (inputs.container.toLowerCase() === 'ts' || inputs.container.toLowerCase() === 'avi') {
    genpts = '-fflags +genpts';
  }

  // If targetBitrate comes out as 0 then something has gone wrong and bitrates could not be calculated.
  // Cancel plugin completely.
  if (targetBitrate === 0) {
    response.processFile = false;
    response.infoLog += 'Target bitrate could not be calculated. Skipping this plugin. \n';
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff !== '') {
    // Checks if currentBitrate is below inputs.bitrate_cutoff.
    // If so then cancel plugin without touching original files.
    if (currentBitrate <= inputs.bitrate_cutoff) {
      response.processFile = false;
      response.infoLog += `Current bitrate is below set cutoff of ${inputs.bitrate_cutoff}. Cancelling plugin. \n`;
      return response;
    }
  }

  // Check if force_conform option is checked.
  // If so then check streams and add any extra parameters required to make file conform with output format.
  if (inputs.force_conform === true) {
    if (inputs.container.toLowerCase() === 'mkv') {
      extraArguments += '-map -0:d ';
      for (let i = 0; i < file.ffProbeData.streams.length; i++) {
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
      for (let i = 0; i < file.ffProbeData.streams.length; i++) {
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

  // Check if 10bit variable is true.
  if (inputs.enable_10bit === true) {
    // If set to true then add 10bit argument
    extraArguments += '-pix_fmt p010le ';
  }

  // Check if b frame variable is true.
  if (inputs.enable_bframes === true) {
    // If set to true then add b frames argument
    extraArguments += '-bf 5 ';
  }

  // Go through each stream in the file.
  var vf_scale_args = '';
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is a video.
    let codec_type = '';
    try {
      codec_type = file.ffProbeData.streams[i].codec_type.toLowerCase();
    } catch (err) {
      // err
    }
    if (codec_type === 'video') {
      // Check if codec of stream is mjpeg/png, if so then remove this "video" stream.
      // mjpeg/png are usually embedded pictures that can cause havoc with plugins.
      if (file.ffProbeData.streams[i].codec_name === 'mjpeg' || file.ffProbeData.streams[i].codec_name === 'png') {
        extraArguments += `-map -0:v:${videoIdx} `;
        response.infoLog += `File has an image in it as stream: ${i}, removing it! \n`;
      } else { // if not an image stream then read it's height and width
        try {
          vf_scale_args = `-vf 'scale_cuda=w=${file.ffProbeData.streams[i].width}:h=${file.ffProbeData.streams[i].height}'`
          response.infoLog += `Video Dimensions read as Width: ${file.ffProbeData.streams[i].width} Height: ${file.ffProbeData.streams[i].height} \n`;
        } catch (error) {
          response.infoLog += `Error while reading video height and width for stream: ${i}\n`;
          response.infoLog += `Error: ${error}`;
        }
      }
      
      // Check if codec of stream is hevc or vp9 AND check if file.container matches inputs.container.
      // If so nothing for plugin to do.
      if (
        (
          file.ffProbeData.streams[i].codec_name === 'hevc'
          || file.ffProbeData.streams[i].codec_name === 'vp9'
        )
                && file.container === inputs.container
      ) {
        response.processFile = false;
        response.infoLog += `File is already hevc or vp9 & in ${inputs.container}. \n`;
        return response;
      }
      // Check if codec of stream is hevc or vp9
      // AND check if file.container does NOT match inputs.container.
      // If so remux file.
      if (
        (
          file.ffProbeData.streams[i].codec_name === 'hevc'
           || file.ffProbeData.streams[i].codec_name === 'vp9'
        )
                && file.container !== inputs.container
      ) {
        response.infoLog += `File is hevc or vp9 but is not in ${inputs.container} container. Remuxing. \n`;
        response.preset = `, -map 0 -c copy ${extraArguments}`;
        response.processFile = true;
        return response;
      }

      // Check if video stream is HDR or 10bit
      if (
        file.ffProbeData.streams[i].profile === 'High 10'
            || file.ffProbeData.streams[i].bits_per_raw_sample === '10'
      ) {
        CPU10 = true;
      }

      // Increment videoIdx.
      videoIdx += 1;
    }
  }

  // Set bitrateSettings variable using bitrate information calulcated earlier.
  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k `
  + `-maxrate ${maximumBitrate}k -bufsize ${currentBitrate}k`;
  // Print to infoLog information around file & bitrate settings.
  response.infoLog += `Container for output selected as ${inputs.container}. \n`;
  response.infoLog += `Current bitrate = ${currentBitrate} \n`;
  response.infoLog += 'Bitrate settings: \n';
  response.infoLog += `Target = ${targetBitrate} \n`;
  response.infoLog += `Minimum = ${minimumBitrate} \n`;
  response.infoLog += `Maximum = ${maximumBitrate} \n`;

  // Codec will be checked so it can be transcoded correctly
  if (file.video_codec_name === 'h263') {
    response.preset = '-c:v h263_cuvid';
  } else if (file.video_codec_name === 'h264') {
    if (CPU10 === false) {
      response.preset = '-c:v h264_cuvid';
    }
  } else if (file.video_codec_name === 'mjpeg') {
    response.preset = '-c:v mjpeg_cuvid';
  } else if (file.video_codec_name === 'mpeg1') {
    response.preset = '-c:v mpeg1_cuvid';
  } else if (file.video_codec_name === 'mpeg2') {
    response.preset = '-c:v mpeg2_cuvid';
  } else if (file.video_codec_name === 'mpeg4') {
    response.preset = '-c:v mpeg4_cuvid';
  } else if (file.video_codec_name === 'vc1') {
    response.preset = '-c:v vc1_cuvid';
  } else if (file.video_codec_name === 'vp8') {
    response.preset = '-c:v vp8_cuvid';
  }

  // Determine if GPU is present and which gpu to use based on utilization of each GPU
  response.infoLog += 'Running nvidia-smi to see if a GPU is available and selecting the GPU with less utilization\n';
  let gpu_num = -1;
  let gpu_util = 100000;
  let result_util = 0;
  let gpu_count = '';
  try {
    let gpu_res = execSync('nvidia-smi --query-gpu=name --format=csv,noheader');
    gpu_res = gpu_res.toString().trim();
    gpu_res = gpu_res.split(/\r?\n/);
    /* When nvidia-smi returns an error it contains 'nvidia-smi' in the error
      Example: Linux: nvidia-smi: command not found
               Windows: 'nvidia-smi' is not recognized as an internal or external command, 
                   operable program or batch file. */
    if (!gpu_res[0].includes('nvidia-smi')) {
      gpu_count = gpu_res.length;
    } else {
      gpu_count = -1;
    }
  } catch (error) {
    response.infoLog += 'Error in reading nvidia-smi output!\n';
    response.infoLog += error.message;
    gpu_count = -1;
  }
  if (gpu_count > 0) {
    for (let gpui = 0; gpui < gpu_count; gpui++) {
      result_util = parseInt(execSync(
        `nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits -i ${gpui}`), 10);
      if (!Number.isNaN(result_util)) { // != "No devices were found") {
        response.infoLog += `GPU ${gpui} : Utilization ${result_util}%\n`;
        if (result_util < gpu_util) {
          gpu_num = gpui;
          gpu_util = result_util;
        }
      } else {
        result_util = execSync(`nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits -i ${gpui}`);
        response.infoLog += `Error in reading GPU ${gpui} Utilization\nError: ${result_util}\n`;
      }
    }
  }
  let gpu_string_arg = '';
  if (gpu_num >= 0) {
    gpu_string_arg = ` -gpu ${gpu_num}`;
    response.infoLog += `Selecting GPU ${gpu_num} with ${gpu_util}% utilization (lowest)\n`;
    response.preset = `-hwaccel cuvid -hwaccel_device ${gpu_num} -hwaccel_output_format cuda `;
    response.preset += `${genpts}, -map 0 ${vf_scale_args} `;
    response.preset += ` -c:V hevc_nvenc -gpu ${gpu_num} -cq:V 19 ${bitrateSettings} `;
  } else {
    response.preset += ` ${genpts}, -map 0 -c:V hevc_nvenc -cq:V 19 ${bitrateSettings} `;
  }
  response.preset += `-spatial_aq:V 1 -rc-lookahead:V 32 -c:a copy -c:s copy `;
  response.preset += `-max_muxing_queue_size 9999 ${extraArguments}`;
  response.processFile = true;
  response.infoLog += 'File is not hevc or vp9. Transcoding. \n';
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
