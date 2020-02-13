function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz3CleanAudio",
	Stage: "Pre-processing",
    Name: "Migz-Clean audio streams",
    Type: "Audio",
	Operation: "Clean",
    Description: `[TESTING]This plugin keeps only specified language audio tracks & can tags those that have an unknown language. \n\n`,
    Version: "2.00",
    Link: "",
    Tags:'pre-processing,ffmpeg,audio only,configurable',
    Inputs: [
     {
       name: 'language',
       tooltip: `Specify language tag/s here for the audio tracks you'd like to keep, recommended to keep "und" as this stands for undertermined, some files may not have the language specified. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
	   \\nExample:\\n
	   eng
	   
	   \\nExample:\\n
	   eng,und
	   
	   \\nExample:\\n
	   eng,und,jap`
     },
     {
       name: 'commentary',
       tooltip: `Specify if audio tracks that contain commentary/description should be removed.
	   \\nExample:\\n
	   true
	   
	   \\nExample:\\n
	   false`
     },
     {
       name: 'tag_language',
       tooltip: `Specify a single language for audio tracks with no language or unknown language to be tagged with, leave empty to disable, you must have "und" in your list of languages to keep for this to function. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
	   \\nExample:\\n
	   eng
	   
	   \\nExample:\\n
	   `
     },
     {
       name: 'tag_title',
       tooltip: `Specify audio tracks with no title to be tagged with the number of channels they contain. Do NOT use this with mp4, as mp4 does not support title tags.
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
    preset: '',
    container: '.' + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  }

  if (file.fileMedium !== "video") {
    console.log("File is not video")
    response.infoLog += "☒File is not video \n"
    response.processFile = false;
    return response
  } 
  
  if (inputs.language == "") {
    response.infoLog += "☒Language/s keep have not been configured within plugin settings, please configure required options. Skipping this plugin.  \n"
    response.processFile = false;
    return response
  } 
  
    var language = inputs.language.split(",")
    var ffmpegCommandInsert = ''
	var convert = false
	var audioIdx = -1
    var audioStreamsRemoved = 0
    var audioStreamCount = file.ffProbeData.streams.filter(row => (row.codec_type.toLowerCase() == "audio")).length;

    console.log("audioStreamCount:" + audioStreamCount)
	response.infoLog += `Languages to keep are ${language} \n`

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        audioIdx++
      }
    } catch (err) { }

    try {
		if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && language.indexOf(file.ffProbeData.streams[i].tags.language.toLowerCase()) === -1) {
			audioStreamsRemoved++
            ffmpegCommandInsert += `-map -0:a:${audioIdx} `
            response.infoLog += `☒Audio stream detected as being an unwanted language, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.language.toLowerCase()} \n`
            convert = true
		}
    } catch (err) { }

    try {
      if (inputs.commentary.toLowerCase() == "true" && file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && (file.ffProbeData.streams[i].tags.title.toLowerCase().includes('commentary') || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('description'))) {
        audioStreamsRemoved++       
        ffmpegCommandInsert += `-map -0:a:${audioIdx} `
        response.infoLog += `☒Audio stream detected as being Commentary or Description, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.title}. \n`
        convert = true
      }
    } catch (err) { }

    try {
    if (inputs.tag_language != "") {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].tags.language.toLowerCase().includes('und') && language.indexOf('und') !== -1) {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `
          response.infoLog += `☒Audio stream detected as having unknown language tagged, tagging as ${inputs.tag_language}. \n`
          convert = true
	    }
	  
        if (typeof file.ffProbeData.streams[i].tags.language === 'undefined' && file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `
          response.infoLog += `☒Audio stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`
          convert = true
        }
    }
    } catch (err) { }

	try {
      if (typeof file.ffProbeData.streams[i].tags.title == 'undefined' && inputs.tag_title.toLowerCase() == "true" && file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        if (file.ffProbeData.streams[i].channels == "8") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="7.1" `
          response.infoLog += `☒Audio stream detected as 8 channel audio track with no title, tagging title. Audio stream 0:a:${audioIdx} tagged as "7.1" \n`
          convert = true
          }
        if (file.ffProbeData.streams[i].channels == "6") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="5.1" `
          response.infoLog += `☒Audio stream detected as 6 channel audio track with no title, tagging title. Audio stream 0:a:${audioIdx} tagged as "5.1" \n`
          convert = true
          }
        if (file.ffProbeData.streams[i].channels == "2") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="2.0" `
          response.infoLog += `☒Audio stream detected as 2 channel audio track with no title, tagging title. Audio stream 0:a:${audioIdx} tagged as "2.0" \n`
          convert = true
          }
	    }
	} catch (err) { }
	
  }

      if (audioStreamsRemoved == audioStreamCount) {
		  response.infoLog += "☒Cancelling plugin otherwise all audio tracks would be removed. \n"
		  response.processFile = false
		  return response
	  }

      if (convert === true && (audioStreamsRemoved != audioStreamCount)) {
        response.processFile = true
        response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`
        response.container = '.' + file.container
        response.reQueueAfter = true
      } else {
        response.processFile = false
        response.infoLog += "☑File doesn't contain audio tracks which are unwanted or that require tagging.\n"
      }
      return response
}
module.exports.details = details;
module.exports.plugin = plugin;
