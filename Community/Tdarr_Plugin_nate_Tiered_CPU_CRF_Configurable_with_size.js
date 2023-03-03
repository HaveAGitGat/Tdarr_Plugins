const details = () => ({
  id: 'Tdarr_Plugin_nate_Tiered_CPU_CRF_Configurable_with_size',
  Stage: 'Pre-processing',
  Name: 'Tiered FFMPEG CPU CRF Configurable with size retry',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `[Contains built-in filter] This plugin uses different CRF values depending on resolution,
       the CRF value is configurable per resolution.
       If the new video is larger then the configured threshold it will re-transcode with a higher CRF.
       If the new video is smaller then the configured threshold it will error out.
       FFmpeg Preset can be configured, uses medium by default.
       If files are not in hevc they will be transcoded.
       The output container is mkv.

       Note that mediainfo is required for this plugin.\n\n`,
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,video only,h265,configurable',

  Inputs: [
    {
      name: 'skipHevc',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to skip hevc videos conversion.

        \\nExample:\\n
        true`,
    },
    {
      name: 'sdCRF',
      type: 'string',
      defaultValue: '19',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 480p and 576p content.
        \n Defaults to 19 (0-51, lower = higher quality, bigger file)
         \\nExample:\\n

        19`,
    },
    {
      name: 'hdCRF',
      type: 'string',
      defaultValue: '20',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 720p content.
        \n Defaults to 20 (0-51, lower = higher quality, bigger file)

        \\nExample:\\n
        20`,
    },
    {
      name: 'fullhdCRF',
      type: 'string',
      defaultValue: '21',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 1080p content.
        \n Defaults to 21 (0-51, lower = higher quality, bigger file)

        \\nExample:\\n
        21`,
    },
    {
      name: 'uhdCRF',
      type: 'string',
      defaultValue: '23',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 4K/UHD/2160p content.
        \n Defaults to 23 (0-51, lower = higher quality, bigger file)

        \\nExample:\\n
        23`,
    },
    {
      name: 'keyint',
      type: 'number',
      defaultValue: 240,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify amount of keyint to use, 0-255, defaults to 240.

        \\nExample:\\n
        240`,
    },
    {
      name: 'bframe',
      type: 'number',
      defaultValue: 4,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify amount of b-frames to use, 0-16, defaults to 4.

        \\nExample:\\n
        4`,
    },
    {
      name: 'rclookahead',
      type: 'number',
      defaultValue: 20,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify amount of rc-lookahead to use, 0-250, defaults to 20.

        \\nExample:\\n
        20`,
    },
    {
      name: 'ref',
      type: 'number',
      defaultValue: 3,
      inputUI: {
        type: 'text',
      },
     tooltip: `Specify amount of ref to use, 1-16, defaults to 3.

        \\nExample:\\n
        3`,
    },
    {
      name: 'bintra',
      type: 'number',
      defaultValue: 1,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify use of b-intra, 0-1, defaults to 1.

        \\nExample:\\n
        1`,
    },
    {
      name: 'aqmode',
      type: 'number',
      defaultValue: 2,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify aq-mode to use, 0-4, defaults to 2.

        \\nExample:\\n
        2`,
    },
    {
      name: 'ffmpegPreset',
      type: 'string',
      defaultValue: 'medium',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the ffmpeg preset you want.

        \\nExample:\\n
          slow

        \\nExample:\\n
          medium

        \\nExample:\\n
          fast

        \\nExample:\\n
          veryfast`,
    },
    {
      name: 'sdDisabled',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to skip SD (480p and 576p) files

        \\nExample:\\n
        true`,
    },
    {
      name: 'uhdDisabled',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to skip 4k (UHD) files.

        \\nExample:\\n
        true`,
    },
    {
      name: 'bitdepth',
      type: 'string',
      defaultValue: 'same',
      inputUI: {
        type: 'dropdown',
        options: [
          'same',
          'force8bit',
          'force10bit',
        ],
      },
      tooltip: `Specify if output file should be forced to 8 or 10bit. Default is same (bit depth is same as source).
                  \\nExample:\\n
                  force8bit

                  \\nExample:\\n
                  same`,
    },
    {
      name: 'upperBound',
      type: 'number',
      defaultValue: 100,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the upper bound % size for the new file. For example, if '99' is entered,
        then if the new file size is 1% larger than the original, an error will be given.`,
    },
    {
      name: 'lowerBound',
      type: 'number',
      defaultValue: 10,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the lower bound % size for the new file. For example, if '10' is entered,
        then if the new file size is less than 10% of the original, an error will be given.`,
    },
    {
      name: 'retryIncrement',
      type: 'number',
      defaultValue: 1,
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Enter the amnount to increment the CRF when transcoded file isn't within the size bounds.`,
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  let crf;
  let retry = false;
  // default values that will be returned
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  // check if the file is a video, if not the plugin will exit
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒File is not a video! \n';
    return response;
  }
  response.infoLog += '☑File is a video! \n';

  // check if the file is SD and sdDisabled is true
  // skip this plugin if so
  if (inputs.sdDisabled && ['480p', '576p'].includes(file.video_resolution)) {
    response.infoLog += '☒File is SD and disabled, not processing\n';
    return response;
  }

  // check if the file is 4k and uhdDisabled is true
  // skip this plugin if so
  if (inputs.uhdDisabled && file.video_resolution === '4KUHD') {
    response.infoLog += '☒File is 4k/UHD and disabled, not processing\n';
    return response;
  }

  // Check if the file contains a hevc track.
  if (file.ffProbeData.streams.some((x) => x.codec_name?.toLowerCase() === 'hevc')) {
      if (typeof file.file_size !== 'undefined') {
        // If file_size is defined, it has been transcoded (not necessarily by us).
        // Let's check if the stream is within the boundaries.
        const newSize = Number(file.mediaInfo.track[1][`StreamSize`]);
        const oldSize = Number(otherArguments.originalLibraryFile.mediaInfo.track[1][`StreamSize`]);
        const ratio = parseInt((newSize / oldSize) * 100, 10);
        const sizeText = `New file has size ${newSize.toFixed(3)} MB which is ${ratio}% `
          + `of original file size:  ${oldSize.toFixed(3)} MB`;
        const getBound = (bound) => (bound / 100) * oldSize;
        const errText = 'New file size not within limits.';
        if (newSize > getBound(inputs.upperBound)) {
          // If it's too large flag it for transcoding again.
          retry = true;
          response.infoLog += `${errText} ${sizeText}. upperBound is ${inputs.upperBound}%\n`;
        } else if (newSize < getBound(inputs.lowerBound)) {
          // Item will be errored in UI
          throw new Error(`${errText} ${sizeText}. lowerBound is ${inputs.lowerBound}%`);
        } else {
          // It's within limits, return a response.
          response.infoLog += sizeText;
          return response;
        }
      } else {
        // Not transcoding since it's already hevc (the plugin will exit).
        response.infoLog += '☑File is already in hevc! \n';
        if (inputs.skipHevc) {
            return response;
        }
      }
  }

  response.infoLog += `☑Preset set as ${inputs.ffmpegPreset}\n`;

  // set crf by resolution
  switch (file.video_resolution) {
    case '480p':
    case '576p':
      crf = inputs.sdCRF;
      break;
    case '720p':
      crf = inputs.hdCRF;
      break;
    case '1080p':
      crf = inputs.fullhdCRF;
      break;
    case '4KUHD':
      crf = inputs.uhdCRF;
      break;
    default:
      response.infoLog += 'Could not for some reason detect resolution, plugin will not proceed. \n';
      return response;
  }

  if (retry) {
    // If flagged for transcoding again.
    // Find the video track and old crf value to increase.
    let mediaInfo = file.mediaInfo;
    const tracks = mediaInfo.track.length;
    for (i = 0; i < tracks; i++) {
        if (typeof mediaInfo.track[i].Encoded_Library_Settings !== 'undefined') {
        	var videoTrack = i;
        }
    }
    // If we found the video track, find and increment the CRF.
    if (typeof videoTrack !== 'undefined') {
      let settings = mediaInfo.track[videoTrack].Encoded_Library_Settings;
      // Default CRF, to default value.
      let oldCRF = crf;
      const regexCRF = /\/ (crf=)([^.]+)/.exec(settings);
      // If we find a CRF increment it.
      if (regexCRF !== null) {
        oldCRF = parseInt(regexCRF[2]);
        crf = oldCRF + inputs.retryIncrement;
      }
      crf = String(crf);
      response.infoLog += `Retrying with new CRF ${crf} (was ${oldCRF})\n`;
    }
    // TODO: Handle if no video track found or remove this conditional?

  }

  // Set pixel format (bit depth) per configuration.
  switch (inputs.bitdepth) {
    case 'force8bit':
      pixelFormat = ' -pix_fmt yuv420p';
      break;
    case 'force10bit':
      pixelFormat = ' -pix_fmt p010le';
      break;
    default:
      pixelFormat = '';
      break;
  }

  // encoding settings
  response.preset += `<io> -map 0 -dn -c:v libx265 -preset ${inputs.ffmpegPreset}`
    + ` -x265-params crf=${crf}:keyint=${inputs.keyint}:bframes=${inputs.bframe}:rc-lookahead=${inputs.rclookahead}:ref=${inputs.ref}:b-intra=${inputs.bintra}:aq-mode=${inputs.aqmode}`
    + ` ${pixelFormat} -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999`;

  response.infoLog += `☑File is ${file.video_resolution}, using CRF value of ${crf}!\n`;
  response.infoLog += 'File is being transcoded!\n';
  response.processFile = true;

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
