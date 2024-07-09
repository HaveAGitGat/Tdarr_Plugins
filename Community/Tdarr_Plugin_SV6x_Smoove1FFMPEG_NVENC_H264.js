/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
// This is almost a line for line copy of Migz1FFMPEG
// https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz1FFMPEG.js
// Seriously, all I did was make it work for converting things to h264 instead of hevc

const details = () => ({
  id: 'Tdarr_Plugin_SV6x_Smoove1FFMPEG_NVENC_H264',
  Stage: 'Pre-processing', // Preprocessing or Post-processing. Determines when the plugin will be executed.
  Name: 'Smoove-Transcode To H264 Using FFMPEG And NVENC',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Files not in H264 will be transcoded into H264 using Nvidia GPU with ffmpeg.
                  Settings are dependant on file bitrate
                  NVDEC & NVENC compatable GPU required.`,
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,video only,nvenc h264,configurable',
  // Provide tags to categorise your plugin in the plugin browser.Tag options: h265,hevc,h264,nvenc h265,
  // nvenc h264,video only,audio only,subtitle only,handbrake,ffmpeg
  // radarr,sonarr,pre-processing,post-processing,configurable

  Inputs: [
    {
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
      name: 'force_conform',
      type: 'string',
      defaultValue: 'false',
      inputUI: {
        type: 'text',
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
    infoLog: '',
    handBrakeMode: false, // Set whether to use HandBrake or FFmpeg for transcoding
    FFmpegMode: true,
    reQueueAfter: true,
    // Leave as true. File will be re-qeued afterwards and pass through the plugin
    // filter again to make sure it meets conditions.
    preset: '', // Initialize with an empty string
  };

  // Check that inputs.container has been configured, else dump out
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

  let duration = '';

  // Get duration of stream 0 and times it by 0.0166667 to get time in minutes
  if (file.ffProbeData.streams[0].duration) {
    duration = file.ffProbeData.streams[0].duration;
  } else {
    duration = file.ffProbeData.format.duration;
  }

  duration *= 0.0166667;

  // Set up required variables.
  let videoIdx = 0;
  let extraArguments = '';
  let bitrateSettings = '';
  // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)"
  // Used from here https://blog.frame.io/2017/03/06/calculate-video-bitrates/
  // eslint-disable-next-line no-bitwise
  const currentBitrate = ~~(file.file_size / (duration * 0.0075));
  // For h.264, the target bitrate matches the current bitrate, since we're not reducing quality, just changing codec
  // eslint-disable-next-line no-bitwise
  const targetBitrate = ~~(file.file_size / (duration * 0.0075));
  // Allow some leeway under and over the targetBitrate.
  // eslint-disable-next-line no-bitwise
  const minimumBitrate = ~~(targetBitrate * 0.7);
  // eslint-disable-next-line no-bitwise
  const maximumBitrate = ~~(targetBitrate * 1.3);

  // This shouldn't be 0, for any reason, and if it is, you should get outta there.
  if (targetBitrate === 0) {
    response.processFile = false;
    response.infoLog += 'Target bitrate could not be calculated. Skipping this plugin. \n';
    return response;
  }

  // Check if force_conform option is checked.
  // If so then check streams and add any extra parameters required to make file conform with output format.
  if (inputs.force_conform === 'true') {
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

  // Go through each stream in the file
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is video
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
      // Check if the video stream is mjpeg/png, and removes it.
      // These are embedded image streams which ffmpeg doesn't like to work with as a video stream
      if (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'mjpeg'
                || file.ffProbeData.streams[i].codec_name.toLowerCase() === 'png') {
        response.infoLog += 'File Contains mjpeg / png video streams, removing.';
        extraArguments += `-map -v:${videoIdx} `;
      }

      // If video is h264, and container matches desired container, we don't need to do anything
      if (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'h264' && file.container === inputs.container) {
        response.processFile = false;
        response.infoLog += `File is already H264 and in ${inputs.container} \n`;
        return response;
      }

      // if video is h264, but container does NOT match desired container, do a remux
      if (file.ffProbeData.streams[i].codec_name.toLowerCase() === 'h264' && file.container !== inputs.container) {
        response.processFile = true;
        response.infoLog += `File is already H264 but file is not in ${inputs.container}. Remuxing \n`;
        response.preset = `, -map 0 -c copy ${extraArguments}`;
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

  // Codec will be checked so it can be transcoded correctly
  if (file.video_codec_name === 'h263') {
    response.preset = '-c:v h263_cuvid';
  } else if (file.video_codec_name === 'hevc') {
    response.preset = '';
  } else if (file.video_codec_name === 'av1') {
    response.preset = '';
  } else if (file.video_codec_name === 'vp9') {
    response.preset = '';
  } else if (file.video_codec_name === 'mjpeg') {
    response.preset = '-c:v mjpeg_cuvid';
  } else if (file.video_codec_name === 'mpeg1') {
    response.preset = '-c:v mpeg1_cuvid';
  } else if (file.video_codec_name === 'mpeg2') {
    response.preset = '-c:v mpeg2_cuvid';
  } else if (file.video_codec_name === 'vc1') {
    response.preset = '-c:v vc1_cuvid';
  } else if (file.video_codec_name === 'vp8') {
    response.preset = '-c:v vp8_cuvid';
  }

  response.preset += `,-map 0 -c:v h264_nvenc -preset fast -crf 23 ${bitrateSettings} `
  + `-c:a copy -c:s copy -max_muxing_queue_size 9999 -pix_fmt yuv420p ${extraArguments}`;
  response.processFile = true;
  response.infoLog += 'File is not h264. Transcoding. \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
