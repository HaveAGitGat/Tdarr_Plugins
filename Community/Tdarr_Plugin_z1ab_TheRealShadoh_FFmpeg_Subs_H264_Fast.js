

function details() {

  return {
    id: "Tdarr_Plugin_z1ab_TheRealShadoh_FFmpeg_Subs_H264_Fast",
    Stage: "Pre-processing",
    Name: "TheRealShadoh FFmpeg Subs Fast, video MP4, audio AAC, keep subs. ",
    Type: "Video",
    Description: `[Contains built-in filter] This plugin transcodes into H264 using FFmpeg's 'Fast' preset if the file is not in H264 already. It maintains all subtitles. It removes metadata (if a title exists), and maintains all audio tracks. The output container is MP4. \n\n
`,
    Version: "1.00",
    Link: "https://github.com/TheRealShadoh/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_z1ab_TheRealShadoh_FFmpeg_Subs_H264_Fast.js",
    Tags:'pre-processing,ffmpeg,h264'
  };

}

function plugin(file) {


  // Must return this object

  var response = {

    processFile : false,
    preset : '',
    container : '.mp4',
    handBrakeMode : false,
    FFmpegMode : false,
    reQueueAfter : false,
    infoLog : ''

  };

  if (file.fileMedium !== "video") {


    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;

  } else {

     var jsonString = JSON.stringify(file);


     var hasSubs = false;


     for (var i = 0; i < file.ffProbeData.streams.length; i++) {

       try {
        let streamData = file.ffProbeData.streams[i];
        if (streamData.codec_type.toLowerCase() == "subtitle" && streamData.codec_name != "mov_text") {
          hasSubs = true;
        }
       } catch (err) {
         console.error(JSON.stringify(err));
       }
     }


     if (file.ffProbeData.streams[0].codec_name != 'h264') {

      response.infoLog += "☒File is not in h264! \n";
      response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v libx264 -preset fast -c:a aac -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;

     } else {
      response.infoLog += "☑File is already in h264! \n";
     }


     // /

     if ((file.meta.Title != undefined) && !jsonString.includes("aac") && hasSubs) {

      response.infoLog += "☒File has title metadata and no aac and subs \n";
      response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v copy -c:a aac -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
     }

     if (!jsonString.includes("aac") && hasSubs) {

      response.infoLog += "☒File has no aac track and has subs \n";
      response.preset = ', -map 0:v -map 0:s? -map 0:a -c:v copy -c:a aac -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
     }


     if (file.meta.Title != undefined && hasSubs) {

      response.infoLog += "☒File has title and has subs \n";
      response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v copy -c:a copy -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
     }


 // /
     if (file.meta.Title != undefined) {

      response.infoLog += "☒File has title metadata \n";
      response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v copy -c:a copy -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
     } else {
      response.infoLog += "☑File has no title metadata \n";
     }

     if (!jsonString.includes("aac")) {

      response.infoLog += "☒File has no aac track \n";
      response.preset = ', -map 0:v -map 0:s? -map 0:a -c:v copy -c:a aac -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;

     } else {
      response.infoLog += "☑File has aac track \n";
     }

     if (hasSubs) {

      response.infoLog += "☒File has incompatible subs \n";
      response.preset = ', -map 0:v -map 0:s? -map 0:a -c:v copy -c:a copy -c:s mov_text';
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;

     } else {
       response.infoLog += "☑File has no/compatible subs \n";
     }

     response.infoLog += "☑File meets conditions! \n";
     return response;

  }
}

module.exports.details = details;

module.exports.plugin = plugin;
