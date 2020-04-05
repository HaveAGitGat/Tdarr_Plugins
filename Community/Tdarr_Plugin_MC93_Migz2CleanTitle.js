function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz2CleanTitle",
    Stage: "Pre-processing",
    Name: "Migz-Clean title metadata",
    Type: "Video",
	Operation: "Clean",
    Description: `This plugin removes title metadata from video/audio/subtitles, if it exists. Video checking is mandatory, audio and subtitles are optional.\n\n`,
    Version: "1.20",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz2CleanTitle.js",
    Tags:'pre-processing,ffmpeg,configurable',
    Inputs: [
       {
         name: 'clean_audio',
         tooltip: `Specify if audio titles should be checked & cleaned. Optional.
  	   \\nExample:\\n
  	   true

  	   \\nExample:\\n
  	   false`
       },
  	 {
         name: 'clean_subtitles',
         tooltip: `Specify if subtitle titles should be checked & cleaned. Optional.
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
     processFile : false,
     preset : '',
     container: '.' + file.container,
     handBrakeMode : false,
     FFmpegMode : true,
     reQueueAfter : false,
     infoLog : '',

  }

  var ffmpegCommandInsert = ''
  var videoIdx = 0
  var audioIdx = 0
  var subtitleIdx = 0
  var convert = false

  if (file.fileMedium !== "video") {
    console.log("File is not video")
    response.infoLog += "☒File is not video \n"
    response.processFile = false;
    return response
  }

    if (typeof file.meta.Title != 'undefined') try {
	    ffmpegCommandInsert += ` -metadata title="" `
	    convert = true
    } catch (err) { }

  for (var i = 0; i < file.ffProbeData.streams.length; i++) try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
		    if (typeof file.ffProbeData.streams[i].tags.title != 'undefined') {
			    response.infoLog += `☒Video stream title is not empty, most likely junk metadata. Removing title from stream ${i} \n`
			    ffmpegCommandInsert += ` -metadata:s:v:${videoIdx} title="" `
	  	        convert = true
            }
     		videoIdx++
		}

		if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && inputs.clean_audio.toLowerCase() == "true") {
			if (file.ffProbeData.streams[i].tags.title.split('.').length-1 > 3) {
				response.infoLog += `☒More then 3 full stops detected in subtitle title, likely to be junk metadata. Removing title from stream ${i} \n`
				ffmpegCommandInsert += ` -metadata:s:a:${audioIdx} title="" `
	  	        convert = true
			}
     		audioIdx++
		}

		if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" && inputs.clean_subtitles.toLowerCase() == "true") {
			if (file.ffProbeData.streams[i].tags.title.split('.').length-1 > 3) {
				response.infoLog += `☒More then 3 full stops detected in subtitle title, likely to be junk metadata. Removing title from stream ${i} \n`
				ffmpegCommandInsert += ` -metadata:s:s:${subtitleIdx} title="" `
	  	        convert = true
		}
     		subtitleIdx++
		}
    } catch (err) { }

   if (convert == true) {
    response.infoLog += "☒File has title metadata. Removing \n"
    response.preset = `,${ffmpegCommandInsert} -c copy -max_muxing_queue_size 4096`
    response.reQueueAfter = true;
    response.processFile = true;
    } else {
    response.infoLog += "☑File has no title metadata \n"
    }
    return response
}

module.exports.details = details;
module.exports.plugin = plugin;
