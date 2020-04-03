function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz5ConvertAudio",
	Stage: "Pre-processing",
    Name: "Migz-Convert audio streams",
    Type: "Audio",
	Operation: "Transcode",
    Description: `This plugin can convert any 2.0 audio track/s to AAC and can create downmixed audio tracks. \n\n`,
    Version: "2.00",
    Link: "",
    Tags:'pre-processing,ffmpeg,audio only,configurable',
	Inputs: [
     {
       name: 'aac_stereo',
       tooltip: `Specify if any 2.0 audio tracks should be converted to aac for maximum compatability with devices.
	   \\nExample:\\n
	   true

	   \\nExample:\\n
	   false`
     },
     {
       name: 'downmix',
       tooltip: `Specify if downmixing should be used to create extra audio tracks. I.e if you have an 8ch but no 2ch or 6ch, create the missing audio tracks from the 8 ch. Likewise if you only have 6ch, create the missing 2ch from it.
	   \\nExample:\\n
	   true

	   \\nExample:\\n
	   false`
     },
	]
  }
}

function plugin(file, librarySettings, inputs) {
  var response = {
    processFile: false,
    container: '.' + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  }


  if (file.fileMedium !== "video") {
    console.log("File is not video")
    response.infoLog += "☒File is not video. \n"
    response.processFile = false;
    return response
  }

  if (inputs.aac_stereo == "" && inputs.downmix == "") {
      response.infoLog += "☒Neither aac_stereo or downmix options have been configured within plugin settings, please configure required options. Skipping this plugin. \n"
      response.processFile = false
      return response
    }

    var ffmpegCommandInsert = ''
    var audioIdx = 0
    var has2Channel = false
    var has6Channel = false
    var has8Channel = false
	var convert = false

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        if (file.ffProbeData.streams[i].channels == "2") {
        has2Channel = true
        }
        if (file.ffProbeData.streams[i].channels == "6") {
        has6Channel = true
        }
        if (file.ffProbeData.streams[i].channels == "8") {
        has8Channel = true
        }
      }
    } catch (err) { }
  }

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
	  if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
		  if (inputs.downmix.toLowerCase() == "true") {
		    if (has8Channel == true && has6Channel == false && file.ffProbeData.streams[i].channels == "8") {
			    ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1 " `
                response.infoLog += "☒Audio track is 8 channel, no 6 channel exists. Creating 2 channel from 6 channel. \n"
			    convert = true
		    }
		    if (has6Channel == true && has2Channel == false && file.ffProbeData.streams[i].channels == "6") {
			    ffmpegCommandInsert += `-map 0:${i} -c:a:${audioIdx} aac -ac 2 -metadata:s:a:${audioIdx} title="2.0 " `
                response.infoLog += "☒Audio track is 6 channel, no 2 channel exists. Creating 2 channel from 6 channel. \n"
			    convert = true
		    }
		  }
		  if (inputs.aac_stereo.toLowerCase() == "true") {
		    if (file.ffProbeData.streams[i].codec_name != "aac" && file.ffProbeData.streams[i].channels == "2" ) {
	            ffmpegCommandInsert += `-c:a:${audioIdx} aac `
	            response.infoLog += "☒Audio track is 2 channel but is not AAC. Converting. \n"
			    convert = true
            }
		  }
		  audioIdx++
	  }

  }

      if (convert == true) {
        response.processFile = true;
        response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommandInsert} -strict -2 -c:s copy -max_muxing_queue_size 4096 `
       } else {
        response.infoLog += "☑File contains all required audio formats. \n"
        response.processFile = false;
      }
      return response

}

module.exports.details = details;
module.exports.plugin = plugin;
