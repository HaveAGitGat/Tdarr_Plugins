/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_d5d3_iiDrakeii_FFMPEG_NVENC_Tiered_MKV",
    Stage: "Pre-processing",
    Name: "Tiered FFMPEG NVENC Settings Depending On Resolution",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin uses different FFMPEG NVENC transcoding settings for 480p,576p,720p,1080p and 4KUHD. If files are not in hevc they will be transcoded. The output container is mkv. \n\n`,
    Version: "1.09",
    Tags: "pre-processing,ffmpeg,video only,nvenc h265",
    Inputs:[],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var transcode = 0; //if this var changes to 1 the file will be transcoded
  var bitrateprobe = 0; //bitrate from ffprobe
  var bitratetarget = 0;
  var bitratemax = 0;
  var bitratecheck = 0;
  var subcli = `-c:s copy`;
  var maxmux = "";
  var map = "-map 0";
  //default values that will be returned
  var response = {
    processFile: false,
    preset: "",
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: "",
    maxmux: false,
  };

  //check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== "video") {
    response.processFile = false;
    response.infoLog += "☒File is not a video! \n";
    return response;
  } else {
    bitrateprobe = file.ffProbeData.streams[0].bit_rate;
    response.infoLog += "☑File is a video! \n";
  }

  //check if the file is already hevc, it will not be transcoded if true and the function will be stopped immediately
  if (file.ffProbeData.streams[0].codec_name == "hevc") {
    response.processFile = false;
    response.infoLog += "☑File is already in hevc! \n";
    return response;
  }

  //codec will be checked so it can be transcoded correctly
  if (file.video_codec_name == "h263") {
    response.preset = `-c:v h263_cuvid`;
  } else if (file.video_codec_name == "h264") {
    if (file.ffProbeData.streams[0].profile != "High 10") {
      //Remove HW Decoding for High 10 Profile
      response.preset = `-c:v h264_cuvid`;
    }
  } else if (file.video_codec_name == "mjpeg") {
    response.preset = `c:v mjpeg_cuvid`;
  } else if (file.video_codec_name == "mpeg1") {
    response.preset = `-c:v mpeg1_cuvid`;
  } else if (file.video_codec_name == "mpeg2") {
    response.preset = `-c:v mpeg2_cuvid`;
  }
  // skipping this one because it's empty
  //  else if (file.video_codec_name == 'mpeg4') {
  //    response.preset = ``
  //  }
  else if (file.video_codec_name == "vc1") {
    response.preset = `-c:v vc1_cuvid`;
  } else if (file.video_codec_name == "vp8") {
    response.preset = `-c:v vp8_cuvid`;
  } else if (file.video_codec_name == "vp9") {
    response.preset = `-c:v vp9_cuvid`;
  }

  //Set Subtitle Var before adding encode cli
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == "mov_text" &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle"
      ) {
        subcli = `-c:s srt`;
      }
    } catch (err) {}
    //mitigate TrueHD audio causing Too many packets error
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == "truehd" ||
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == "dts" &&
          file.ffProbeData.streams[i].profile.toLowerCase() == "dts-hd ma") ||
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == "aac" &&
          file.ffProbeData.streams[i].sample_rate.toLowerCase() == "44100" &&
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio")
      ) {
        maxmux = ` -max_muxing_queue_size 9999`;
      }
    } catch (err) {}
    //mitigate errors due to embeded pictures
    try {
      if (
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == "png" ||
          file.ffProbeData.streams[i].codec_name.toLowerCase() == "bmp" ||
          file.ffProbeData.streams[i].codec_name.toLowerCase() == "mjpeg") &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "video"
      ) {
        map = `-map 0:v:0 -map 0:a -map 0:s?`;
      }
    } catch (err) {}
  }
  //file will be encoded if the resolution is 480p or 576p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "480p" || file.video_resolution === "576p") {
    bitratecheck = 1000000;
    if (bitrateprobe != null && bitrateprobe < bitratecheck) {
      bitratetarget = parseInt((bitrateprobe * 0.8) / 1000); // Lower Bitrate to 60% of original and convert to KB
      bitratemax = bitratetarget + 500; // Set max bitrate to 6MB Higher
    } else {
      bitratetarget = 1000;
      bitratemax = 1500;
    }
    response.preset += `,${map} -dn -c:v hevc_nvenc -pix_fmt p010le -qmin 0 -cq:v 29 -b:v ${bitratetarget}k -maxrate:v 1500k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -a53cc 0 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }

  //file will be encoded if the resolution is 720p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "720p") {
    bitratecheck = 2000000;
    if (bitrateprobe != null && bitrateprobe < bitratecheck) {
      bitratetarget = parseInt((bitrateprobe * 0.8) / 1000); // Lower Bitrate to 60% of original and convert to KB
      bitratemax = bitratetarget + 2000; // Set max bitrate to 6MB Higher
    } else {
      bitratetarget = 2000;
      bitratemax = 4000;
    }
    response.preset += `,${map} -dn -c:v hevc_nvenc -pix_fmt p010le -qmin 0 -cq:v 30 -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -a53cc 0 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }
  //file will be encoded if the resolution is 1080p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "1080p") {
    bitratecheck = 2500000;
    if (bitrateprobe != null && bitrateprobe < bitratecheck) {
      bitratetarget = parseInt((bitrateprobe * 0.8) / 1000); // Lower Bitrate to 60% of original and convert to KB
      bitratemax = bitratetarget + 2500; // Set max bitrate to 6MB Higher
    } else {
      bitratetarget = 2500;
      bitratemax = 5000;
    }
    response.preset += `,${map} -dn -c:v hevc_nvenc -pix_fmt p010le -qmin 0 -cq:V 31 -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -a53cc 0 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }
  //file will be encoded if the resolution is 4K
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === "4KUHD") {
    bitratecheck = 14000000;
    if (bitrateprobe != null && bitrateprobe < bitratecheck) {
      bitratetarget = parseInt((bitrateprobe * 0.7) / 1000); // Lower Bitrate to 60% of original and convert to KB
      bitratemax = bitratetarget + 6000; // Set max bitrate to 6MB Higher
    } else {
      bitratetarget = 14000;
      bitratemax = 20000;
    }
    response.preset += `,${map} -dn -c:v hevc_nvenc -pix_fmt p010le -qmin 0 -cq:v 31 -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8 -a53cc 0 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }
  //check if the file is eligible for transcoding
  //if true the neccessary response values will be changed
  if (transcode == 1) {
    response.processFile = true;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += `☒File is ${file.video_resolution}!\n`;
    response.infoLog += `☒File is not hevc!\n`;
    response.infoLog += `☒File bitrate is ${parseInt(
      bitrateprobe / 1000
    )}kb!\n`;
    if (bitrateprobe < bitratecheck) {
      response.infoLog += `File bitrate is LOWER than the Default Target Bitrate!\n`;
    } else {
      response.infoLog += `File bitrate is HIGHER than the Default Target Bitrate!\n`;
    }
    response.infoLog += `☒Target Bitrate set to ${bitratetarget}kb!\n`;
    response.infoLog += `File is being transcoded!\n`;
  }

  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
