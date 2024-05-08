/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_077b_HandBrake_NVENC_264_Configurable",
    Stage: "Pre-processing",
    Name: "HandBrake NVENC 264 Configurable",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] If files are not in H264, they will be transcoded into H264 using HandBrake NVENC H264. All audio and subtitles are kept.  \n\n`,
    Version: "1.00",
    Tags: "pre-processing,handbrake,nvenc h264,configurable",
    Inputs: [
      {
        name: "handbrake_preset",
        type:'string',
        defaultValue:'Fast 1080p30',
        inputUI: {
          type: 'text',
        },
        tooltip: `\\nEnter the name of a HandBrake preset.

                
        \\nYou can learn more about HandBrake presets here:

        \\nhttps://handbrake.fr/docs/en/latest/technical/official-presets.html
        
        
        \\nExample:\\n
        Very Fast 1080p30
        
        \\nExample:\\n
        Fast 1080p30
        
        `,
      },
      {
        name: "output_container",
        type:'string',
        defaultValue:'.mkv',
        inputUI: {
          type: 'text',
        },
        tooltip: `
        \\nEnter the output container of the new file

        \\nExample:\\n
        .mp4

        \\nExample:\\n
        .mkv
        
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

  if (
    inputs.handbrake_preset === undefined ||
    inputs.output_container === undefined
  ) {
    response.processFile = false;
    response.infoLog += "☒ Inputs not entered! \n";
    return response;
  }

  if (file.ffProbeData.streams[0].codec_name == "h264") {
    response.processFile = false;
    response.infoLog += "☑ File is already in h264, no need to transcode! \n";
    return response;
  } else {
    var container = inputs.output_container;

    if (container.charAt(0) != ".") {
      container = "." + container;
    }

    var response = {
      processFile: true,
      preset: `-Z "${inputs.handbrake_preset}" -e nvenc_h264 --all-audio --all-subtitles`,
      container: container,
      handBrakeMode: true,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: "☒ File is not in h264, transcoding! \n",
    };

    return response;
  }
};



module.exports.details = details;
module.exports.plugin = plugin;