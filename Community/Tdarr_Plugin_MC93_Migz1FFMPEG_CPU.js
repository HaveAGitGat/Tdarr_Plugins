function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz1FFMPEG_CPU",
	Stage: "Pre-processing",
    Name: "Migz-Transcode Using CPU & FFMPEG",
    Type: "Video",
    Operation:"Transcode",
    Description: `Files will be transcoded using CPU with ffmpeg, settings are dependant on file bitrate, working by the logic that H265 can support the same ammount of data at half the bitrate of H264. \n\n`,
    Version: "1.1",
  Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz1FFMPEG_CPU.js",
  Tags:'pre-processing,ffmpeg,video only,configurable,h265',
	Inputs: [
     {
       name: 'container',
       tooltip: `Specify output container of file, ensure that all stream types you may have are supported by your chosen container. mkv is recommended.
	   \\nExample:\\n
	   mkv

	   \\nExample:\\n
	   mp4`


     },
	 {
       name: 'bitrate_cutoff',
       tooltip: `Specify bitrate cutoff, files with a current bitrate lower then this will not be transcoded. Rate is in kbps. Leave empty to disable.
	   \\nExample:\\n
	   6000

	   \\nExample:\\n
	   4000`


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
	
  if (inputs.container == "mkv") {
	  extraArguments += "-map -0:d "
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

  var videoIdx = 0
  var extraArguments = ""
  var bitrateSettings = ""
  var filesize = (file.file_size / 1000)
  var currentBitrate = ~~(file.file_size / (duration * 0.0075))
  var targetBitrate = ~~((file.file_size / (duration * 0.0075)) / 2)
  var minimumBitrate = ~~(targetBitrate * 0.7)
  var maximumBitrate = ~~(targetBitrate * 1.3)

  if (targetBitrate == "0") {
	  response.processFile = false
      response.infoLog += "☒Target bitrate could not be calculated. Skipping this plugin. \n"
      return response
  }

  if (inputs.bitrate_cutoff != "") {
    if (currentBitrate <= inputs.bitrate_cutoff) {
		if (file.container == inputs.container) {
	      response.processFile = false
          response.infoLog += `☑Current bitrate is below configured bitrate cutoff of ${inputs.bitrate_cutoff} & file container is already ${inputs.container}. Nothing to do, skipping. \n`
          return response
		} else {
		  response.processFile = true
		  response.preset += `, -c copy ${extraArguments}`
		  response.infoLog += `☒Current bitrate is below configured bitrate cutoff of ${inputs.bitrate_cutoff} but is not in correct container. Remuxing to ${inputs.container} but not transcoding. \n`
		  return response
	    }
    }
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
	  if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
		  if (file.ffProbeData.streams[i].codec_name == 'mjpeg') {
			  extraArguments += `-map -v:${videoIdx} `
		  }
		  if (file.ffProbeData.streams[i].codec_name == 'hevc' && file.container == inputs.container) {
			  response.processFile = false
			  response.infoLog += `☑File is already in ${inputs.container} & hevc. \n`
			  return response
			  }
		  if (file.ffProbeData.streams[i].codec_name == 'hevc' && file.container != '${inputs.container}') {
			  response.infoLog += `☒File is hevc but is not in ${inputs.container} container. Remuxing. \n`
			  response.preset = `, -map 0 -c copy ${extraArguments}`
			  response.processFile = true;
			  return response
			  }
		  videoIdx++
	  }
  }

  bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k -maxrate ${maximumBitrate}k`
  response.infoLog += `Container for output selected as ${inputs.container}. \n Current bitrate = ${~~(file.file_size / (duration * 0.0075))} \n Bitrate settings: \nTarget = ${targetBitrate} \nMinimum = ${minimumBitrate} \nMaximum = ${maximumBitrate} \n`


  response.preset += `,-map 0 -c:v libx265 ${bitrateSettings} -bufsize 2M -spatial_aq:v 1 -c:a copy -c:s copy -max_muxing_queue_size 4096 ${extraArguments}`
  response.processFile = true
  response.infoLog += `☒File is not hevc. Transcoding. \n`
  return response
}

module.exports.details = details;
module.exports.plugin = plugin;
