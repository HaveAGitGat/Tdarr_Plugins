function details() {
  return {
    id: "Tdarr_Plugin_MC93_MigzImageRemoval",
	Stage: "Pre-processing",
    Name: "Migz-Remove image formats from file",
    Type: "Video",
    Operation:"Clean",
    Description: `Identify any unwanted image formats in the file and remove those streams. MJPEG & PNG \n\n`,
    Version: "1.0",
  Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_MigzImageRemoval.js",
  Tags:'pre-processing,ffmpeg,video only'
  }
}

function plugin(file, librarySettings, inputs) {
   var response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    container: '.' + file.container,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: ''
  }

  if (file.fileMedium !== "video") {
      response.processFile = false
      response.infoLog += "☒File is not a video. \n"
      return response
    }

  var videoIdx = 0
  var extraArguments = ""
  var convert = false

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
	  if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
		  if (file.ffProbeData.streams[i].codec_name == 'mjpeg' || file.ffProbeData.streams[i].codec_name == 'png') {
        convert = true
			  extraArguments += `-map -v:${videoIdx} `
		  }
		  videoIdx++
	  }
  }

  if (convert === true ) {
      response.preset += `,-map 0 -c copy -max_muxing_queue_size 4096 ${extraArguments}`
      response.infoLog += `☒File has image format stream, removing. \n`
      response.processFile = true;
    } else {
      response.processFile = false;
      response.infoLog += "☑File doesn't contain any unwanted image format streams.\n"
    }
      return response
}



module.exports.details = details;
module.exports.plugin = plugin;
