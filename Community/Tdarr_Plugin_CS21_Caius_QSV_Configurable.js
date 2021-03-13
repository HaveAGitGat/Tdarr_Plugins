function details() {
  return {
    id: 'Tdarr_Plugin_CS21_Caius_QSV_Configurable',
    Stage: 'Pre-processing',
    Name: 'Tiered QSV Configurable',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `[Contains built-in filter]
     Adapted from Vodka's tiered nvenc plugin - Tdarr_Plugin_vdka_Tiered_NVENC_CQV_BASED_CONFIGURABLE
     This plugin requires Intel Quicksync non-free drivers be installed.
     On Linux this means the iHD driver which can be obtained from the "intel-media-va-driver-non-free" package.
     It is recommended to use the version from Intel's repo.
     The driver needs to either be installed in the node container manually
     or run the tdarr node natively on a machine which has the driver installed.
     A version of ffmpeg with qsv/libmfx enabled at compile time is also required. The version from jellyfin works well.
     This plugin uses different global quality values depending on resolution. A value or 19 or 20 works well.
     Files not in hevc will be transcoded.
     The output container is mkv. \n\n`,
    Version: '1.00',
    Tags: 'pre-processing,ffmpeg,video only,qsv h265,configurable',

    Inputs: [
      {
        name: 'sdCQV',
        tooltip: `Enter the quality value you want for 480p and 576p content.
       \\nExample:\\n

      21`
      },
      {
        name: 'hdCQV',
        tooltip: `Enter the quality value you want for 720p content.

      \\nExample:\\n
      23`
      },
      {
        name: 'fullhdCQV',
        tooltip: `Enter the quality value you want for 1080p content.

      \\nExample:\\n
      25`
      },
      {
        name: 'uhdCQV',
        tooltip: `Enter the quality value you want for 4K/UHD/2160p content.

      \\nExample:\\n
      28`
      },
      {
        name: 'pixdepth',
        tooltip: `Enable 10 bit output.

      \\nExample:\\n
      true, false`
      },
      {
        name: 'ffmpeg_preset',
        tooltip: `OPTIONAL, DEFAULTS TO FASTER IF NOT SET
      \\n Enter the ffmpeg preset you want, leave blank for default (faster).
          \\n This setting appears to make little difference to output quality, but affects processing time considerably.
          \\n Perhaps this is a driver or ffmpeg bug, but there seems little point using slower presets for no gain.
      \\n This only applies if video is transcoded, video already in h264 will not be transcoded with this setting

      \\nExample:\\n
        slow

      \\nExample:\\n
        medium

      \\nExample:\\n
        fast

      \\nExample:\\n
        faster`
      }
    ]
  };
}

module.exports.plugin = function plugin (file, librarySettings, inputs) {
  var transcode = 0; //if this var changes to 1 the file will be transcoded
  var subcli = `-c:s copy`;
  var maxmux = '';
  var map = '-map 0';
  var cqvinuse = '';
  //default values that will be returned
  var response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: '',
    maxmux: false
  };

  //check if the file is a video, if not the function will be stopped immediately
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video! \n';
    return response;
  } else {
    //bitrateprobe = file.ffProbeData.streams[0].bit_rate;
    response.infoLog += 'File is a video! \n';
  }

  //check if 10bit output is configured.
  var pixdepth;
  var pixdepth_setting;
  if (inputs.pixdepth === undefined) {
    pixdepth = 'false';
  } else {
    pixdepth = `${inputs.pixdepth}`;
    response.infoLog += ` 10 bit encoding set to ${pixdepth}\n`;
  }

  if (pixdepth == 'true') {
    pixdepth_setting = '-vf "vpp_qsv=format=p010le"';
  } else {
    pixdepth_setting = '-vf "vpp_qsv=format=same"';
  }



  //check if the file is already hevc, it will not be transcoded if true and the function will be stopped immediately. Dolby vision files will not be remuxed to mkv.
  if (file.ffProbeData.streams[0].codec_name == 'hevc' || file.ffProbeData.streams[0].codec_name == 'dvhe') {
    response.processFile = false;
    response.infoLog += 'File is already in hevc! \n';
    return response;
  }

