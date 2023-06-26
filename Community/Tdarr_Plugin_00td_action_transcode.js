/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_00td_action_transcode',
  Stage: 'Pre-processing',
  Name: 'Transcode a video file',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Transcode a video file using ffmpeg. GPU transcoding will be used if possible.',
  Version: '3.1',
  Tags: 'pre-processing,ffmpeg,video only,nvenc h265,configurable',
  Inputs: [
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify output container of file. Use 'original' wihout quotes to keep original container.
                  \\n Ensure that all stream types you may have are supported by your chosen container.
                  \\n mkv is recommended.
                      \\nExample:\\n
                      mkv
  
                      \\nExample:\\n
                      mp4
                      
                      \\nExample:\\n
                      original`,
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

    {
      name: 'encoder',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc',
          'vp9',
          'h264',
          'vp8',
        ],
      },
      tooltip: 'Specify the codec to use',
    },
    {
      name: 'use_gpu',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'If enabled then will use GPU if possible.',
    },
  ],
});

const hasEncoder = async ({
  ffmpegPath,
  encoder,
}) => {
  const { exec } = require('child_process');
  let res = false;
  try {
    res = await new Promise((resolve) => {
      exec(`${ffmpegPath} -f lavfi -i color=c=black:s=256x256:d=1:r=30 -c:v ${encoder} -f null /dev/null`, (
        error,
        // stdout,
        // stderr
      ) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }

  return res;
};

const getEncoder = async ({
  inputs,
  otherArguments,
}) => {
  let { encoder } = inputs;
  if (inputs.use_gpu
    && (inputs.encoder === 'hevc' || inputs.encoder === 'h264')) {
    const gpuEncoders = [
      {
        encoder: 'hevc_nvenc',
        enabled: false,
      },
      {
        encoder: 'hevc_amf',
        enabled: false,
      },
      {
        encoder: 'hevc_qsv',
        enabled: false,
      },
      {
        encoder: 'hevc_videotoolbox',
        enabled: false,
      },

      {
        encoder: 'h264_nvenc',
        enabled: false,
      },
      {
        encoder: 'h264_amf',
        enabled: false,
      },
      {
        encoder: 'h264_qsv',
        enabled: false,
      },
      {
        encoder: 'h264_videotoolbox',
        enabled: false,
      },
    ];

    const filteredGpuEncoders = gpuEncoders.filter((device) => device.encoder.includes(inputs.encoder));

    // eslint-disable-next-line no-restricted-syntax
    for (const device of filteredGpuEncoders) {
      // eslint-disable-next-line no-await-in-loop
      device.enabled = await hasEncoder({
        ffmpegPath: otherArguments.ffmpegPath,
        encoder: device.encoder,
      });
    }

    const enabledDevices = gpuEncoders.filter((device) => device.enabled === true);

    if (enabledDevices.length > 0) {
      encoder = enabledDevices[0].encoder;
    }
  }

  return encoder;
};

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
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

  const encoder = await getEncoder({
    inputs,
    otherArguments,
  });

  let duration = '';

  // Check if inputs.container has been configured. If it hasn't then exit plugin.
  if (inputs.container === '') {
    response.infoLog += 'Plugin has not been configured, please configure required options. Skipping this plugin. \n';
    response.processFile = false;
    return response;
  }

  if (inputs.container === 'original') {
    // eslint-disable-next-line no-param-reassign
    inputs.container = `${file.container}`;
    response.container = `.${file.container}`;
  } else {
    response.container = `.${inputs.container}`;
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. \n';
    return response;
  }

  // Check if duration info is filled, if so times it by 0.0166667 to get time in minutes.
  // If not filled then get duration of stream 0 and do the same.
  if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
    duration = parseFloat(file.ffProbeData?.format?.duration) * 0.0166667;
  } else if (typeof file.meta.Duration !== 'undefined') {
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
  if (encoder === 'hevc_nvenc' && inputs.enable_bframes === true) {
    // If set to true then add b frames argument
    extraArguments += '-bf 5 ';
  }

  // Go through each stream in the file.
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
        extraArguments += `-map -v:${videoIdx} `;
      }
      // Check if codec of stream is hevc or vp9 AND check if file.container matches inputs.container.
      // If so nothing for plugin to do.
      if (
        (
          inputs.encoder === file.ffProbeData.streams[i].codec_name
        )
        && file.container === inputs.container
      ) {
        response.processFile = false;
        response.infoLog += `File is already ${inputs.encoder} & in ${inputs.container}. \n`;
        return response;
      }
      // Check if codec of stream is hevc or vp9
      // AND check if file.container does NOT match inputs.container.
      // If so remux file.
      if (
        (
          inputs.encoder === file.ffProbeData.streams[i].codec_name
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
        inputs.encoder === 'hevc'
        && (file.ffProbeData.streams[i].profile === 'High 10'
        || file.ffProbeData.streams[i].bits_per_raw_sample === '10')
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

  if (encoder === 'hevc_nvenc' || encoder === 'h264_nvenc') {
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
  }

  response.preset += `${genpts}, -map 0 -c:v ${encoder} -cq:v 19 ${bitrateSettings} `
    + `-spatial_aq:v 1 -rc-lookahead:v 32 -c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;
  response.processFile = true;
  response.infoLog += 'File is not hevc or vp9. Transcoding. \n';
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
