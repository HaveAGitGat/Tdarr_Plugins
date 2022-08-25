/* eslint-disable */
const details = () => {
  return {
    id: 'Tdarr_Plugin_Soggys_NVENC_HEVC_CQV_Optimised_Bitrate',
    Stage: 'Pre-processing',
    Name: 'Soggys NVENC HEVC CQ:V Optimised Bitrate',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `[Contains built-in filter] This plugin used nvenc and transcodes based on specificed CQ:V value.
     Will transcode if bitrate is greater than "optimized bitrate". Optimal bitrate accounts for fps and resolution.
     Optimized bitrate can be configured using targetCodecCompression. Smaller values target lower bitrates.
     FFmpeg Preset can be configured, uses slow by default.
     Low res files (720p or below) will not be transcoded
     If files are not in hevc they will be transcoded.
     The output container is mkv.
     Note that you will get an "infinite transcode loop" error if target codec compression is too low compared to CQ:V or CQ:V is too low compared to compression.
     Basically: If you increment target codec compression you can lower cqv for higher quality and vice versa.
     Thanks to JB and vdka for their plugins, this uses code from their work.\n\n`,
    Version: '1.00',
    Tags: 'pre-processing,ffmpeg,video only,nvenc h265,configurable',

    Inputs: [
      {
        name: 'targetCodecCompression',
        type: 'number',
        defaultValue: 0.12,
        inputUI: {
          type: 'text',
        },
        tooltip: `This effects the target bitrate by assuming a compression ratio.

      \\nExample:\\n
      0.08`
      },
      {
        name: 'cqv',
        type: 'string',
        defaultValue: '28',
        inputUI: {
          type: 'text',
        },
        tooltip: `Enter the CQ:V value, lower is higher quality.

      \\nExample:\\n
      28`
      },
      {
        name: 'bframe',
        type: 'string',
        defaultValue: '0',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify amount of b-frames to use, 0-5. Use 0 to disable. (GPU must support this, turing and newer supports this, except for the 1650)

      \\nExample:\\n
      3`
      },
      {
        name: 'ffmpeg_preset',
        type: 'string',
        defaultValue: 'medium',
        inputUI: {
          type: 'text',
        },
        tooltip: `OPTIONAL, DEFAULTS TO MEDIUM IF NOT SET
      \\n Enter the ffmpeg preset you want, leave blank for default (medium)

      \\nExample:\\n
        slow

      \\nExample:\\n
        medium

      \\nExample:\\n
        fast

      \\nExample:\\n
        veryfast`
      }
    ]
  }
}

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {

    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var subcli = `-c:s copy`
  var maxmux = ''
  var map = '-map 0'
  var cqvinuse = ''
  //default values that will be returned
  var response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: '',
  }

  const streamHeight = file.ffProbeData.streams[0].height;
  const streamWidth = file.ffProbeData.streams[0].width;
  const streamFPS = file.mediaInfo.track[0].FrameRate;
  let streamBR = file.bit_rate;

  //check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== 'video') {
    response.processFile = false
    response.infoLog += '☒File is not a video! \n'
    return response
  } else {
    // bitrateprobe = file.ffProbeData.streams[0].bit_rate;
    response.infoLog += '☑File is a video! \n'
  }

  optimalVideoBitrate = Math.floor((streamHeight * streamWidth * streamFPS) * inputs.targetCodecCompression);
  response.infoLog += 'Optimal Bitrate = ' + (optimalVideoBitrate / 1000000).toString() + '\n'
  response.infoLog += 'Stream Bitrate = ' + (streamBR / 1000000).toString() + '\n'
  if (file.ffProbeData.streams[0].codec_name == 'hevc'
  && (isNaN(optimalVideoBitrate) || isNaN(streamBR) || streamBR < optimalVideoBitrate)) {
    response.processFile = false
    response.infoLog += '☑File is already in hevc and is below optimal bitrate!\n'
    return response
  }
  else if (file.ffProbeData.streams[0].codec_name == 'hevc'
  && (file.video_resolution === '480p' || file.video_resolution === '576p' || file.video_resolution === '720p')) {
    response.processFile = false
    response.infoLog += '☑File is low res, wont transcode!\n'
    return response
  }

  // Check if preset is configured, default to slow if not
  var ffmpeg_preset
  if (inputs.ffmpeg_preset === undefined) {
    ffmpeg_preset = `slow`
    response.infoLog += '☑Preset not set, defaulting to slow\n'
  } else {
    ffmpeg_preset = `${inputs.ffmpeg_preset}`
    response.infoLog += `☑Preset set as ${inputs.ffmpeg_preset}\n`
  }

  //codec will be checked so it can be transcoded correctly
  if (file.video_codec_name == 'h263') {
    response.preset = `-c:v h263_cuvid`
  } else if (file.video_codec_name == 'h264') {
    if (file.ffProbeData.streams[0].profile != 'High 10') {
      //Remove HW Decoding for High 10 Profile
      response.preset = `-c:v h264_cuvid`
    }
  } else if (file.video_codec_name == 'mjpeg') {
    response.preset = `-c:v mjpeg_cuvid`
  } else if (file.video_codec_name == 'mpeg1') {
    response.preset = `-c:v mpeg1_cuvid`
  } else if (file.video_codec_name == 'mpeg2') {
    response.preset = `-c:v mpeg2_cuvid`
  } else if (file.video_codec_name == 'vc1') {
    response.preset = `-c:v vc1_cuvid`
  } else if (file.video_codec_name == 'vp8') {
    response.preset = `-c:v vp8_cuvid`
  } else if (file.video_codec_name == 'vp9') {
    response.preset = `-c:v vp9_cuvid`
  } else if (file.video_codec_name == 'hevc') {
    if (file.ffProbeData.streams[0].profile != 'High 10') {
      response.preset = `-c:v hevc_cuvid`
    }
  }

  //Set Subtitle Var before adding encode cli
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == 'mov_text' &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == 'subtitle'
      ) {
        subcli = `-c:s srt`
      }
    } catch (err) {}
    //mitigate TrueHD audio causing Too many packets error
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == 'truehd' ||
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'dts' &&
          file.ffProbeData.streams[i].profile.toLowerCase() == 'dts-hd ma') ||
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'aac' &&
          file.ffProbeData.streams[i].sample_rate.toLowerCase() == '44100' &&
          file.ffProbeData.streams[i].codec_type.toLowerCase() == 'audio')
      ) {
        maxmux = ` -max_muxing_queue_size 9999`
      }
    } catch (err) {}
    //mitigate errors due to embeded pictures
    try {
      if (
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'png' ||
          file.ffProbeData.streams[i].codec_name.toLowerCase() == 'bmp' ||
          file.ffProbeData.streams[i].codec_name.toLowerCase() == 'mjpeg') &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == 'video'
      ) {
        map = `-map 0:v:0 -map 0:a -map 0:s?`
      }
    } catch (err) {}
  }

  cqvinuse = `${inputs.sdCQV}`
  response.preset += `,${map} -dn -c:v hevc_nvenc -b:v 0 -preset ${ffmpeg_preset} -cq ${inputs.cqv} -rc-lookahead 32 -bf ${inputs.bframe} -a53cc 0 -c:a copy ${subcli}${maxmux} -pix_fmt p010le`

  response.processFile = true
  response.FFmpegMode = true
  response.reQueueAfter = true
  response.infoLog += `File is being transcoded!\n`

  return response
}


module.exports.details = details;
module.exports.plugin = plugin;
