/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_tws101_AV1_with_CPU',
  Stage: 'Pre-processing',
  Name: 'tws101 - Trascode to AV1 Using CPU & FFMPEG',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Trascode to AV1, detect and maintain HDR, Keep orginal container.
    If reconvert AV1 is on and the entire file over the bitrate filter, the av1 streams will be re-encoded
    When setting the re-encode bitrate filter be aware that it is a file total bitrate, so leave overhead for audio`,
//    Created by tws101 
//    Release version 1.01
  Version: '1.01',
  Tags: 'pre-processing,ffmpeg,video only,configurable,av1',
  Inputs: [
    {
      name: "target_bitrate_480p576p",
      type: 'number',
      defaultValue: 700,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the target bitrate in kilobits for 480p and 576p files.  Example 400 equals 400k`,
    },
    {
      name: "target_bitrate_720p",
      type: 'number',
      defaultValue: 1400,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the target bitrate in kilobits for 720p files. Example 400 equals 400k`,
    },
    {
      name: "target_bitrate_1080p",
      type: 'number',
      defaultValue: 1750,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the target bitrate in kilobits for 1080p files. Example 400 equals 400k`,
    },
    {
      name: "target_bitrate_4KUHD",
      type: 'number',
      defaultValue: 3500,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the target bitrate in kilobits for 4KUHD files. Example 400 equals 400k`,
    },
    {
      name: "target_pct_reduction",
      type: 'number',
      defaultValue: .5,
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify the target reduction of bitrate, if current bitrate is less than resolution targets.`,
    },
    {
      name: 'reconvert_av1',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will reconvert 480p and 576p av1 files that are above the av1_480p_576p_filter_bitrate`,
    },
    {
      name: 'av1_480p_576p_filter_bitrate',
      type: 'number',
      defaultValue: 1700,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate in kilobits to reconvert_480p_576p_av1.  Example 1200 equals 1200k`,
    },
    {
      name: 'av1_720p_filter_bitrate',
      type: 'number',
      defaultValue: 2400,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate in kilobits to reconvert_720p_av1. Example 1200 equals 1200k`,
    },
    {
      name: 'av1_1080p_filter_bitrate',
      type: 'number',
      defaultValue: 2750,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate in kilobits to reconvert_1080p_av1. Example 1200 equals 1200k `,
    },
    {
      name: 'av1_filter_bitrate_4KUHD',
      type: 'number',
      defaultValue: 4400,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate in kilobits to reconvert_4KUHD_av1. Example 1200 equals 1200k`,
    },
  ],
});

// #region Helper Classes/Modules

/**
 * Handles logging in a standardised way.
 */
class Log {
  constructor() {
    this.entries = [];
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  Add(entry) {
    this.entries.push(entry);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddSuccess(entry) {
    this.entries.push(`☑ ${entry}`);
  }

  /**
   *
   * @param {String} entry the log entry string
   */
  AddError(entry) {
    this.entries.push(`☒ ${entry}`);
  }

  /**
   * Returns the log lines separated by new line delimiter.
   */
  GetLogData() {
    return this.entries.join("\n");
  }
}

/**
 * Handles the storage of FFmpeg configuration.
 */
class Configurator {
  constructor(defaultOutputSettings = null) {
    this.shouldProcess = false;
    this.outputSettings = defaultOutputSettings || [];
    this.inputSettings = [];
  }

  AddInputSetting(configuration) {
    this.inputSettings.push(configuration);
  }

  AddOutputSetting(configuration) {
    this.shouldProcess = true;
    this.outputSettings.push(configuration);
  }

  ResetOutputSetting(configuration) {
    this.shouldProcess = false;
    this.outputSettings = configuration;
  }

  RemoveOutputSetting(configuration) {
    let index = this.outputSettings.indexOf(configuration);

    if (index === -1) return;
    this.outputSettings.splice(index, 1);
  }

  GetOutputSettings() {
    return this.outputSettings.join(" ");
  }

  GetInputSettings() {
    return this.inputSettings.join(" ");
  }
}

// #endregion


// #region Plugin Methods

function calculateBitrate(file) {
  let bitrateprobe = file.ffProbeData.streams[0].bit_rate;
  if (isNaN(bitrateprobe)) {
    bitrateprobe = file.bit_rate;
  }
  return bitrateprobe;
}

/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
function loopOverStreamsOfType(file, type, method) {
  let id = 0;
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}

/**
 * Video, Map EVERYTHING and encode video streams to av1
 */
function buildVideoConfiguration(inputs, file, logger) {
  let configuration = new Configurator(["-map 0"]);

  const tiered = {
    "480p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "max_increase": 200,
      "max_decrease": 400
    },
    "576p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "max_increase": 200,
      "max_decrease": 400
    },
    "720p": {
      "bitrate": inputs.target_bitrate_720p,
      "max_increase": 250,
      "max_decrease": 500
    },
    "1080p": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 300,
      "max_decrease": 600
    },
    "4KUHD": {
      "bitrate": inputs.target_bitrate_4KUHD,
      "max_increase": 600,
      "max_decrease": 1200
    },
    "Other": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 300,
      "max_decrease": 600
    }
  };

  const inputSettings = {
    "h263": "-c:v h263",
    "h264": "",
    "mjpeg": "c:v mjpeg",
    "mpeg1": "-c:v mpeg1",
    "mpeg2": "-c:v mpeg2",
    "vc1": "-c:v vc1",
    "vp8": "-c:v vp8",
    "vp9": "-c:v vp9"
  }

  function videoProcess(stream, id) {
    if (stream.codec_name === "mjpeg") {
      configuration.AddOutputSetting(`-map -v:${id}`);
      return;
    }

    //Return if a re-encode is not needed
    const filterbitrate480 = (inputs.av1_480p_576p_filter_bitrate * 1000);
    const filterbitrate720 = (inputs.av1_720p_filter_bitrate * 1000);
    const filterbitrate1080 = (inputs.av1_1080p_filter_bitrate * 1000);
    const filterbitrate4k = (inputs.av1_filter_bitrate_4KUHD * 1000);
    const fileResolution = file.video_resolution;
    const reconvert = inputs.reconvert_av1;
    const res480p = "480p";
    const res576p = "576p";
    const res720p = "720p";
    const res1080p = "1080p";
    const res4k = "4KUHD";

    if (reconvert === false) {
      if (stream.codec_name === "av1") {
        logger.AddSuccess(`Video stream ${id} is av1, and av1 reconvert is off`);
        return;
      }
    }

    function reconvertcheck(filterbitrate, res, res2) {
      if ((filterbitrate > 0) && ((fileResolution === res) || (fileResolution === res2))) {
        if ((stream.codec_name === "av1") && (file.bit_rate < filterbitrate)) {
          logger.AddSuccess(`Video stream ${id} is av1 and under the filter bitrate`);
          return true;
        }
      }
      return false;
    }

    const Bol480 = reconvertcheck(filterbitrate480, res480p, res576p);
    const Bol720 = reconvertcheck(filterbitrate720, res720p);
    const Bol1080 = reconvertcheck(filterbitrate1080, res1080p);
    const Bol4k = reconvertcheck(filterbitrate4k, res4k);

    if (Bol480 === true || Bol720 === true ||Bol1080 === true || Bol4k === true) {
      return;
    }

    // remove png streams.  
    if (stream.codec_name === "png") {
      configuration.AddOutputSetting(`-map -0:v:${id}`);
    } else {
      //Setup required variables to trascode  
      const bitrateprobe = (calculateBitrate(file) / 1000);
      let bitratetarget = 0;
      const tier = tiered[file.video_resolution];
      if (tier == null) {
        logger.AddError("Plugin does not support the files video resolution");
        return;
      }
      const bitratecheck = parseInt(tier["bitrate"]);

      if (bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt(bitrateprobe * inputs.target_pct_reduction);
      } else {
        bitratetarget = parseInt(tier["bitrate"]);
      }

      const bitratemax = bitratetarget + tier["max_increase"];
      const bitratemin = bitratetarget - tier["max_decrease"];

      //Trascode all video streams that made it this far
      configuration.AddOutputSetting(`-c:v libsvtav1 -minrate ${bitratemin}k -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k`);
      configuration.AddInputSetting(inputSettings[file.video_codec_name]);
      if (file.video_codec_name === "h264" && file.ffProbeData.streams[0].profile !== "High 10" && file.ffProbeData.streams[0].profile !== "High 4:4:4 Predictive") {
        configuration.AddInputSetting("-c:v h264");
      }

	    //Check HDR and add required configuration
	    if (stream.color_space === "bt2020nc") {
        configuration.AddOutputSetting(` -pix_fmt p010le -color_primaries bt2020 -colorspace bt2020nc -color_trc smpte2084 `);
		    logger.AddSuccess("HDR Detected Maintaining");
      } else {
        configuration.AddOutputSetting(` -pix_fmt p010le `);
		    logger.AddSuccess("HDR Not Detected");
      }

      logger.AddError(`Transcoding stream ${id} to AV1 using CPU`);
    }
  }

  loopOverStreamsOfType(file, "video", videoProcess);

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No video processing necessary");
  }

  return configuration;
}

/**
 * Audio, set all audio to copy
 */
function buildAudioConfiguration(inputs, file, logger) {
  let configuration = new Configurator(["-c:a copy"]);
  return configuration;
}

/**
 * Subtitles, set all subtitles to copy
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  let configuration = new Configurator(["-c:s copy"]);
  return configuration;
}




// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
// eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: true,
  };

  let logger = new Log();

  // Begin Abort Section
  
  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    logger.AddError("File is not a video.");
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }
  // End Abort Section

  let videoSettings = buildVideoConfiguration(inputs, file, logger);
  let audioSettings = buildAudioConfiguration(inputs, file, logger);
  let subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

  response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()}`
  response.preset += ` ${audioSettings.GetOutputSettings()}`
  response.preset += ` ${subtitleSettings.GetOutputSettings()}`
  response.preset += ` -max_muxing_queue_size 9999`;

// fix probe size errors
  response.preset += ` -analyzeduration 2147483647 -probesize 2147483647`;

  response.processFile =
    videoSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess("No need to process file");
  }

  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;