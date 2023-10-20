const details = () => ({
  id: 'Tdarr_Plugin_ant0_action_tiered_handbrake_basic_options',
  Stage: 'Pre-processing',
  Name: 'HandBrake basic options (Tiered)',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  Set basic HandBrake transcode options mapped to the closest resolution. This action has no built-in filter so be sure to set a codec filter
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
          'Very Fast',
          'Fast',
          'HQ Surround',
          'Super HQ Surround',
          'Gmail',
          'Vimeo YouTube HQ',
          'Vimeo YouTube 720p30',
          'Android',
          'Apple',
          'Chromecast',
          'Amazon Fire',
          'Playstation',
          'Roku',
          'Windows Mobile',
          'Xbox 1080p30 Surround',
          'Xbox Legacy 1080p30 Surround',
          'H.265 MKV',
          'H.264 MKV',
          'VP9 MKV',
          'VP8 MKV',
          'Production Max',
          'Production Standard',
          'Production Proxy',
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
      name: 'keepAllAudio',
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
        'Specify whether to keep All audio tracks or just the default one',
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

  if (inputs.handbrakePreset == 'Very Fast') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Very Fast 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Very Fast 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Very Fast 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Very Fast 480p30';
    }
  }
  if (inputs.handbrakePreset == 'Fast') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Fast 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Fast 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Fast 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Fast 480p30';
    }
  }
  if (inputs.handbrakePreset == 'HQ Surround') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'HQ 1080p30 Surround';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'HQ 720p30 Surround';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'HQ 576p25 Surround';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'HQ 480p30 Surround"';
    }
  }
  if (inputs.handbrakePreset == 'Super HQ Surround') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Super HQ 1080p30 Surround';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Super HQ 720p30 Surround';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Super HQ 576p25 Surround';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Super HQ 480p30 Surround';
    }
  }
  if (inputs.handbrakePreset == 'Gmail') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p" || file.video_resolution === "720p" || file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Gmail Large 3 Minutes 720p30';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Gmail Medium 5 Minutes 480p30';
//        inputs.handbrakePreset = 'Gmail Small 10 Minutes 288p30';
    }
  }
  if (inputs.handbrakePreset == 'Vimeo YouTube HQ') {
    if (file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'Vimeo YouTube HQ 2160p60 4K';
    }
    if (file.video_resolution === "1440p") {
        inputs.handbrakePreset = 'Vimeo YouTube HQ 1440p60 2.5K';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Vimeo YouTube HQ 1080p60';
    }
    if (file.video_resolution === "720p" || file.video_resolution === "576p" || file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Vimeo YouTube HQ 720p60';
    }
  }
  if (inputs.handbrakePreset == 'Android') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Android 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Android 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Android 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Android 480p30';
    }
  }
  if (inputs.handbrakePreset == 'Apple') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'Apple 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Apple 1080p60 Surround';
//        inputs.handbrakePreset = 'Apple 1080p30 Surround';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Apple 720p30 Surround';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Apple 540p30 Surround';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Apple 240p30';
    }
  }
  if (inputs.handbrakePreset == 'Chromecast') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'Chromecast 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === "1080p" || file.video_resolution === "720p" || file.video_resolution === "576p" || file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Chromecast 1080p60 Surround';
    //    inputs.handbrakePreset = 'Chromecast 1080p30 Surround';
    }
  }
  if (inputs.handbrakePreset == 'Amazon Fire') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'Amazon Fire 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Amazon Fire 1080p30 Surround';
    }
    if (file.video_resolution === "720p" || file.video_resolution === "576p" || file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Amazon Fire 720p30';
    }
  }
  if (inputs.handbrakePreset == 'Playstation') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Playstation 1080p30 Surround';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Playstation 720p30';
    }
    if (file.video_resolution === "576p" || file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Playstation 540p30';
    }
  }
  if (inputs.handbrakePreset == 'Roku') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'Roku 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Roku 1080p30 Surround';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Roku 720p30 Surround';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Roku 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Roku 480p30';
    }
  }
  if (inputs.handbrakePreset == 'Windows Mobile') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'Windows Mobile 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Windows Mobile 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'Windows Mobile 540p30';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Windows Mobile 480p30';
    }
  }
  if (inputs.handbrakePreset == 'H.265 MKV') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'H.265 MKV 2160p60';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'H.265 MKV 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'H.265 MKV 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'H.265 MKV 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'H.265 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset == 'H.264 MKV') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'H.264 MKV 2160p60';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'H.264 MKV 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'H.264 MKV 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'H.264 MKV 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'H.264 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset == 'VP9 MKV') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other") {
        inputs.handbrakePreset = 'VP9 MKV 2160p60';
    }
    if (file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'VP9 MKV 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'VP9 MKV 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'VP9 MKV 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'VP9 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset == 'VP8 MKV') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p") {
        inputs.handbrakePreset = 'VP8 MKV 1080p30';
    }
    if (file.video_resolution === "720p") {
        inputs.handbrakePreset = 'VP8 MKV 720p30';
    }
    if (file.video_resolution === "576p") {
        inputs.handbrakePreset = 'VP8 MKV 576p25';
    }
    if (file.video_resolution === "480p") {
        inputs.handbrakePreset = 'VP8 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset == 'Production Proxy') {
    if (file.video_resolution === "1440p" || file.video_resolution === "4KUHD" || file.video_resolution === "DCI4K" || file.video_resolution === "8KUHD" || file.video_resolution === "Other" || file.video_resolution === "1080p" || file.video_resolution === "720p") {
        inputs.handbrakePreset = 'Production Proxy 1080p';
    }
    if (file.video_resolution === "576p" || file.video_resolution === "480p") {
        inputs.handbrakePreset = 'Production Proxy 540p';
    }
  }

  const keepSubs = inputs.keepSubtitles === true ? ' --all-subtitles' : '';
  const keepAllAudio = inputs.keepAllAudio === true ? ' --all-audio' : '';
 

  response.preset = `-Z "${inputs.handbrakePreset}" -e ${inputs.videoEncoder}${keepSubs}${keepAllAudio}`;
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