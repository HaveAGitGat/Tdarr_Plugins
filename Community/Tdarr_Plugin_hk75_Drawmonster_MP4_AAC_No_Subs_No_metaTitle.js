


function details() {

  return {
    id: "Tdarr_Plugin_hk75_Drawmonster_MP4_AAC_No_Subs_No_metaTitle",
    Name: "Drawmonster MP4 Stereo AAC, No Subs, No title meta data ",
    Type: "Video",
    Description: `This plugin removes subs, metadata (if a title exists) and adds a stereo 192kbit AAC track if an AAC track (any) doesn't exist. The output container is mp4. \n\n
`,
    Version: "1.03",
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

    response.infoLog += "☒File is not video \n"
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


   


     ///

     if((file.meta.Title != "undefined") && !jsonString.includes("aac") && hasSubs){

      response.infoLog += "☒File has title metadata and no aac and subs \n"
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }

     if(!jsonString.includes("aac") && hasSubs){

      response.infoLog += "☒File has no aac track and has subs \n"
      response.preset = '-sn,-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 aac -b:a:0 192k -ac 2'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }


     if(file.meta.Title != "undefined" && hasSubs){

      response.infoLog += "☒File has title and has subs \n"
      response.preset = '-sn,-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }



 ///
     if(file.meta.Title != undefined ){

      response.infoLog += "☒File has title metadata \n"
      response.preset = ',-map_metadata -1 -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response
     }else{
      response.infoLog += "☑File has no title metadata \n"
     }

     if(!jsonString.includes("aac")){

      response.infoLog += "☒File has no aac track \n"
      response.preset = ',-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 aac -b:a:0 192k -ac 2'
      response.reQueueAfter = true;
      response.processFile = true;
      return response

     }else{
      response.infoLog += "☑File has aac track \n"
     }

     if(hasSubs){

      response.infoLog += "☒File has subs \n"
      response.preset = '-sn, -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response

     }else{
      response.infoLog += "☑File has no subs \n"
     }


     if( file.container != 'mp4'){

      response.infoLog += "☒File is not in mp4 container! \n"
      response.preset = ', -c:v copy -c:a copy'
      response.reQueueAfter = true;
      response.processFile = true;
      return response


     }else{

      response.infoLog += "☑File is in mp4 container! \n"


     }


     response.infoLog += "☑File meets conditions! \n"
     return response

  }
}

module.exports.details = details;

module.exports.plugin = plugin;
