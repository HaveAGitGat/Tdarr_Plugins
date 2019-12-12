function details() {
  return {
    id: "Tdarr_Plugin_d5d3_iiDrakeii_FFMPEG_NVENC_Tiered_MKV",
    Name: "Tiered FFMPEG NVENC settings depending on resolution",
    Type: "Video",
    Operation:"Transcode",
    Description: `[Contains built-in filter] This plugin uses different FFMPEG NVENC transcoding settings for 480p,576p,720p,1080p and 4KUHD. If files are not in hevc they will be transcoded. The output container is mkv. \n\n`,
    Version: "1.07",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_d5d3_iiDrakeii_FFMPEG_NVENC_Tiered_MKV.js"
  }
}
   
function plugin(file) {
  var transcode = 0; //if this var changes to 1 the file will be transcoded
 
//default values that will be returned
  var response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: ''
  }
   
//check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== "video") {
    response.processFile = false
    response.infoLog += "☒File is not a video! \n"
    return response
  } else {
    response.infoLog += "☑File is a video! \n"
  }
   
//check if the file is already hevc, it will not be transcoded if true and the function will be stopped immediately
  if (file.ffProbeData.streams[0].codec_name == 'hevc') {
    response.processFile = false
    response.infoLog += "☑File is already in hevc! \n"
    return response
  }
 
//codec will be checked so it can be transcoded correctly
  if (file.video_codec_name == 'h263') {
    response.preset = `-c:v h263_cuvid`
  }
  else if (file.video_codec_name == 'h264') {
    if (file.ffProbeData.streams[0].profile != 'High 10') { //Remove HW Decoding for High 10 Profile
      response.preset = `-c:v h264_cuvid`
    }
  }
  else if (file.video_codec_name == 'mjpeg') {
    response.preset = `c:v mjpeg_cuvid`
  }
  else if (file.video_codec_name == 'mpeg1') {
    response.preset = `-c:v mpeg1_cuvid`
  }
  else if (file.video_codec_name == 'mpeg2') {
    response.preset = `-c:v mpeg2_cuvid`
  }
// skipping this one because it's empty
//  else if (file.video_codec_name == 'mpeg4') {
//    response.preset = ``
//  }  
  else if (file.video_codec_name == 'vc1') {
    response.preset = `-c:v vc1_cuvid`
  }
  else if (file.video_codec_name == 'vp8') {
    response.preset = `-c:v vp8_cuvid`
  }
  else if (file.video_codec_name == 'vp9') {
    response.preset = `-c:v vp9_cuvid`
  }
   
//file will be encoded if the resolution is 480p or 576p
//codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "480p" || file.video_resolution === "576p" ) {
    response.preset += `,-map 0 -c:v hevc_nvenc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 29 -b:v 500k -maxrate:v 1500k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -c:a copy -c:s copy`
    transcode = 1;
  }
   
//file will be encoded if the resolution is 720p
//codec will be checked so it can be transcoded correctly
  if(file.video_resolution === "720p") {
    response.preset += `,-map 0 -c:v hevc_nvenc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 30 -b:v 2000k -maxrate:v 4000k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -c:a copy -c:s copy`
    transcode = 1;
  }
     
//file will be encoded if the resolution is 1080p
//codec will be checked so it can be transcoded correctly
  if(file.video_resolution === "1080p") {
    response.preset += `,-map 0 -c:v hevc_nvenc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 31 -b:v 2500k -maxrate:v 5000k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -c:a copy -c:s copy`
    transcode = 1;
  }
  //file will be encoded if the resolution is 4K
//codec will be checked so it can be transcoded correctly
  if(file.video_resolution === "4KUHD") {
    response.preset += `,-map 0 -c:v hevc_nvenc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 31 -b:v 14000k -maxrate:v 20000k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -c:a copy -c:s copy`
    transcode = 1;
  }
   
//check if the file is eligible for transcoding
//if true the neccessary response values will be changed
  if (transcode == 1) {
    response.processFile = true;
    response.FFmpegMode = true
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution} but is not hevc!\n`
    response.infoLog += `File is being transcoded!\n`
  }
 
  return response
}
   
module.exports.details = details;
module.exports.plugin = plugin;
