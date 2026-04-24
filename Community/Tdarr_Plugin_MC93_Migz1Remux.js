/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz1Remux',
  Stage: 'Pre-processing',
  Name: 'Migz Remux Container',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Files will be remuxed into either mkv or mp4. \n\n',
  Version: '1.2',
  Tags: 'pre-processing,ffmpeg,video only,configurable',
  Inputs: [{
    name: 'container',
    type: 'string',
    defaultValue: 'mkv',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify output container of file
               \\nEnsure that all stream types you may have are supported by your chosen container.
               \\nmkv is recommended.
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

  // Check if inputs.container has been configured. If it hasn't then exit plugin.
  if (inputs.container === '') {
    response.infoLog
      += '☒Container has not been configured, please configure required options. Skipping this plugin. \n';
    response.processFile = false;
    return response;
  }
  response.container = `.${inputs.container}`;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video. \n';
    return response;
  }

  // Set up required variables.
  let extraArguments = '';
  let genpts = '';
  let convert = false;

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

  // Check if file.container does NOT match inputs.container. If so remux file.
  if (file.container !== inputs.container) {
    response.infoLog += `☒File is ${file.container} but requested to be ${inputs.container} container. Remuxing. \n`;
    convert = true;
  } else if (file.container === inputs.container) {
    response.infoLog += `☑File is already in ${inputs.container} container. \n`;
    return response;
  }

  // If Container .ts|.avi|.mpg|.mpeg set genpts to fix unknown timestamp
  if (
    file.container.toLowerCase() === 'ts'
     || file.container.toLowerCase() === 'avi'
  || file.container.toLowerCase() === 'mpg'
  || file.container.toLowerCase() === 'mpeg'
  ) {
    genpts = '-fflags +genpts';
  }

  if (convert === true) {
    response.preset += `${genpts}, -map 0 -c copy -max_muxing_queue_size 9999 ${extraArguments}`;
    response.processFile = true;
    return response;
  }

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
