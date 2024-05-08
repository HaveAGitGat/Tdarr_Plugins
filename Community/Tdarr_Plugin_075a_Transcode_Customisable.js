/* eslint-disable */
const details = () => ({
    id: "Tdarr_Plugin_075a_Transcode_Customisable",
    Stage: "Pre-processing",
    Name: "Video Transcode Customisable",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] Specify codec filter and transcode arguments for HandBrake or FFmpeg  \n\n`,
    Version: "1.00",
    Tags: "pre-processing,handbrake,ffmpeg,configurable",
    Inputs: [
      {
        name: "codecs_to_exclude",
        type: 'string',
        defaultValue: 'hevc',
        inputUI: {
          type: 'text',
        },
        tooltip: `Input codecs, separated by a comma, that should be excluded when processing.

        \\nFor example, if you're transcoding into hevc (h265), then add a filter to prevent hevc being transcoded so your newly transcoded files won't be infinitely looped/processed. \\n

        
        \\nCommon video codecs:

        \\nmpeg4
        \\nhevc
        \\nh264
        \\nmpeg2video
        \\ntheora
        \\nvp8
        \\nvp9
        
        
        \\nExample:\\n

        hevc

        \\nYou can also enter multiple codecs:

        \\nExample:\\n

        mp3,aac,dts

        \\nExample:\\n

        h264,vp9
 
        `,
      },
      {
        name: "cli",
        type: 'string',
        defaultValue: 'handbrake',
        inputUI: {
          type: 'text',
        },
        tooltip: `Enter the CLI to use.
        
        \\nExample:\\n
        handbrake

        \\nExample:\\n
        ffmpeg
        
        `,
      },
      {
        name: "transcode_arguments",
        type: 'string',
        defaultValue: '-Z "Very Fast 1080p30" --all-subtitles --all-audio',
        inputUI: {
          type: 'text',
        },
        tooltip: `\\nEnter HandBrake or FFmpeg transcode arguments.
        
        \\nHandBrake examples:

        \\nExample:\\n
        -e x264 -q 20 -B
        
        \\nExample:\\n
        -Z "Very Fast 1080p30"
        
        \\nExample:\\n
        -Z "Fast 1080p30" -e nvenc_h265
        
        \\nExample:\\n
        -Z "Very Fast 1080p30" --all-subtitles --all-audio
        
        \\nExample:\\n
        -Z "Very Fast 480p30"
        
        \\nExample:\\n
        --preset-import-file "C:\Users\HaveAGitGat\Desktop\testpreset.json" -Z "My Preset"
        
        \\nYou can learn more about HandBrake presets here:

        \\nhttps://handbrake.fr/docs/en/latest/technical/official-presets.html
        

        \\nWhen using FFmpeg, you need to separate the input and output parameters with a comma. FFmpeg Examples:

        \\nExample:\\n
-r 1,-r 24

\\nExample:\\n
,-sn -c:v copy -c:a copy

\\nExample:\\n
,-c:v lib265 -crf 23 -ac 6 -c:a aac -preset veryfast

\\nExample:\\n
,-map 0 -c copy -c:v libx265 -c:a aac

\\nExample:\\n
-c:v h264_cuvid,-c:v hevc_nvenc -preset slow -c:a copy

\\nPlease see the following for help with creating FFmpeg commands:

\\nhttps://opensource.com/article/17/6/ffmpeg-convert-media-file-formats
        
        
        
        
        `,
      },
      {
        name: "output_container",
        type: 'string',
        defaultValue: '.mkv',
        inputUI: {
          type: 'text',
        },
        tooltip: `
        \\nEnter the output container of the new file

        \\nExample:\\n
        .mp4

        \\nExample:\\n
        .mp3

        \\nExample:\\n
        .mkv
        
        `,
      },
    ],
  }
);

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

  if (
    inputs.codecs_to_exclude === undefined ||
    inputs.cli === undefined ||
    inputs.transcode_arguments === undefined ||
    inputs.output_container === undefined
  ) {
    response.processFile = false;
    response.infoLog += "☒ Inputs not entered! \n";
    return response;
  }

  if (
    inputs.codecs_to_exclude.includes(file.ffProbeData.streams[0].codec_name)
  ) {
    response.processFile = false;
    response.infoLog += `☑File is already in ${file.ffProbeData.streams[0].codec_name}! \n`;
    return response;
  }

  //transcode settings

  if (inputs.cli == `handbrake`) {
    response.handBrakeMode = true;
    response.FFmpegMode = false;
  } else if (inputs.cli == `ffmpeg`) {
    response.handBrakeMode = false;
    response.FFmpegMode = true;
  } else {
    response.processFile = false;
    response.infoLog += "☒ CLI not input correctly! \n";
    return response;
  }

  response.processFile = true;
  response.preset = inputs.transcode_arguments;
  response.container = inputs.output_container;

  response.reQueueAfter = true;
  response.infoLog += `☒File is not in desired codec! \n`;
  return response;
};



 
module.exports.details = details;
module.exports.plugin = plugin;