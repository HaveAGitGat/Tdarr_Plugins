function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz1FFMPEG",
	Stage: "Pre-processing",
    Name: "Migz-Transcode Using Nvidia GPU & FFMPEG",
    Type: "Video",
    Operation:"Transcode",
    Description: `[TESTING]Files will be transcoded using Nvidia GPU with ffmpeg, settings are dependant on file bitrate, working by the logic that H265 can support the same ammount of data at half the bitrate of H264. NVDEC & NVENC compatable GPU required. \n\n`,
    Version: "2.00",
  Link: "",
  Tags:'pre-processing,ffmpeg,video only,h265,nvenc h265,configurable',
	Inputs: [
     {
       name: 'container',
       tooltip: `Specify output container of file, ensure that all stream types you may have are supported by your chosen container. mkv is recommended.
	   \\nExample:\\n
	   mkv
	   
	   \\nExample:\\n
	   mp4`
	   
	   
     },
	 ]
  }
}
   
function plugin(file, librarySettings, inputs) {
   var response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: ''
  }

  if (inputs.container == "") {
      response.infoLog += "☒Container has not been configured within plugin settings, please configure required options. Skipping this plugin. \n"
      response.processFile = false
      return response
    } else {
	  response.container = '.' + inputs.container
	}
   
  if (file.fileMedium !== "video") {
      response.processFile = false
      response.infoLog += "☒File is not a video. \n"
      return response
    }

  if (typeof file.meta.Duration != 'undefined') {
	  var duration = (file.meta.Duration * 0.0166667)
  } else {
	  var duration = (file.ffProbeData.streams[0].duration * 0.0166667)
  }

  var bitrateSettings = ""
  var filesize = (file.file_size / 1000)
  var targetBitrate = ~~((file.file_size / (duration * 0.0075)) / 2)
  var minimumBitrate = ~~(targetBitrate * 0.7)
  var maximumBitrate = ~~(targetBitrate * 1.3)
  
  if (targetBitrate == "0") {
	  response.processFile = false
      response.infoLog += "☒Target bitrate could not be calculated. Skipping this plugin. \n"
      return response
  }
  
  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k -maxrate ${maximumBitrate}k`
  response.infoLog += `Container for output selected as ${inputs.container}. \n Current bitrate = ${~~(file.file_size / (duration * 0.0075))} \n Bitrate settings: \nTarget = ${targetBitrate} \nMinimum = ${minimumBitrate} \nMaximum = ${maximumBitrate} \n`

  if (file.ffProbeData.streams[0].codec_name == 'hevc' && file.container == inputs.container) {
      response.processFile = false
      response.infoLog += `☑File is already in ${inputs.container} & hevc. \n`
      return response
    }
  
  if (file.ffProbeData.streams[0].codec_name == 'hevc' && file.container != '${inputs.container}') {
      response.infoLog += `☒File is hevc but is not in ${inputs.container} container. Remuxing. \n`
      response.preset = ', -map 0 -c copy'
      response.processFile = true;
      return response
    }
 
//codec will be checked so it can be transcoded correctly
  if (file.video_codec_name == 'h263') {
      response.preset = `-c:v h263_cuvid`
    }
  else if (file.video_codec_name == 'h264') {
    if (file.ffProbeData.streams[0].profile != 'High 10') { //if a h264 coded video is not HDR
      response.preset = `-c:v h264_cuvid`
    }
  }
  else if (file.video_codec_name == 'mjpeg') {
    response.preset = `c:v mjpeg_cuvid`
  }
  else if (file.video_codec_name == 'mpeg1') {
    response.preset = `-c:v mpeg1_cuvid`
  }
  else if (file.video_codec_name == 'mpeg2') {
    response.preset = `-c:v mpeg2_cuvid`
  }
  else if (file.video_codec_name == 'vc1') {
    response.preset = `-c:v vc1_cuvid`
  }
  else if (file.video_codec_name == 'vp8') {
    response.preset = `-c:v vp8_cuvid`
  }
  else if (file.video_codec_name == 'vp9') {
    response.preset = `-c:v vp9_cuvid`
  }
  
  if (inputs.container == "mkv") {
	  extraArguments = "-map -0:d "
  }
  
  response.preset += `,-map 0 -c:v hevc_nvenc -rc:v vbr_hq ${bitrateSettings} -bufsize 2M -spatial_aq:v 1 -c:a copy -c:s copy -max_muxing_queue_size 4096 ${extraArguments}`
  response.processFile = true
  response.infoLog += `☒File is not hevc. Transcoding. \n`
  return response
}
   
module.exports.details = details;
module.exports.plugin = plugin;
