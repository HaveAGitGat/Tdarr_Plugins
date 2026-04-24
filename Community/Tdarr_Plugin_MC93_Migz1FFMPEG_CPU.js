/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz1FFMPEG_CPU',
  Stage: 'Pre-processing',
  Name: 'Migz Transcode Using CPU & FFMPEG',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Files not in H265 will be transcoded into H265 using CPU with ffmpeg.
                Settings are dependant on file bitrate
                Working by the logic that H265 can support the same ammount of data at half the bitrate of H264.
                This plugin will  skip any files that are in the VP9 codec.`,
  Version: '1.9',
  Tags: 'pre-processing,ffmpeg,video only,configurable,h265',
  Inputs: [{
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
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
  let videoIdx = -1;
  let extraArguments = '';
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

  // If targetBitrate comes out as 0 then something has gone wrong and bitrates could not be calculcated.
  // Cancel plugin completely.
  if (targetBitrate === 0) {
    response.processFile = false;
    response.infoLog += 'Target bitrate could not be calculated. Skipping this plugin. \n';
    return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (inputs.bitrate_cutoff !== '') {
    // Checks if currentBitrate is below inputs.bitrate_cutoff
    // If so then cancel plugin without touching original files.
    if (currentBitrate <= inputs.bitrate_cutoff) {
      response.processFile = false;
      response.infoLog += 'Current bitrate is below set bitrate cutoff '
      + `of ${inputs.bitrate_cutoff}. Nothing to do, cancelling plugin. \n`;
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
      // Check if codec of stream is mjpeg/png.
      // If so then remove this "video" stream.
      // mjpeg/png are usually embedded pictures that can cause havoc with plugins.
      if (file.ffProbeData.streams[i].codec_name === 'mjpeg' || file.ffProbeData.streams[i].codec_name === 'png') {
        extraArguments += `-map -v:${videoIdx} `;
      }
      // Check if codec of stream is hevc or vp9
      // AND check if file.container matches inputs.container.
      // If so nothing for plugin to do.
      if (
        (file.ffProbeData.streams[i].codec_name === 'hevc' || file.ffProbeData.streams[i].codec_name === 'vp9')
                && file.container === `${inputs.container}`
      ) {
        response.processFile = false;
        response.infoLog += `File is already hevc or vp9 & in ${inputs.container}. \n`;
        return response;
      }
      // Check if codec of stream is hevc or vp9
      // AND check if file.container does NOT match inputs.container.
      // If so remux file.
      if (
        (file.ffProbeData.streams[i].codec_name === 'hevc' || file.ffProbeData.streams[i].codec_name === 'vp9')
                && file.container !== `${inputs.container}`
      ) {
        response.infoLog += `File is hevc or vp9 but is not in ${inputs.container} container. Remuxing. \n`;
        response.preset = `, -map 0 -c copy ${extraArguments}`;
        response.processFile = true;
        return response;
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

  response.preset += `,-map 0 -c:v libx265 ${bitrateSettings} `
  + `-c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;
  response.processFile = true;
  response.infoLog += 'File is not hevc or vp9. Transcoding. \n';
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
