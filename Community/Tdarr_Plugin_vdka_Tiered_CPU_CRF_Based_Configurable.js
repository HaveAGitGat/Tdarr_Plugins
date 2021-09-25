function details() {
  return {
    id: 'Tdarr_Plugin_vdka_Tiered_CPU_CRF_Based_Configurable',
    Stage: 'Pre-processing',
    Name: 'Tiered FFMPEG CPU CRF Based Configurable',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `[Contains built-in filter] This plugin uses different CRF values depending on resolution, 
       the CRF value is configurable per resolution.
       FFmpeg Preset can be configured, uses slow by default. 
       ALL OPTIONS MUST BE CONFIGURED UNLESS MARKED OPTIONAL!
       If files are not in hevc they will be transcoded. 
       The output container is mkv. \n\n`,
    Version: '1.00',
    Link:
        'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/'
      + ' Tdarr_Plugin_vdka_Tiered_CPU_CRF_Based_Configurable.js',
    Tags: 'pre-processing,ffmpeg,video only,h265,configurable',

    Inputs: [
      {
        name: 'sdCRF',
        tooltip: `Enter the CRF value you want for 480p and 576p content. (0-51, lower = higher quality, bigger file)
         \\nExample:\\n 
        
        19`,
      },
      {
        name: 'hdCRF',
        tooltip: `Enter the CRF value you want for 720p content. (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        21`,
      },
      {
        name: 'fullhdCRF',
        tooltip: `Enter the CRF value you want for 1080p content. (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        23`,
      },
      {
        name: 'uhdCRF',
        tooltip: `Enter the CRF value you want for 4K/UHD/2160p content. (0-51, lower = higher quality, bigger file)
        
        \\nExample:\\n
        26`,
      },
      {
        name: 'bframe',
        tooltip: `Specify amount of b-frames to use, 0-16.
        
        \\nExample:\\n
        8`,
      },
      {
        name: 'ffmpegPreset',
        tooltip: `OPTIONAL, DEFAULTS TO SLOW IF NOT SET 
        \\n Enter the ffmpeg preset you want, leave blank for default (slow) 
        
        \\nExample:\\n 
          slow  
        
        \\nExample:\\n 
          medium  
        
        \\nExample:\\n 
          fast  
        
        \\nExample:\\n 
          veryfast`,
      },
    ],
  };
}

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  let crf = '';
  // default values that will be returned
  // eslint-disable-next-line prefer-const
  let response = {
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

  // check if the file is already hevc
  // it will not be transcoded if true and the function will be stopped immediately
  if (file.ffProbeData.streams[0].codec_name === 'hevc') {
    response.processFile = false;
    response.infoLog += '☑File is already in hevc! \n';
    return response;
  }

  // Check if preset is configured, default to slow if not
  let ffmpegPreset;
  if (inputs.ffmpegPreset === undefined) {
    ffmpegPreset = 'slow';
    response.infoLog += '☑Preset not set, defaulting to slow\n';
  } else {
    ffmpegPreset = `${inputs.ffmpegPreset}`;
    response.infoLog += `☑Preset set as ${inputs.ffmpegPreset}\n`;
  }

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
      response.processFile = false;
      return response;
  }

  // encoding settings
  response.preset += `,-map 0 -dn -c:v libx265 -preset ${ffmpegPreset}`
  + ` -x265-params crf=${crf}:bframes=${inputs.bframe}:rc-lookahead=32:ref=6:b-intra=1:aq-mode=3 -a53cc 0 -c:a copy -c:s copy -max_muxing_queue_size 9999`;
  response.infoLog += `☑File is ${file.video_resolution}, using CRF value of ${crf}!\n`;
  response.infoLog += '☒File is not hevc!\n';
  response.infoLog += 'File is being transcoded!\n';

  return response;
};
module.exports.details = details;
