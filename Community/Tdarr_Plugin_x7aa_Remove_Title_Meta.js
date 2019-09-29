


function details() {

  return {
    id: "Tdarr_Plugin_x7aa_Remove_Title_Meta",
    Name: "Remove metadata if title exists",
    Type: "Video",
    Description: `This plugin removes metadata if title metadata is detected. \n\n
`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugin_hk75_Drawmonster_MP4_AAC_No_Subs_No_metaTitle"
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


  response.FFmpegMode = true


  if (file.fileMedium !== "video") {


    console.log("File is not video")

    response.infoLog += " File is not video"
    response.processFile = false;
    return response

  } else { 

     if((file.meta.Title != "undefined")){

      response.infoLog += " File has title metadata"
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }else{
      response.infoLog += " File has no title metadata"

     }

     response.infoLog += " File meets conditions!"
     return response

  }
}

module.exports.details = details;

module.exports.plugin = plugin;
