/* eslint-disable */
const vaapiPrefix = ` -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi `;

const details = () => {
  return {
    id: `Tdarr_Plugin_Mthr_VaapiHEVCTranscode`,
    Stage: 'Pre-processing',
    Name: `FFMPEG VAAPI HEVC Transcode`,
    Type: `Video`,
    Operation: `Transcode`,
    Description: `Files not in HEVC will be transcoded into HEVC video using ffmpeg with libvaapi. ` +
      `Intel QuickSync-enabled CPU required, recommended 8th generation or newer.\n ` +
      `Output bitrate will be calculated based on input file size.\n\n`,
    Version: `1.0`,
    Tags: `pre-processing,ffmpeg,video only,h265,configurable`,
    Inputs: [{
      name: `remuxOnly`,
      type: 'string',
      defaultValue:'false',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify whether this plugin should only run on files with Remux in their names. ` +
        `Valid options are true or false.` +
        `\\nExample: ` +
        `\\ntrue ` +
        `\\nExample: ` +
        `\\nfalse`
    },{
      name: `minBitrate`,
      type: 'string',
      defaultValue:'',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the minimum bitrate at which this plugin will run. Files with a current bitrate ` +
        `lower than this cutoff will not be transcoded. Leave blank to disable. ` +
        `\\nExample: ` +
        `\\n4000`
    }]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    processFile: false,
    preset: ``,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: ``
  };

  var videoProcessingRequired = false;
  var ffmpegParameters = ``;
  var duration = 0;
  var currentBitrate = 0;
  var targetBitrate = 0;
  var minimumBitrate = 0;
  var maximumBitrate = 0;

  if (inputs.remuxOnly.toLowerCase() == `true` && !file.file.toLowerCase().includes(`remux`)) {
    response.infoLog += `☒ RemuxOnly is enabled and file is not a remux. Unable to process.\n`;
    return response;
  }

  if (file.fileMedium !== `video`) {
    response.infoLog += `☒ File is not a video. Unable to process.\n`;
    return response;
  }

  file.ffProbeData.streams.forEach(function(stream) {
  if (stream.codec_type == `video`) {

    if (stream.codec_name !== `mjpeg` && stream.codec_name !== `hevc`) {
      videoProcessingRequired = true;

      // Formula borrowed from Migz h265 transcode plugins
      // Get duration in minutes, then work out currentBitrate using
      // Bitrate = file size / (stream duration * .0075)
      // Calculations were made based on the formula from this site:
      // https://blog.frame.io/2017/03/06/calculate-video-bitrates/

      if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
          duration = parseFloat(file.ffProbeData?.format?.duration) * 0.0166667;
      } else if(file.meta.Duration !== `undefined`){
          duration = file.meta.Duration* 0.0166667;
      }else{
        duration = stream.duration * 0.0166667;
      }


      currentBitrate = ~~(file.file_size / (duration * 0.0075));
      targetBitrate = ~~(currentBitrate / 2);
      minimumBitrate = ~~(targetBitrate * 0.7);
      maximumBitrate = ~~(targetBitrate * 1.3);

      if (targetBitrate == 0) {
        response.infoLog += `☒ Target bitrate could not be calculated. Skipping this plugin.\n`;
        return response;
      }

      if (inputs.minBitrate !== `` && currentBitrate <= inputs.minBitrate) {
        response.infoLog += `☒ Input file's bitrate ${currentBitrate} is lower than the minimum ` +
          `bitrate threshold of ${inputs.minBitrate}. Skipping this plugin.\n`;
        return response;
      }

      response.infoLog += `☒ Video stream ${stream.index} is not HEVC, transcode required.\n `;
      ffmpegParameters += ` -c:v:0 hevc_vaapi -b:v ${targetBitrate}k -minrate ${minimumBitrate}k ` +
        `-maxrate ${maximumBitrate}k -bufsize 1M -max_muxing_queue_size 1024 `;
      }
    }
  });

  if (videoProcessingRequired) {
    response.infoLog += `☑ Stream analysis complete, processing required.\n `;
    response.preset = `${vaapiPrefix},-map 0:v -map 0:a -map 0:s? -map 0:d? -map 0:t? -c copy ${ffmpegParameters} `;
    response.container = `${file.container}`;
    response.processFile = true;
  } else {
    response.infoLog += `☑ Stream analysis complete, no processing required.\n`;
  }
  return response;
}



module.exports.details = details;
module.exports.plugin = plugin;