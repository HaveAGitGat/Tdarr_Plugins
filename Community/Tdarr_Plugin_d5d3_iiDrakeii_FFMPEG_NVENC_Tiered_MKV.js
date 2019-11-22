


function details() {

  return {
    id: "Tdarr_Plugin_d5d3_iiDrakeii_FFMPEG_NVENC_Tiered_MKV",
    Name: "Tiered FFMPEG NVENC settings depending on resolution",
    Type: "Video",
    Operation:"Transcode",
    Description: `This plugin uses different FFMPEG NVENC transcoding settings for 480p,576p,720p and 1080p. If files are not in hevc they will be transcoded. The output container is mkv. \n\n`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_d5d3_iiDrakeii_FFMPEG_NVENC_Tiered_MKV.js"
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
    response.processFile = false
    response.infoLog += "☒File is not a video! \n"
    return response
  } else {
    response.infoLog += "☑File is a video! \n"
  }


  if (file.ffProbeData.streams[0].codec_name == 'hevc') {
    response.processFile = false
    response.infoLog += "☑File is already in hevc! \n"
    return response
  }

  if(file.video_resolution === "480p" || file.video_resolution === "576p" ) {

    response.processFile = true;
    response.preset = `-hwaccel cuvid ,-c:v nvenc_hevc -pix_fmt yuv420p10le -crf 32 -preset slow -c:a copy -c:s copy`
    response.container = '.mkv'
    response.handBrakeMode = false
    response.FFmpegMode = true
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution} but is not hevc! \n`
    return response
  }

  if(file.video_resolution === "720p") {
    response.processFile = true;
    response.preset = `-hwaccel cuvid ,-c:v nvenc_hevc -pix_fmt yuv420p10le -crf 30 -preset slow -c:a copy -c:s copy`
    response.container = '.mkv'
    response.handBrakeMode = false
    response.FFmpegMode = true
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution} but is not hevc! \n`
    return response
  }

  if(file.video_resolution === "1080p") {
    response.processFile = true;
    response.preset = `-hwaccel cuvid ,-c:v nvenc_hevc -pix_fmt yuv420p10le -crf 28 -preset slow -c:a copy -c:s copy`
    response.container = '.mkv'
    response.handBrakeMode = false
    response.FFmpegMode = true
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution} but is not hevc! \n`
    return response
  }

  response.processFile = false
  response.infoLog += "☑File meets conditions! \n"
  return response

  
}

module.exports.details = details;

module.exports.plugin = plugin;

