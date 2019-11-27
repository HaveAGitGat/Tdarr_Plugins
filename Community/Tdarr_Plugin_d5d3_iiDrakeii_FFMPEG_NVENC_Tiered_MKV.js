function details() {
  return {
    id: "Tdarr_Plugin_d5d3_iiDrakeii_FFMPEG_NVENC_Tiered_MKV",
    Name: "Tiered FFMPEG NVENC settings depending on resolution",
    Type: "Video",
    Operation:"Transcode",
    Description: `[Contains built-in filter] This plugin uses different FFMPEG NVENC transcoding settings for 480p,576p,720p and 1080p. If files are not in hevc they will be transcoded. The output container is mkv. \n\n`,
    Version: "1.01",
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
    reQueueAfter: false,
    infoLog: ''
  }

//check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== "video") {
    response.processFile = false
    response.infoLog += "â˜’File is not a video! \n"
    return response
  } else {
    response.infoLog += "â˜‘File is a video! \n"
  }

//check if the file is already hevc, it will not be transcoded if true and the function will be stopped immediately
  if (file.ffProbeData.streams[0].codec_name == 'hevc') {
    response.processFile = false
    response.infoLog += "â˜’File is already in hevc! \n"
    return response
  }

//file will be encoded if the resolution is 480p or 576p
//codec will be checked so it can be transcoded correctly
  if(file.video_resolution === "480p" || file.video_resolution === "576p" ) {
	if (file.video_codec_name == 'h263') {
	  response.preset = `-c:v h263_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	} 
	else if (file.video_codec_name == 'h264') {
	  response.preset = `-c:v h264_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mjpeg') {
	  response.preset = `-c:v mjpeg_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg1') {
	  response.preset = `-c:v mpeg1_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg2') {
	  response.preset = `-c:v mpeg2_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg4') {
	  response.preset = `-c:v mpeg4_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}	
	else if (file.video_codec_name == 'vc1') {
	  response.preset = `-c:v vc1_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'vp8') {
	  response.preset = `-c:v vp8_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'vp9') {
	  response.preset = `-c:v vp9_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}		
	else {
	  response.preset = `, -c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}

	transcode = 1;
  }

//file will be encoded if the resolution is 720p
//codec will be checked so it can be transcoded correctly
  if(file.video_resolution === "720p") {
	if (file.video_codec_name == 'h263') {
	  response.preset = `-c:v h263_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	} 
	else if (file.video_codec_name == 'h264') {
	  response.preset = `-c:v h264_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mjpeg') {
	  response.preset = `-c:v mjpeg_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg1') {
	  response.preset = `-c:v mpeg1_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg2') {
	  response.preset = `-c:v mpeg2_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg4') {
	  response.preset = `-c:v mpeg4_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}	
	else if (file.video_codec_name == 'vc1') {
	  response.preset = `-c:v vc1_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'vp8') {
	  response.preset = `-c:v vp8_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'vp9') {
	  response.preset = `-c:v vp9_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}		
	else {
	  response.preset = `, -c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}

	transcode = 1;
  }
	
//file will be encoded if the resolution is 1080p
//codec will be checked so it can be transcoded correctly
  if(file.video_resolution === "1080p") {
    if (file.video_codec_name == 'h263') {
	  response.preset = `-c:v h263_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
    } 
	else if (file.video_codec_name == 'h264') {
	  response.preset = `-c:v h264_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mjpeg') {
	  response.preset = `-c:v mjpeg_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg1') {
	  response.preset = `-c:v mpeg1_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg2') {
	  response.preset = `-c:v mpeg2_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'mpeg4') {
	  response.preset = `-c:v mpeg4_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
 	}	
	else if (file.video_codec_name == 'vc1') {
	  response.preset = `-c:v vc1_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'vp8') {
	  response.preset = `-c:v vp8_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}
	else if (file.video_codec_name == 'vp9') {
	  response.preset = `-c:v vp9_cuvid,-c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}		
	else {
	  response.preset = `, -c:v nvenc_hevc -pix_fmt p010le -rc:v vbr_hq -qmin 0 -cq:v 32 -preset slow -c:a copy -c:s copy`
	}

	transcode = 1;
  }
  
//check if the file is eligible for transcoding
//if true the neccessary response values will be changed 
  if (transcode == 1) {
    response.processFile = true;
    response.FFmpegMode = true
	response.reQueueAfter = true;
	response.infoLog += `â˜’File is ${file.video_resolution} but is not hevc!\n`
	response.infoLog += `â˜’File will be transcoded!\n`
  } 

  return response
}

module.exports.details = details;

module.exports.plugin = plugin;
