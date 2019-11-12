


function details() {

  return {
    id: "Tdarr_Plugin_b38x_Nosirus_h265_aac_no_meta",
    Name: "Nosirus h265, aac, no meta, subs kept",
    Type: "Video",
    Description: `If the file is not in h265 it will be trancoded into h265 with HandBrake using the following command '-e x265 -q 22 --encoder-preset slow --all-audio --all-subtitles copy:aac -E fdk_aac -Q 4 -x aq-mode=3'. If no aac, aac track will be added. Subtitles are kept. Metadata is removed.\n\n
`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugin_b38x_Nosirus_h265_aac_no_meta"
  }

}

function plugin(file) {


  //Must return this object

  var response = {

     processFile : false,
     preset : '',
     container : '.mp4',
     handBrakeMode : false,
     FFmpegMode : false,
     reQueueAfter : false,
     infoLog : '',

  }


  if (file.fileMedium !== "video") {


    console.log("File is not video")

    response.infoLog += "☒File is not video \n"
    response.processFile = false;

    return response

  } else { 

     var jsonString = JSON.stringify(file)


     if(file.ffProbeData.streams[0].codec_name != 'hevc'){

        response.processFile = true;
        response.preset = '-e x265 -q 22 --encoder-preset slow --all-audio --all-subtitles copy:aac -E fdk_aac -Q 4 -x aq-mode=3'
        response.container = '.mkv'
        response.handBrakeMode =true
        response.FFmpegMode = false
        response.reQueueAfter = true;
        response.infoLog += "☒File is not in hevc! \n"
        return response

     }else{
      response.infoLog += "☑File is already in hevc! \n"
     }


     if(file.meta.Title != undefined ){

      response.infoLog += "☒File has title metadata \n"
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true
      return response
     }else{
      response.infoLog += "☑File has no title metadata \n"
     }


     response.infoLog += "☑File meets conditions! \n"
     return response

  }
}

module.exports.details = details;

module.exports.plugin = plugin;
