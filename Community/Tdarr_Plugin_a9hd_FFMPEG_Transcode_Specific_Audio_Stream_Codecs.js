module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_a9hd_FFMPEG_Transcode_Specific_Audio_Stream_Codecs",
    Stage: "Pre-processing",
    Name: "Transcode Specific Audio Stream Codecs",
    Type: "",
    Operation: "Transcode",
    Description: `[TESTING][Contains built-in filter] Transcode audio streams with specific codecs into another codec.  \n\n`,
    Version: "1.00",
    Link: "",
    Tags: "pre-processing,audio only,ffmpeg,configurable",
    Inputs: [
      {
        name: "codecs_to_transcode",
        tooltip: `Specifiy the codecs which you'd like to transcode
        \\nExample:\\n
        ac3
        \\nExample:\\n
        eac3,ac3,aac
 
        `,
      },
      {
        name: "codec",
        tooltip: `Specify the codec you'd like to transcode into:
        \\n aac
        \\n ac3
        \\n eac3
        \\n dts
        \\n flac
        \\n mp2
        \\n mp3
        \\n truehd
        \\nExample:\\n
        eac3
 
        `,
      },
    ],
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",
  };

  if (inputs.codecs_to_transcode === undefined || inputs.codec === undefined) {
    response.processFile = false;
    response.infoLog += "☒ Inputs not entered! \n";
    return response;
  }

  var encoder = inputs.codec;

  if (encoder == "mp3") {
    encoder = `libmp3lame`;
  } else if (encoder == "dts") {
    encoder = `dca`;
  }

  var codecs_to_transcode = inputs.codecs_to_transcode.split(",");
  var hasStreamsToTranscode = false;

  var ffmpegCommand = `, -c copy  -map 0:v `;

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
      file.ffProbeData.streams[i].codec_name &&
      codecs_to_transcode.includes(
        file.ffProbeData.streams[i].codec_name.toLowerCase()
      )
    ) {
      ffmpegCommand += `  -map 0:${i} -c:${i} ${encoder} `;
      hasStreamsToTranscode = true;
    } else if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
      ffmpegCommand += `  -map 0:${i}`;
    }
  }

  ffmpegCommand += ` -map 0:s? -map 0:d? -max_muxing_queue_size 9999`;

  if (hasStreamsToTranscode == false) {
    response.processFile = false;
    response.infoLog +=
      "☑ File does not have any streams that need to be transcoded! \n";
    return response;
  } else {
    response.processFile = true;
    response.preset = ffmpegCommand;
    response.container = "." + file.container;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += `☒ File has streams which aren't in desired codec! \n`;
    return response;
  }
};