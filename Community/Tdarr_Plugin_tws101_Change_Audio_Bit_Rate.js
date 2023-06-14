/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_tws101_Change_Audio_Bit_Rate",
    Stage: "Pre-processing",
    Name: "tws101 Custom Change Bit Rate of Audio",
    Type: "Audio",
    Operation: "Transcode",
    Description: `Reduce bit rate to target value.  transcodes audio stream can choose same codec.  Must be MP4 bit rate filter   \n\n`,
    //  made by tws101
	  //  inspired by unknown
    //  Release Version
    Version: "1.01",
    Tags: "pre-processing,audio only,ffmpeg,configurable",
    Inputs: [
      {
        name: "codecs_to_transcode",
        type: 'string',
        defaultValue: 'ac3',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specifiy the codecs which you'd like to transcode
        \\nExample:\\n
        ac3
        \\nExample:\\n
        eac3,ac3,aac
        `,
      },
      {
        name: "codec",
        type: 'string',
        defaultValue: 'ac3',
        inputUI: {
          type: 'text',
        },
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
      {
        name: "bitrate",
        type: 'string',
        defaultValue: '256k',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target but rate:
        \\n 384k
        \\n 640k
        \\nExample:\\n
        640k
 
        `,
      },
      {
        name: "filter_bitrate",
        type: 'string',
        defaultValue: '300k',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the bit rate to trascode from FILTER:
        \\n 384k
        \\n 640k
        \\nExample:\\n
        640k
 
        `,
      },
	  {
      name: 'skip_4KUHD',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will not reduce audio bit rate of a 4KUHD`,
    },
    ],
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: ".${file.container}",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",
  };

  if (inputs.codecs_to_transcode === undefined || inputs.codec === undefined ) {
    response.processFile = false;
    response.infoLog += "☒ Inputs not entered! \n";
    return response;
  }
  
  const fileResolution = file.video_resolution;
  
  if ((inputs.skip_4KUHD === true) && (fileResolution === "4KUHD")) {
    response.processFile = false;
    response.infoLog += "☒ File has 4KUHD skipping \n";
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
      ) && 
	  file.ffProbeData.streams[i].bit_rate > (inputs.filter_bitrate)
    ) {
	  response.infoLog += `☒ Audio bit rate over ${inputs.filter_bitrate} \n`;
      ffmpegCommand += `  -map 0:${i} -c:${i} ${encoder} `;
      if (inputs.bitrate !== '') {
        ffmpegCommand += `-b:a ${inputs.bitrate} `;
      }
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
    response.infoLog += `☒ File has streams which aren't in desired codec and or bitrate! \n`;
    return response;
  }
};


module.exports.details = details;
module.exports.plugin = plugin;