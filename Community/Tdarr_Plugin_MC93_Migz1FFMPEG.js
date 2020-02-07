function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz1FFMPEG",
	Stage: "Pre-processing",
    Name: "Migz-Transcode Using Nvidia GPU & FFMPEG",
    Type: "Video",
    Operation:"Transcode",
    Description: `[TESTING]Files will be transcoded using Nvidia GPU with ffmpeg, settings are dependant on current file size. NVDEC & NVENC compatable GPU required. \n\n`,
    Version: "2.00",
	Link: "",
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

  var bitrateSettings = ""
  
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
  
	response.infoLog += `Container for video selected as ${inputs.container}. \n`

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
  
  if (file.file_size >= "30000") {
	bitrateSettings = "-b:v 30M -minrate 20M"
    } else if (file.file_size < "30000" && file.file_size >= "25000") {
	bitrateSettings = "-b:v 15M -minrate 10M -maxrate 20M"
    } else if (file.file_size < "25000" && file.file_size >= "20000") {
	bitrateSettings = "-b:v 12M -minrate 8M -maxrate 16M"
    } else if (file.file_size < "20000" && file.file_size >= "15000") {
	bitrateSettings = "-b:v 10M -minrate 7M -maxrate 13M"
    } else if (file.file_size < "15000" && file.file_size >= "10000") {
	bitrateSettings = "-b:v 8M -minrate 6M -maxrate 10M"
    } else if (file.file_size < "10000" && file.file_size >= "8000") {
	bitrateSettings = "-b:v 5M -minrate 3M -maxrate 8M"
	} else if (file.file_size < "8000" && file.file_size >= "6000") {
	bitrateSettings = "-b:v 4M -minrate 2M -maxrate 6M"
	} else if (file.file_size < "6000" && file.file_size >= "2000") {
	bitrateSettings = "-b:v 3M -minrate 1M -maxrate 5M"
	} else if (file.file_size < "2000" && file.file_size >= "500") {
	bitrateSettings = "-b:v 1M -minrate 500k -maxrate 2M"
	} else if (file.file_size < "500" ) {
	bitrateSettings = "-b:v 250K -minrate 100k -maxrate 500k"
    }
   
  response.preset += `,-map 0 -c:v hevc_nvenc -rc:v vbr_hq ${bitrateSettings} -bufsize 2M -spatial_aq:v 1 -c:a copy -c:s copy -max_muxing_queue_size 4096`
  response.processFile = true
  response.infoLog += `☒File is not hevc. Transcoding. \n`
  return response
}
   
module.exports.details = details;
module.exports.plugin = plugin;
