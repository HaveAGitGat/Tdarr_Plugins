/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint-disable no-restricted-globals */

const details = () => ({
  id: 'Tdarr_Plugin_A47j_FFMPEG_NVENC_HEVC_Video_Only',
  Stage: 'Pre-processing',
  Name: 'FFMPEG:nvenc_H265 Video Only',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
[Contains built-in filter] This plugin transcodes non-h265 files into h265 mkv using NVENC, 
reducing resolution to 1920x1080 using nvenc. Audio/subtitles not affected. Bitrate is scaled based on
input file quality.`,
  Version: '1.1',
  Tags: 'pre-processing,video only,ffmpeg,nvenc h265,h265',

  Inputs: [
    {
      name: 'compressionFactor',
      type: 'string',
      defaultValue: '0.07',
      inputUI: {
        type: 'text',
      },
      tooltip: `
== Compression Factor == \\n\\n
How much does HEVC compress raw video?  I suggest something between 0.04-0.08.  Remember that GPU encoding is
faster but not as space efficient as CPU encoding, so resulting file sizes will be larger than if you used CPU
encoding.\\n\\n 
0.07 will result in a 1080p@29.92fps having a target bitrate of 5.4mbps.  This is the default.\\n`,
    },
    {
      name: 'maxResolution',
      type: 'string',
      defaultValue: 'false',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          '8KUHD',
          '4KUHD',
          '1080p',
          '720p',
          '576p',
          '480p',
        ],
      },
      tooltip: `== Maximum Resolution ==\\n\\n
        Videos that exceed this resolution will be resized down to this resolution.\\n
        If false, no resizing will occur.\\n`,
    },
    {
      name: 'ffmpegPreset',
      type: 'string',
      defaultValue: 'medium',
      inputUI: {
        type: 'dropdown',
        options: [
          'veryslow',
          'slower',
          'slow',
          'medium',
          'fast',
          'faster',
          'veryfast',
          'superfast',
          'ultrafast',
        ],
      },
      tooltip: `== FFmpeg Preset ==\\n\\n
        Select the ffmpeg preset.\\n`,
    },
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mp4',
      inputUI: {
        type: 'dropdown',
        options: [
          'mp4',
          'mkv',
        ],
      },
      tooltip: `== Container ==\\n\\n
        mkv or mp4.\\n`,
    },
  ],

});

const MediaInfo = {
  videoHeight: '',
  videoWidth: '',
  videoFPS: '',
  videoBR: '',
  videoBitDepth: '',
  overallBR: '',
}; // var MediaInfo

// Easier for our functions if response has global scope.
const response = {
  processFile: false,
  preset: '',
  container: '.mp4',
  handBrakeMode: false,
  FFmpegMode: true,
  reQueueAfter: true,
  infoLog: '',
}; // var response

// Finds the first video stream and populates some useful variables
const getMediaInfo = (file) => {
  let videoIdx = -1;

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const strstreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();

    // Looking For Video
    // Check if stream is a video.
    if (videoIdx === -1 && strstreamType === 'video') {
      videoIdx = i;

      MediaInfo.videoHeight = Number(file.ffProbeData.streams[i].height);
      MediaInfo.videoWidth = Number(file.ffProbeData.streams[i].width);
      MediaInfo.videoFPS = Number(file.mediaInfo.track[i + 1].FrameRate);
      MediaInfo.videoBR = Number(file.mediaInfo.track[i + 1].BitRate);
      MediaInfo.videoBitDepth = Number(file.mediaInfo.track[i + 1].BitDepth);
    }
  }
  MediaInfo.overallBR = file.mediaInfo.track[0].OverallBitRate;
}; // end  getMediaInfo()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video.\n';
    return response;
  }

  // How much does HVEC compress the raw stream?
  let compressionFactor = 0.07;
  if (!isNaN(Number(inputs.compressionFactor))) {
    compressionFactor = inputs.compressionFactor;
  } else {
    response.infoLog += `No compression factor selected, defaulting to ${compressionFactor}.\n`;
  }

  response.container = `.${inputs.container}`;

  // Do we resize?
  const resolutionOrder = ['480p', '576p', '720p', '1080p', '4KUHD', '8KUHD'];

  // Define the dimensions and the number of pixels (weightxheight) for each resolution.
  const resolutions = {
    '480p': { dimensions: '640x480', pixelCount: 307200 },
    '576p': { dimensions: '720x576', pixelCount: 414720 },
    '720p': { dimensions: '1280x720', pixelCount: 921600 },
    '1080p': { dimensions: '1920x1080', pixelCount: 2073600 },
    '4KUHD': { dimensions: '3840x2160', pixelCount: 8294400 },
    '8KUHD': { dimensions: '7680x4320', pixelCount: 33177600 },
  };

  let maxResolution = '8KUHD';
  if (resolutionOrder.indexOf(inputs.maxResolution) > 0) {
    maxResolution = inputs.maxResolution;
  } else {
    response.infoLog += `No valid resolution selected, defaulting to ${maxResolution}.\n`;
  }

  getMediaInfo(file);

  // Set decoding options here
  switch (file.ffProbeData.streams[0].codec_name) {
    case 'hevc':
      response.preset = '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v hevc_cuvid  ';
      break;
    case 'h264':
      response.preset = '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v h264_cuvid ';
      break;
    case 'vc1':
      response.preset = '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v vc1_cuvid ';
      break;
    case 'vp8':
      response.preset = '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v vp8_cuvid ';
      break;
    case 'vp9':
      response.preset = '-vsync 0 -hwaccel cuda -hwaccel_output_format cuda -c:v vp9_cuvid ';
      break;
    default:
      break;
  } // end switch(codec)

  let targetBitrate;

  // Resize high resolution videos to 1080p.
  if (resolutionOrder.indexOf(file.video_resolution) > resolutionOrder.indexOf(maxResolution)) {
    // File resolution exceeds limit, need to resize.
    response.preset += ` -resize ${resolutions[maxResolution].dimensions} `;
    response.infoLog += `Resizing to ${resolutions[maxResolution].dimensions}.\n`;
    response.processFile = true;
    targetBitrate = Math.round((resolutions[maxResolution].pixelCount * MediaInfo.videoFPS) * compressionFactor);
  } else {
    // No resize needed.
    targetBitrate = Math.round((MediaInfo.videoWidth * MediaInfo.videoHeight * MediaInfo.videoFPS) * compressionFactor);
  }

  // Calculate bitrates
  response.infoLog += `Video details: ${file.ffProbeData.streams[0].codec_name}-${file.video_resolution} 
  ${MediaInfo.videoWidth}x${MediaInfo.videoHeight}x${MediaInfo.videoFPS}@8 bits.\n`;

  const maxBitrate = Math.round(targetBitrate * 1.3);
  const minBitrate = Math.round(targetBitrate * 0.7);

  let bufsize;
  if (isNaN(MediaInfo.videoBR)) {
    bufsize = targetBitrate;
  } else {
    bufsize = Math.round(MediaInfo.videoBR);
  }

  response.preset += ',-map 0:v -map 0:a -map 0:s? -map -:d? -c copy -c:v:0 hevc_nvenc'
    + ` -preset ${inputs.ffmpegPreset} -profile:v main10 -rc-lookahead 32 `
    + '-spatial_aq:v 1 -aq-strength:v 8 -max_muxing_queue_size 4096 ';
  response.infoLog += `Video bitrate is ${Math.round(MediaInfo.videoBR / 1000)}Kbps,`
    + ` overall is ${Math.round(MediaInfo.overallBR / 1000)}Kbps. `;
  response.infoLog += `Calculated target is ${Math.round(targetBitrate / 1000)}Kbps.\n`;

  // Adjust target bitrates by codec and bitrate
  switch (file.ffProbeData.streams[0].codec_name) {
    case 'hevc':
      if (isNaN(MediaInfo.videoBR)) {
        response.processFile = true;
        targetBitrate = Math.min(MediaInfo.overallBR, targetBitrate);
        response.preset += ` -b:v ${targetBitrate} -maxrate ${maxBitrate} -minrate ${minBitrate} -bufsize ${bufsize} `;
        response.infoLog += `☒HEVC Bitrate for ${file.video_resolution} could not be determined, 
          using sensible default of ${Math.round(targetBitrate / 1000)}Kbps.\n`;
      } else if ((MediaInfo.videoBR > targetBitrate * 1.5) || file.forceProcessing === true) {
        response.processFile = true;
        response.preset += ` -b:v ${targetBitrate} -maxrate ${maxBitrate} -minrate ${minBitrate} -bufsize ${bufsize} `;
        response.infoLog += `☒HEVC Bitrate for ${file.video_resolution}`
          + ` exceeds ${Math.round((targetBitrate * 1.5) / 1000)}Kbps,`
          + ` downsampling to ${Math.round(targetBitrate / 1000)}Kbps.\n`;
      } else {
        response.infoLog += '☑HEVC Bitrate is within limits.\n';
      }
      break; // case "hevc"
    case 'h264':
      response.processFile = true;
      let new_bitrate;
      // We want the new bitrate to be 70% the h264 bitrate, but not higher than our target.
      if (isNaN(MediaInfo.videoBR)) {
        new_bitrate = Math.min(MediaInfo.overallBR * 0.7, targetBitrate);
      } else {
        new_bitrate = Math.min(Math.round(MediaInfo.videoBR * 0.7), targetBitrate);
        // New bitrate should not be lower than our 60% of our target.
        new_bitrate = Math.max(new_bitrate, Math.min(MediaInfo.videoBR, targetBitrate * 0.6));
      }
      response.preset += ` -b:v ${new_bitrate} -maxrate ${Math.round(new_bitrate * 1.3)}`
      + ` -minrate ${Math.round(new_bitrate * 0.7)}  -bufsize ${bufsize}`;
      response.infoLog += `☒H264 Resolution is ${file.video_resolution},`
      + ` bitrate was ${Math.round(MediaInfo.videoBR / 1000)}Kbps.`
      + ` HEVC target bitrate will be ${Math.round(new_bitrate / 1000)}Kbps.\n`;
      break; // case "h264"
    default:
      response.processFile = true;
      response.preset += ` -b:v ${targetBitrate} -maxrate ${maxBitrate} -minrate ${minBitrate} -bufsize ${bufsize} `;
      response.infoLog += `☒${file.ffProbeData.streams[0].codec_name} resolution is ${file.video_resolution},`
      + ` bitrate was ${Math.round(MediaInfo.videoBR / 1000)}Kbps.`
        + ` HEVC target bitrate will be ${Math.round(targetBitrate / 1000)}Kbps.\n`;
      break; // default
  } // switch (file.ffProbeData.streams[0].codec_name)

  if (response.processFile === true) {
    response.preset += ' -map_metadata:g -1';
    response.FFmpegMode = true;
    response.infoLog += '☒Transcoding to HEVC.';
  }

  return response;
}; // end plugin()

module.exports.details = details;
module.exports.plugin = plugin;
