


function details() {

  return {
    id: "Tdarr_Plugin_e3jc_Tharic_H.264_MKV_480p30_No_Subs_No_Title_Meta",
    Name: "H.264 MKV 480p30, No Subs No, Title Meta",
    Type: "Video",
    Description: `This plugin removes subs, metadata (if a title exists) and makes sure the video is h264 480p mkv. \n\n
`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugin_e3jc_Tharic_H.264_MKV_480p30_No_Subs_No_Title_Meta"
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


     var hasSubs = false
     for (var i = 0; i < file.ffProbeData.streams.length; i++) {
 
       try {

         if(file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle"){
 
           hasSubs = true
 
         }
       } catch (err) { }
     }


//

     if(file.ffProbeData.streams[0].codec_name != 'h264' || file.ffProbeData.streams[0].width > 720 || file.ffProbeData.streams[0].height > 480 ){

      response.processFile = true;
      response.preset = '-Z "H.264 MKV 480p30"'
      response.container = '.mkv'
      response.handBrakeMode =true
      response.FFmpegMode = false
      response.reQueueAfter = true;
      response.infoLog += " File is not h264 480p!"
      return response
     }else{

      response.infoLog += " File is h264 480p!"

     }
//

     if(file.meta.Title != "undefined" && hasSubs){

      response.processFile = true;
      response.preset = '-sn,-map_metadata -1 -c:v copy -c:a copy'
      response.container = '.mkv'
      response.handBrakeMode =false
      response.FFmpegMode = true
      response.reQueueAfter = true;
      response.infoLog += "File has title and has subs"
      return response
     }else{
      response.infoLog += "File has no title and has no subs"

     }


     if(file.meta.Title != undefined ){

      response.processFile = true;
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.container = '.mkv'
      response.handBrakeMode =false
      response.FFmpegMode = true
      response.reQueueAfter = true;
      response.infoLog += " File has title metadata"
      return response


     }else{
      response.infoLog += " File has no title metadata"
     }


     if(hasSubs){

      response.processFile = true;
      response.preset = '-sn, -c:v copy -c:a copy'
      response.container = '.mkv'
      response.handBrakeMode =false
      response.FFmpegMode = true
      response.reQueueAfter = true;
      response.infoLog += " File has subs"
      return response

     }else{
      response.infoLog += " File has no subs"
     }


     if( file.container != 'mkv'){


      response.processFile = true;
      response.preset = ', -c:v copy -c:a copy'
      response.container = '.mkv'
      response.handBrakeMode =false
      response.FFmpegMode = true
      response.reQueueAfter = true;
      response.infoLog += " File is not in mkv container!"
      return response


     }else{

      response.infoLog += " File is in mkv container!"

     }


     response.processFile = false;
     response.infoLog += " File meets conditions!"
     return response

  }
}

module.exports.details = details;

module.exports.plugin = plugin;
