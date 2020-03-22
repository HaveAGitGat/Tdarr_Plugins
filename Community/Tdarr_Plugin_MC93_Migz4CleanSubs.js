function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz4CleanSubs",
	Stage: "Pre-processing",
    Name: "Migz-Clean subtitle streams",
    Type: "subtitless",
	Operation: "Clean",
    Description: `This plugin keeps only specified language subtitle tracks & can tag those that have an unknown language. \n\n`,
    Version: "2.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz4CleanSubs.js",
    Tags:'pre-processing,ffmpeg,subtitle only,configurable',
    Inputs: [
     {
       name: 'language',
       tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
	   \\nExample:\\n
	   eng
	   
	   \\nExample:\\n
	   eng,jap`
     },
     {
       name: 'commentary',
       tooltip: `Specify if subtitle tracks that contain commentary/description should be removed.
	   \\nExample:\\n
	   true
	   
	   \\nExample:\\n
	   false`
     },
     {
       name: 'tag_title',
       tooltip: `Specify a single language for subtitle tracks with no language or unknown language to be tagged with, leave empty to disable. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
	   	   \\nExample:\\n
	   eng
	   
	   \\nExample:\\n
	   por`
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
  var subtitleIdx = -1
  var convert = false

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
	   try {
            if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
                subtitleIdx++
            }
	    } catch (err) { }

       try {
		    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" && language.indexOf(file.ffProbeData.streams[i].tags.language.toLowerCase()) === -1) {
                ffmpegCommandInsert += `-map -0:s:${subtitleIdx} `
                response.infoLog += `☒Subtitle stream detected as being an unwanted language, removing. Subtitle stream 0:s:${subtitleIdx} - ${file.ffProbeData.streams[i].tags.language.toLowerCase()} \n`
                convert = true
		    }
        } catch (err) { }
	
       try {
            if (inputs.commentary.toLowerCase() == "true" && file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" && (file.ffProbeData.streams[i].tags.title.toLowerCase().includes('commentary') || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('description') || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh'))) {
                ffmpegCommandInsert += `-map -0:s:${subtitleIdx} `
                response.infoLog += `☒Subtitle stream detected as being Commentary or Description, removing. Subtitle stream 0:s:${SubtitleIdx} - ${file.ffProbeData.streams[i].tags.title}. \n`
                convert = true
        }
        } catch (err) { }

       try {
            if (inputs.tag_title != "") {
                if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle" && file.ffProbeData.streams[i].tags.language.toLowerCase().includes('und')) {
                    ffmpegCommandInsert += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_title} `
                    response.infoLog += `☒Subtitle stream detected as having unknown language tagged, tagging as ${inputs.tag_title}. \n`
                    convert = true
	            }
			}
        } catch (err) { }
	  
        try {
             if (typeof file.ffProbeData.streams[i].tags.language == 'undefined' && file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
                 ffmpegCommandInsert += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_title} `
                 response.infoLog += `☒Subtitle stream detected as having no language tagged, tagging as ${inputs.tag_title}. \n`
                 convert = true
                }
        } catch (err) { }
    }
  if (convert === true ) {
      response.processFile = true;
      response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`
      response.container = '.' + file.container
      response.reQueueAfter = true;
    } else {
      response.processFile = false;
      response.infoLog += "☑File doesn't contain subtitle tracks which are unwanted or that require tagging.\n"
    }
      return response
}
module.exports.details = details;
module.exports.plugin = plugin;
