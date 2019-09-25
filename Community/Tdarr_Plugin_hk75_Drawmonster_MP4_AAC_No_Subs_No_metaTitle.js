


function details() {

  return {
    id: "Tdarr_Plugin_hk75_Drawmonster_MP4_AAC_No_Subs_No_metaTitle",
    Name: "Drawmonster MP4 AAC, No Subs, No title meta data ",
    Type: "Video",
    Description: `This plugin removes subs, metadata (if a title exists) and adds an AAC track if one doesn't exist. The output container is mp4. \n\n
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

     var jsonString = JSON.stringify(file)


     console.log("file.meta.Title:"+file.meta.Title)


     ///

     if((file.meta.Title != "undefined") && !jsonString.includes("aac") && jsonString.includes("subrip")){

      response.infoLog += " File has title metadata and no aac and subs"
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }

     if(!jsonString.includes("aac") && jsonString.includes("subrip")){

      response.infoLog += "File has no aac track and has subs"
      response.preset = '-sn,-map 0:v -c:v copy -map 0:a -c:a copy -map 0:a -strict -2 -c:a aac'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }


     if(file.meta.Title != "undefined" && jsonString.includes("subrip")){

      response.infoLog += "File has title and has subs"
      response.preset = '-sn,-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }



 ///
     if(file.meta.Title != undefined ){

      response.infoLog += " File has title metadata"
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }else{
      response.infoLog += " File has no title metadata"
     }

     if(!jsonString.includes("aac")){

      response.infoLog += " File has no aac track"
      response.preset = ',-map 0:v -c:v copy -map 0:a -c:a copy -map 0:a -strict -2 -c:a aac'
      response.reQueueAfter = true;
      response.processFile = true;
      return response

     }else{
      response.infoLog += " File has aac track"
     }

     if(jsonString.includes("subrip")){

      response.infoLog += " File has subs"
      response.preset = '-sn, -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response

     }else{
      response.infoLog += " File has no subs"
     }


     response.infoLog += " File meets conditions!"
     return response

  }
}

module.exports.details = details;

module.exports.plugin = plugin;