var file_codec;
file_codec = file.ffProbeData.streams[0].codec_name;

  // Check if preset is configured, default to faster if not
  var ffmpeg_preset;
  if (inputs.ffmpeg_preset === undefined) {
    ffmpeg_preset = `faster`;
    response.infoLog += 'Preset not set, defaulting to 6\n';
  } else {
    ffmpeg_preset = `${inputs.ffmpeg_preset}`;
    response.infoLog += `Preset set as ${inputs.ffmpeg_preset}\n`;
  }

  //codec will be checked so it can be transcoded correctly
  if (file.video_codec_name == 'h264') {
    if (file.ffProbeData.streams[0].profile != 'High 10') {
      //Remove HW Decoding for High 10 Profile
      response.preset = `-hwaccel qsv -c:v h264_qsv`;
    } else if (file.ffProbeData.streams[0].profile == 'High 10') {
      response.preset = '-init_hw_device qsv=hw -filter_hw_device hw';}
  } else if (file.video_codec_name == 'mpeg2') {
    response.preset = `-hwaccel qsv -c:v mpeg2_qsv`;
  } else if (file.video_codec_name == 'vc1') {
    response.preset = `-hwaccel qsv -c:v vc1_qsv`;
  } else if (file.video_codec_name == 'vp8') {
    response.preset = `-hwaccel qsv -c:v vp8_qsv`;
  } else if (file.video_codec_name == 'vp9') {
    response.preset = `-hwaccel qsv -c:v vp9_qsv`;
  } else {
	response.preset = '-init_hw_device qsv=hw -filter_hw_device hw';
  }

  //Set Subtitle Var before adding encode cli
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == 'mov_text' &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == 'subtitle'
      ) {
        subcli = `-c:s srt`;
      }
    } catch (err) {}
    //mitigate TrueHD audio causing Too many packets error
    try {
      if (
        file.ffProbeData.streams[i].codec_name.toLowerCase() == 'truehd' ||
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'dts' &&
          file.ffProbeData.streams[i].profile.toLowerCase() == 'dts-hd ma') ||
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'aac' &&
          file.ffProbeData.streams[i].sample_rate.toLowerCase() == '44100' &&
          file.ffProbeData.streams[i].codec_type.toLowerCase() == 'audio')
      ) {
        maxmux = ` -max_muxing_queue_size 9999`;
      }
    } catch (err) {}
    //mitigate errors due to embeded pictures
    try {
      if (
        (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'png' ||
          file.ffProbeData.streams[i].codec_name.toLowerCase() == 'bmp' ||
          file.ffProbeData.streams[i].codec_name.toLowerCase() == 'mjpeg') &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == 'video'
      ) {
        map = `-map 0:v:0 -map 0:a? -map 0:s?`;
      }
    } catch (err) {}
  }
  //file will be encoded if the resolution is 480p or 576p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === '480p' || file.video_resolution === '576p') {
    cqvinuse = `${inputs.sdCQV}`;
    response.preset += `,${map} -dn -load_plugin hevc_hw -c:v hevc_qsv -preset ${ffmpeg_preset} ${pixdepth_setting} -global_quality ${inputs.sdCQV} -b_strategy 1 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }

  //file will be encoded if the resolution is 720p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === '720p') {
    cqvinuse = `${inputs.hdCQV}`;
    response.preset += `,${map} -dn -load_plugin hevc_hw -c:v hevc_qsv -preset ${ffmpeg_preset} ${pixdepth_setting} -global_quality ${inputs.hdCQV} -b_strategy 1 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }
  //file will be encoded if the resolution is 1080p
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === '1080p') {
    cqvinuse = `${inputs.fullhdCQV}`;
    response.preset += `,${map} -dn -load_plugin hevc_hw -c:v hevc_qsv -preset ${ffmpeg_preset} ${pixdepth_setting} -global_quality ${inputs.fullhdCQV} -b_strategy 1 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }
  //file will be encoded if the resolution is 4K
  //codec will be checked so it can be transcoded correctly
  if (file.video_resolution === '4KUHD') {
    cqvinuse = `${inputs.uhdCQV}`;
    response.preset += `,${map} -dn -load_plugin hevc_hw -c:v hevc_qsv -preset ${ffmpeg_preset} ${pixdepth_setting} -global_quality ${inputs.uhdCQV} -b_strategy 1 -c:a copy ${subcli}${maxmux}`;
    transcode = 1;
  }
  //check if the file is eligible for transcoding
  //if true the neccessary response values will be changed
  if (transcode == 1) {
    response.processFile = true;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += `File is ${file.video_resolution}, using quality value of ${cqvinuse}!\n`;
    response.infoLog += `File is ${file_codec}. Transcoding to hevc!\n`;
  }

  return response;
};
module.exports.details = details;
