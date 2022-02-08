/* eslint-disable no-bitwise,no-restricted-globals */

const details = () => ({

  id: 'Tdarr_Plugin_vdka_Tiered_CPU_CRF_Based_Configurable',
  Stage: 'Pre-processing',
  Name: 'Tiered FFMPEG CPU CRF Based Configurable',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `[Contains built-in filter] This plugin uses different CRF values depending on resolution, 
       the CRF value is configurable per resolution.
       FFmpeg Preset can be configured, uses slow by default. 
       If files are not in hevc they will be transcoded. 
       The output container is mkv. \n\n`,
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,video only,h265,configurable',

  Inputs: [
    {
      name: 'sdbitrate_cutoff',
      type: 'string',
      defaultValue: '6500',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded.
                  \\n Rate is in kbps.
                    \\nExample:\\n
                    6000
                    \\nExample:\\n
                    4000`,
    },
    {
      name: 'hdbitrate_cutoff',
      type: 'string',
      defaultValue: '6500',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded.
                  \\n Rate is in kbps.
                    \\nExample:\\n
                    6000
                    \\nExample:\\n
                    4000`,
    },
    {
      name: 'fullhdbitrate_cutoff',
      type: 'string',
      defaultValue: '10000',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded.
                  \\n Rate is in kbps.
                    \\nExample:\\n
                    6000
                    \\nExample:\\n
                    4000`,
    },
    {
      name: 'uhdbitrate_cutoff',
      type: 'string',
      defaultValue: '25000',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded.
                  \\n Rate is in kbps.
                    \\nExample:\\n
                    6000
                    \\nExample:\\n
                    4000`,
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
      defaultValue: '21',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 720p content. 
        \n Defaults to 21 (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        21`,
    },
    {
      name: 'fullhdCRF',
      type: 'string',
      defaultValue: '23',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 1080p content. 
        \n Defaults to 23 (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        23`,
    },
    {
      name: 'uhdCRF',
      type: 'string',
      defaultValue: '26',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 4K/UHD/2160p content. 
        \n Defaults to 26 (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        26`,
    },
    {
      name: 'bframe',
      type: 'string',
      defaultValue: '8',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify amount of b-frames to use, 0-16, defaults to 8.
        
        \\nExample:\\n
        8`,
    },
    {
      name: 'ffmpegPreset',
      type: 'string',
      defaultValue: 'slow',
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
      name: 'use10Bit',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to use 10 Bit colorDepth for your Encoder
        
        \\nExample:\\n
        true`,
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
      name: 'hdDisabled',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to skip HD (720p) files
        
        \\nExample:\\n
        true`,
    },
    {
      name: 'fullhdDisabled',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to skip FullHD (1080p) files
        
        \\nExample:\\n
        true`,
    },
    {
      name: 'uhdDisabled',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Input "true" if you want to skip 4k (UHD) files
        
        \\nExample:\\n
        true`,
    },

  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  let crf;
  let bitratecutoff;
  // default values that will be returned
  const response = {
    processFile: true,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  // check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video! \n';
    return response;
  }
  response.infoLog += '☑File is a video! \n';

  // Check if duration info is filled, if so times it by 0.0166667 to get time in minutes.

  let duration;
  // If not filled then get duration of stream 0 and do the same.
  if (typeof file.meta.Duration !== 'undefined') {
    duration = file.meta.Duration * 0.0166667;
  } else {
    duration = file.ffProbeData.streams[0].duration * 0.0166667;
  }

  // Set up required variables.
  // Work out currentBitrate using "Bitrate = file size / (number of minutes * .0075)"
  // Used from here https://blog.frame.io/2017/03/06/calculate-video-bitrates/
  // eslint-disable-next-line no-bitwise

  const mediaInfoVideoBitrate = ~~(Number(file.mediaInfo.track[1].BitRate) / 1000);
  const calculatedBitrate = ~~(file.file_size / (duration * 0.0075));
  let currentBitrate;

  if ((typeof mediaInfoVideoBitrate !== 'undefined') && !isNaN(mediaInfoVideoBitrate)) {
    currentBitrate = mediaInfoVideoBitrate;
  } else {
    currentBitrate = calculatedBitrate;
  }
  const sdbitratecutoff = inputs.sdbitrate_cutoff ? inputs.sdbitrate_cutoff : 999999;
  const hdbitratecutoff = inputs.hdbitrate_cutoff ? inputs.hdbitrate_cutoff : 999999;
  const fullhdbitratecutoff = inputs.fullhdbitrate_cutoff ? inputs.fullhdbitrate_cutoff : 999999;
  const uhdbitratecutoff = inputs.uhdbitrate_cutoff ? inputs.uhdbitrate_cutoff : 999999;

  // set crf by resolution
  switch (file.video_resolution) {
    case '480p':
    case '576p':
      bitratecutoff = sdbitratecutoff;
      break;
    case '720p':
      bitratecutoff = hdbitratecutoff;
      break;
    case '1080p':
      bitratecutoff = fullhdbitratecutoff;
      break;
    case '4KUHD':
      bitratecutoff = uhdbitratecutoff;
      break;
    default:
      response.infoLog += 'Could for some reason not detect resolution, plugin will not proceed. \n';
      response.processFile = false;
      return response;
  }

  // Check if inputs.bitrate cutoff has something entered.
  // (Entered means user actually wants something to happen, empty would disable this).
  if (bitratecutoff !== '') {
    // Checks if currentBitrate is below inputs.bitrate_cutoff
    // If so then cancel plugin without touching original files.
    if (currentBitrate <= bitratecutoff) {
      response.processFile = false;
      response.infoLog += `Current bitrate is ${currentBitrate} thats below set bitrate cutoff`
      + `of ${bitratecutoff}. Nothing to do, cancelling plugin. \n`;
      return response;
    }
  }

  // check if the file is SD and sdDisable is enabled
  // skip this plugin if so
  if (['480p', '576p'].includes(file.video_resolution) && inputs.sdDisabled) {
    response.processFile = false;
    response.infoLog += '☒File is SD, not processing\n';
    return response;
  }

  // check if the file is hdready and hdDisabled is enabled
  // skip this plugin if so
  if (['720p'].includes(file.video_resolution) && inputs.hdDisabled) {
    response.processFile = false;
    response.infoLog += '☒File is 720p, not processing\n';
    return response;
  }

  // check if the file is hdready and fullhdDisabled is enabled
  // skip this plugin if so
  if (['1080p'].includes(file.video_resolution) && inputs.fullhdDisabled) {
    response.processFile = false;
    response.infoLog += '☒File is 1080p, not processing\n';
    return response;
  }

  // check if the file is 4k and 4kDisable is enabled
  // skip this plugin if so
  if (file.video_resolution === '4KUHD' && inputs.uhdDisabled) {
    response.processFile = false;
    response.infoLog += '☒File is 4k/UHD, not processing\n';
    return response;
  }

  // check if the file is already hevc
  // it will not be transcoded if true and the plugin will be stopped immediately
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    if (file.ffProbeData.streams[i].codec_name && file.ffProbeData.streams[i].codec_name.toLowerCase() === 'hevc') {
      response.processFile = false;
      response.infoLog += '☑File is already in hevc! \n';
      return response;
    }
  }

  // if we made it to this point it is safe to assume there is no hevc stream
  response.infoLog += '☒File is not hevc!\n';

  // set sane input defaults if not configured
  const sdCRF = inputs.sdCRF ? inputs.sdCRF : 20;
  const hdCRF = inputs.hdCRF ? inputs.hdCRF : 22;
  const fullhdCRF = inputs.fullhdCRF ? inputs.fullhdCRF : 24;
  const uhdCRF = inputs.uhdCRF ? inputs.uhdCRF : 28;
  const bframe = inputs.bframe ? inputs.bframe : 8;
  let use10Bit = '';

  if (!inputs.use10Bit) {
    response.infoLog += '☑Using 8Bit for colorDepth';
  } else {
    use10Bit = '-pix_fmt yuv420p10le';
    response.infoLog += '☑Using 10Bit for colorDepth \n';
  }

  // set preset to slow if not configured
  let ffmpegPreset = 'slow';
  if (!inputs.ffmpegPreset) {
    response.infoLog += '☑Preset not set, defaulting to slow\n';
  } else {
    ffmpegPreset = `${inputs.ffmpegPreset}`;
    response.infoLog += `☑Preset set as ${inputs.ffmpegPreset}\n`;
  }

  // set crf by resolution
  switch (file.video_resolution) {
    case '480p':
    case '576p':
      crf = sdCRF;
      break;
    case '720p':
      crf = hdCRF;
      break;
    case '1080p':
      crf = fullhdCRF;
      break;
    case '4KUHD':
      crf = uhdCRF;
      break;
    default:
      response.infoLog += 'Could for some reason not detect resolution, plugin will not proceed. \n';
      response.processFile = false;
      return response;
  }

  // encoding settings
  response.preset += `,-map 0 -dn -c:v libx265 -preset ${ffmpegPreset}`
  + ` ${use10Bit} -x265-params crf=${crf}:qpmax=40:bframes=${bframe}:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3`
  + ' -a53cc 0 -c:a copy -c:s copy -metadata:g title= -metadata:s:v:0 titel= -metadata:s:v:0 name= '
  + '-max_muxing_queue_size 9999';
  response.infoLog += `☑File hast a bitrate of ${currentBitrate}, going for transcode!\n`;
  response.infoLog += `☑File is ${file.video_resolution}, using CRF value of ${crf}!\n`;
  response.infoLog += 'File is being transcoded!\n';

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
