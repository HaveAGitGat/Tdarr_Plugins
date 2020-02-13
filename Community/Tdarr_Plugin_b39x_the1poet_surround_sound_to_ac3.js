


function details() {

  return {
    id: "Tdarr_Plugin_b39x_the1poet_surround_sound_to_ac3",
    Stage: "Pre-processing",
    Name: "the1poet Video surround sound to ac3",
    Type: "Video",
    Description: `[Contains built-in filter]  If the file has surround sound tracks not in ac3, they will be converted to ac3. \n\n
`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_b39x_the1poet_surround_sound_to_ac3.js",
    Tags:'pre-processing,ffmpeg,audio only,',
  }

}

function plugin(file) {


  //Must return this object

  var response = {

    processFile: false,
    preset: '',
    container: '.mp4',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',

  }


  if (file.fileMedium !== "video") {


    console.log("File is not video")

    response.infoLog += "☒File is not video \n"
    response.processFile = false;

    return response

  } else {


    var audioIdx = -1
    var ffmpegCommandInsert = ''
    var hasnonAC3SurroundTrack = false

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {

      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
          audioIdx++
        }
      } catch (err) { 
         console.error(JSON.stringify(err));
}


      try {
        if (  file.ffProbeData.streams[1].channels >= 6 && file.ffProbeData.streams[i].codec_name !== 'ac3' && file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" ) {
          ffmpegCommandInsert += ` -c:a:${audioIdx} ac3 `
          hasnonAC3SurroundTrack = true

        }
      } catch (err) { 
         console.error(JSON.stringify(err));
}

    }

    var ffmpegCommand = `,-map 0 -c:v copy  -c:a copy ${ffmpegCommandInsert} -c:s copy -c:d copy`

    if (hasnonAC3SurroundTrack == true) {

      response.processFile = true;
      response.preset = ffmpegCommand
      response.container = '.' + file.container
      response.handBrakeMode = false
      response.FFmpegMode = true
      response.reQueueAfter = true;
      response.infoLog += "☒ File has surround audio which is not in ac3! \n"
      return response



    } else {
      response.infoLog += "☑ All surround audio streams are in aac! \n"
    }





    response.infoLog += "☑File meets conditions! \n"
    return response

  }
}

module.exports.details = details;

module.exports.plugin = plugin;
