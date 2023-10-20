const details = () => ({
  id: 'Tdarr_Plugin_ant0_action_handbrake_tiered_basic_options_',
  Stage: 'Pre-processing',
  Name: 'HandBrake basic options (Tiered)',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  Set basic HandBrake transcode options mapped to the closest resolution. 
  This action has no built-in filter so be sure to set a codec filter to prevent a transcoding loop.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'handbrakePreset',
      type: 'string',
      defaultValue: 'Very Fast',
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
      defaultValue: false,
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

  let actualHandbrakePreset = '';

  if (inputs.handbrakePreset === 'Very Fast') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Very Fast 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Very Fast 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Very Fast 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Very Fast 480p30';
    }
  }
  if (inputs.handbrakePreset === 'Fast') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Fast 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Fast 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Fast 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Fast 480p30';
    }
  }
  if (inputs.handbrakePreset === 'HQ Surround') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'HQ 1080p30 Surround';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'HQ 720p30 Surround';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'HQ 576p25 Surround';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'HQ 480p30 Surround"';
    }
  }
  if (inputs.handbrakePreset === 'Super HQ Surround') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Super HQ 1080p30 Surround';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Super HQ 720p30 Surround';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Super HQ 576p25 Surround';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Super HQ 480p30 Surround';
    }
  }
  if (inputs.handbrakePreset === 'Gmail') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === '720p'
        || file.video_resolution === '576p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Gmail Large 3 Minutes 720p30';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Gmail Medium 5 Minutes 480p30';
      //actualHandbrakePreset = 'Gmail Small 10 Minutes 288p30';
    }
  }
  if (inputs.handbrakePreset === 'Vimeo YouTube HQ') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Vimeo YouTube HQ 2160p60 4K';
    }
    if (file.video_resolution === '1440p') {
      actualHandbrakePreset = 'Vimeo YouTube HQ 1440p60 2.5K';
    }
    if (file.video_resolution === '1080p') {
      actualHandbrakePreset = 'Vimeo YouTube HQ 1080p60';
    }
    if (file.video_resolution === '720p' || file.video_resolution === '576p' || file.video_resolution === '480p') {
      actualHandbrakePreset = 'Vimeo YouTube HQ 720p60';
    }
  }
  if (inputs.handbrakePreset === 'Android') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Android 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Android 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Android 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Android 480p30';
    }
  }
  if (inputs.handbrakePreset === 'Apple') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Apple 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === '1080p') {
      //actualHandbrakePreset = 'Apple 1080p60 Surround';
      actualHandbrakePreset = 'Apple 1080p30 Surround';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Apple 720p30 Surround';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Apple 540p30 Surround';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Apple 240p30';
    }
  }
  if (inputs.handbrakePreset === 'Chromecast') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Chromecast 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === '1080p'
        || file.video_resolution === '720p'
        || file.video_resolution === '576p'
        || file.video_resolution === '480p') {
      //actualHandbrakePreset = 'Chromecast 1080p60 Surround';
      actualHandbrakePreset = 'Chromecast 1080p30 Surround';
    }
  }
  if (inputs.handbrakePreset === 'Amazon Fire') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Amazon Fire 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === '1080p') {
      actualHandbrakePreset = 'Amazon Fire 1080p30 Surround';
    }
    if (file.video_resolution === '720p'
        || file.video_resolution === '576p'
        || file.video_resolution === '480p') {
      actualHandbrakePreset = 'Amazon Fire 720p30';
    }
  }
  if (inputs.handbrakePreset === 'Playstation') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Playstation 1080p30 Surround';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Playstation 720p30';
    }
    if (file.video_resolution === '576p' || file.video_resolution === '480p') {
      actualHandbrakePreset = 'Playstation 540p30';
    }
  }
  if (inputs.handbrakePreset === 'Roku') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Roku 2160p60 4K HEVC Surround';
    }
    if (file.video_resolution === '1080p') {
      actualHandbrakePreset = 'Roku 1080p30 Surround';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Roku 720p30 Surround';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Roku 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Roku 480p30';
    }
  }
  if (inputs.handbrakePreset === 'Windows Mobile') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Windows Mobile 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'Windows Mobile 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'Windows Mobile 540p30';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'Windows Mobile 480p30';
    }
  }
  if (inputs.handbrakePreset === 'H.265 MKV') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'H.265 MKV 2160p60';
    }
    if (file.video_resolution === '1080p') {
      actualHandbrakePreset = 'H.265 MKV 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'H.265 MKV 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'H.265 MKV 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'H.265 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset === 'H.264 MKV') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'H.264 MKV 2160p60';
    }
    if (file.video_resolution === '1080p') {
      actualHandbrakePreset = 'H.264 MKV 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'H.264 MKV 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'H.264 MKV 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'H.264 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset === 'VP9 MKV') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'VP9 MKV 2160p60';
    }
    if (file.video_resolution === '1080p') {
      actualHandbrakePreset = 'VP9 MKV 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'VP9 MKV 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'VP9 MKV 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'VP9 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset === 'VP8 MKV') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'VP8 MKV 1080p30';
    }
    if (file.video_resolution === '720p') {
      actualHandbrakePreset = 'VP8 MKV 720p30';
    }
    if (file.video_resolution === '576p') {
      actualHandbrakePreset = 'VP8 MKV 576p25';
    }
    if (file.video_resolution === '480p') {
      actualHandbrakePreset = 'VP8 MKV 480p30';
    }
  }
  if (inputs.handbrakePreset === 'Production Proxy') {
    if (file.video_resolution === '4KUHD'
        || file.video_resolution === 'DCI4K'
        || file.video_resolution === '8KUHD'
        || file.video_resolution === '1440p'
        || file.video_resolution === '1080p'
        || file.video_resolution === 'Other') {
      actualHandbrakePreset = 'Production Proxy 1080p';
    }
    if (file.video_resolution === '576p' || 
        file.video_resolution === '480p') {
      actualHandbrakePreset = 'Production Proxy 540p';
    }
  }

  const keepSubs = inputs.keepSubtitles === true ? ' --all-subtitles' : '';
  const keepAllAudio = inputs.keepAllAudio === true ? ' --all-audio' : '';

  response.preset = `-Z "${actualHandbrakePreset}" -e ${inputs.videoEncoder}${keepSubs}${keepAllAudio}`;
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
