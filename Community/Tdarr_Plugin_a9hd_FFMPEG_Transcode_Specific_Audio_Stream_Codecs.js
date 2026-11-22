/* eslint-disable */
const details = () => {
  return {
    id: "Filter_transcode_audio_tracks_by_codec_and_channel_count",
    Stage: "Pre-processing",
    Name: "Filter Transcode audio tracks by codec",
    Type: "Audio",
    Operation: "Transcode",
    Description: `[Contains built-in filter] based on Tdarr_Plugin_a9hd_FFMPEG_Transcode_Specific_Audio_Stream_Codecs but allows for any kind of bitrate argument`,
    Version: "1.00",
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
        defaultValue: 'aac',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the codec you'd like to transcode into:
        \\n aac
        \\n ac3
        \\n eac3
        \\n dts
        \\n flac
        \\n libfdk_aac
        \\n mp3
        \\n truehd
        \\nExample:\\n
        eac3
 
        `,
      },
	  {
        name: "encoder",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `(optional) Specifiy the encoder to use for the transcode, codec parameter will be used when this is empty 
		example: for aac you can input 'libfdk_aac' or 'aac_at'
		for mp3 'libmp3lame'
		
		typically when there is only 1 encoder, the encoder name is the same as the codec name
        `,
      },
    {
      name: 'transcodeSelf',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip:
        'whether to encode audio that is already of the desired codec',
    },
      {
        name: "bitrate",
        type: 'string',
        defaultValue: '-b:a 320k',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the transcoded audio bitrate (optional):
        \\n -b:a 320k
        \\n -vbr 5
		\\n any ffmpeg argument is welcome here
 
        `,
      },
      {
        name: "channels",
        type: 'string',
        defaultValue: 'All',
        inputUI: {
            type: 'dropdown',
            options: [
            'Stereo',
            'MultiChannel',
            'All',
            ],
        },
        tooltip: `Specify which audio tracks, by channel count, will be transcoded, (The stereo option includes Mono as well)`,
      },
            {
        name: "extra_args",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: ` extra arguments to pass onto ffmpeg
        `,
      },
    ],
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
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

  if (inputs.codecs_to_transcode === undefined || inputs.codec === undefined ) {
    response.processFile = false;
    response.infoLog += "☒ Inputs not entered! \n";
    return response;
  }

  var encoder = inputs.encoder === null || inputs.encoder === undefined || inputs.encoder === "" ? inputs.codec : inputs.encoder;
      response.infoLog += encoder + '\n';

  var codecs_to_transcode = inputs.codecs_to_transcode.split(",");
  var hasStreamsToTranscode = false;

  var ffmpegCommand = `, -c copy  -map 0:v `;
    response.infoLog += inputs.channels + '\n';

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    response.infoLog += 'Stream ' + i + ': \n';
    if(file.ffProbeData.streams[i].channels)
    {
        response.infoLog += 'Stream has ' + file.ffProbeData.streams[i].channels + ' channels \n';
    }

    if (
      file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
      file.ffProbeData.streams[i].codec_name &&

      ((codecs_to_transcode.includes(file.ffProbeData.streams[i].codec_name.toLowerCase()) || codecs_to_transcode.includes('*')) 
      && (file.ffProbeData.streams[i].codec_name.toLowerCase() !== inputs.codec || inputs.transcodeSelf )) && 

      (file.ffProbeData.streams[i].channels && 
      ((inputs.channels === 'MultiChannel' && parseInt(file.ffProbeData.streams[i].channels) > 2) || 
      (inputs.channels === 'Stereo' && parseInt(file.ffProbeData.streams[i].channels) <= 2) || 
      (inputs.channels === 'All')))
    ) {
        response.infoLog += 'stream ' + i + ' will be processed';
        ffmpegCommand += `  -map 0:${i} -c:${i} ${encoder} `;
        if (inputs.bitrate !== '') {
            ffmpegCommand += `${inputs.bitrate} `;
        }
        hasStreamsToTranscode = true;
    } 
    else if 
    (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        ffmpegCommand += `  -map 0:${i}`;
    }
  }

  ffmpegCommand += ` -map 0:s? -map 0:d? -max_muxing_queue_size 9999 ` + inputs.extra_args;

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


module.exports.details = details;
module.exports.plugin = plugin;
