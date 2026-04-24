const details = () => ({
  id: 'Tdarr_Plugin_00td_action_handbrake_basic_options',
  Stage: 'Pre-processing',
  Name: 'HandBrake Basic Options',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  Set basic HandBrake transcode options. This action has no built-in filter so be sure to set a codec filter
  to prevent a transcoding loop.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'handbrakePreset',
      type: 'string',
      defaultValue: 'Very Fast 1080p30',
      inputUI: {
        type: 'dropdown',
        options: [
          'Very Fast 1080p30',
          'Very Fast 720p30',
          'Very Fast 576p25',
          'Very Fast 480p30',
          'Fast 1080p30',
          'Fast 720p30',
          'Fast 576p25',
          'Fast 480p30',
          'HQ 1080p30 Surround',
          'HQ 720p30 Surround',
          'HQ 576p25 Surround',
          'HQ 480p30 Surround"',
          'Super HQ 1080p30 Surround',
          'Super HQ 720p30 Surround',
          'Super HQ 576p25 Surround',
          'Super HQ 480p30 Surround',
          'Gmail Large 3 Minutes 720p30',
          'Gmail Medium 5 Minutes 480p30',
          'Gmail Small 10 Minutes 288p30',
          'Vimeo YouTube HQ 2160p60 4K',
          'Vimeo YouTube HQ 1440p60 2.5K',
          'Vimeo YouTube HQ 1080p60',
          'Vimeo YouTube HQ 720p60',
          'Vimeo YouTube 720p30',
          'Android 1080p30',
          'Android 720p30',
          'Android 576p25',
          'Android 480p30',
          'Apple 2160p60 4K HEVC Surround',
          'Apple 1080p60 Surround',
          'Apple 1080p30 Surround',
          'Apple 720p30 Surround',
          'Apple 540p30 Surround',
          'Apple 240p30',
          'Chromecast 2160p60 4K HEVC Surround',
          'Chromecast 1080p60 Surround',
          'Chromecast 1080p30 Surround',
          'Amazon Fire 2160p60 4K HEVC Surround',
          'Amazon Fire 1080p30 Surround',
          'Amazon Fire 720p30',
          'Playstation 1080p30 Surround',
          'Playstation 720p30',
          'Playstation 540p30',
          'Roku 2160p60 4K HEVC Surround',
          'Roku 1080p30 Surround',
          'Roku 720p30 Surround',
          'Roku 576p25',
          'Roku 480p30',
          'Windows Mobile 1080p30',
          'Windows Mobile 720p30',
          'Windows Mobile 540p30',
          'Windows Mobile 480p30',
          'Xbox 1080p30 Surround',
          'Xbox Legacy 1080p30 Surround',
          'H.265 MKV 2160p60',
          'H.265 MKV 1080p30',
          'H.265 MKV 720p30',
          'H.265 MKV 576p25',
          'H.265 MKV 480p30',
          'H.264 MKV 2160p60',
          'H.264 MKV 1080p30',
          'H.264 MKV 720p30',
          'H.264 MKV 576p25',
          'H.264 MKV 480p30',
          'VP9 MKV 2160p60',
          'VP9 MKV 1080p30',
          'VP9 MKV 720p30',
          'VP9 MKV 576p25',
          'VP9 MKV 480p30',
          'VP8 MKV 1080p30',
          'VP8 MKV 720p30',
          'VP8 MKV 576p25',
          'VP8 MKV 480p30',
          'Production Max',
          'Production Standard',
          'Production Proxy 1080p',
          'Production Proxy 540p',
        ],
      },
      tooltip:
        'Enter the desired HandBrake preset',
    },
    {
      name: 'videoEncoder',
      type: 'string',
      defaultValue: 'x265',
      inputUI: {
        type: 'dropdown',
        options: [
          'x264',
          'x264_10bit',
          'qsv_h264',
          'nvenc_h264',
          'x265',
          'x265_10bit',
          'x265_12bit',
          'qsv_h265',
          'nvenc_h265',
          'mpeg4',
          'mpeg2',
          'VP8',
          'VP9',
          'theora',
        ],
      },
      tooltip:
        'Enter the desired video encoder',
    },
    {
      name: 'keepSubtitles',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip:
        'Specify whether to keep subs or not',
    },
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the desired container',
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
    container: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const keepSubs = inputs.keepSubtitles === true ? '--all-subtitles' : '';

  response.preset = `-Z "${inputs.handbrakePreset}" -e ${inputs.videoEncoder} ${keepSubs}`;
  response.container = `.${inputs.container}`;
  response.handbrakeMode = true;
  response.ffmpegMode = false;
  response.reQueueAfter = true;
  response.processFile = true;
  response.infoLog += 'File is being transcoded using HandBrake \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
