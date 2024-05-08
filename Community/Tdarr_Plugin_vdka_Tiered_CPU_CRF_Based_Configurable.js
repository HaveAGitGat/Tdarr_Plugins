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
      name: 'sdCRF',
      type: 'string',
      defaultValue: '20',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 480p and 576p content. 
        \n Defaults to 20 (0-51, lower = higher quality, bigger file)
         \\nExample:\\n 
        
        19`,
    },
    {
      name: 'hdCRF',
      type: 'string',
      defaultValue: '22',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 720p content. 
        \n Defaults to 22 (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        21`,
    },
    {
      name: 'fullhdCRF',
      type: 'string',
      defaultValue: '24',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 1080p content. 
        \n Defaults to 24 (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        23`,
    },
    {
      name: 'uhdCRF',
      type: 'string',
      defaultValue: '28',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter the CRF value you want for 4K/UHD/2160p content. 
        \n Defaults to 28 (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        26`,
    },
    {
      name: 'bframe',
      type: 'number',
      defaultValue: 8,
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
      tooltip: `Input "true" if you want to skip 4k (UHD) files
        
        \\nExample:\\n
        true`,
    },
    {
      name: 'force10bit',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Specify if output file should be forced to 10bit. Default is false (bit depth is same as source).
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
  let crf;
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

  // check if the file contains a hevc track
  // it will not be transcoded if true and the plugin will exit
  if (file.ffProbeData.streams.some((x) => x.codec_name?.toLowerCase() === 'hevc')) {
    response.infoLog += '☑File is already in hevc! \n';
    return response;
  }

  // if we made it to this point it is safe to assume there is no hevc stream
  response.infoLog += '☒File is not hevc!\n';
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
      response.infoLog += 'Could for some reason not detect resolution, plugin will not proceed. \n';
      return response;
  }

  const pixel10Bit = inputs.force10bit ? ' -pix_fmt p010le' : '';

  // encoding settings
  response.preset += `<io> -map 0 -dn -c:v libx265 -preset ${inputs.ffmpegPreset}`
    + ` -x265-params crf=${crf}:bframes=${inputs.bframe}:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3`
    + ` ${pixel10Bit} -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999`;

  response.infoLog += `☑File is ${file.video_resolution}, using CRF value of ${crf}!\n`;
  response.infoLog += 'File is being transcoded!\n';
  response.processFile = true;

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
