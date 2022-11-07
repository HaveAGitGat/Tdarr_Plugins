/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_tws101_Ultimate_GPU_Transcoder_HDR",
    Stage: 'Pre-processing',
    Name: "tws101 Ultimate GPU Transcoder HDR",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      `This plugin will GPU trascode using NVENC to HEVC with bframes, 10bit, and HDR.  HDR in the source file is preserved if it is present
	   The Primary use of this plugin is to reduce bit rate and save space as well as bandwidth.
	   an NVENC capable GPU that can do bframes is required.  With reconvert HEVC off files not in HEVC will be converted into HEVC in an MKV container no exceptions.  With reconvert 
	   HEVC on, even an HEVC file will be processed.  In reconvert HEVC mode the filter bitrate as well as the target bit rate is essential to program correctly. Example with a 1080p HEVC file
	   with a preprocessing bit rate of 5M.  Setting the target to 2.1M we know the max bitrate should be 2.5M, tool tip tells you what to add, for the video. Next you need to add some overhead
	   for audio lets say 500k for a total of 3M.  3M should be in the hevc_1080p_filter_bitrate to make this example work and not loop`,
//    Pluggin inspired by DOOM and MIGZ
//    Created by tws101 
//    Release version
    Version: "2.0",
    Tags: "pre-processing,ffmpeg,nvenc h265",
    Inputs: [
      {
        name: "target_bitrate_480p576p",
        type: 'string',
        defaultValue: '1000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 480p and 576p files, if current bitrate exceeds the target. Plus 200k equals max bit rate.`,
      },
      {
        name: "target_bitrate_720p",
        type: 'string',
        defaultValue: '1500000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 720p files, if current bitrate exceeds the target. Plus 250k equals max bit rate.`,
      },
      {
        name: "target_bitrate_1080p",
        type: 'string',
        defaultValue: '2500000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 1080p files, if current bitrate exceeds the target. Plus 400k equals max bit rate.`,
      },
      {
        name: "target_bitrate_4KUHD",
        type: 'string',
        defaultValue: '5000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 4KUHD files, if current bitrate exceeds the target. Plus 1600k equals max bit rate.`,
      },
      {
        name: "target_pct_reduction",
        type: 'string',
        defaultValue: '.50',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target reduction of bitrate, if current bitrate is less than resolution targets.`,
      },
	  {
      name: 'reconvert_480p_576p_hevc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will reconvert 480p and 576p hevc files that are above the hevc_480p_576p_filter_bitrate`,
    },
	  {
      name: 'hevc_480p_576p_filter_bitrate',
      type: 'string',
      defaultValue: 1700000,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate to reconvert_480p_576p_hevc `,
    },
	  {
      name: 'reconvert_720p_hevc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will reconvert 720p hevc files that are above the hevc_720p_filter_bitrate`,
    },
	  {
      name: 'hevc_720p_filter_bitrate',
      type: 'string',
      defaultValue: 2250000,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate to reconvert_720p_hevc `,
    },
	  {
      name: 'reconvert_1080p_hevc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will reconvert 1080p hevc files that are above the hevc_1080p_filter_bitrate`,
    },
	  {
      name: 'hevc_1080p_filter_bitrate',
      type: 'string',
      defaultValue: 3400000,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate to reconvert_1080p_hevc `,
    },
	  {
      name: 'reconvert_4KUHD_hevc',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will reconvert 4KUHD hevc files that are above the hevc_filter_bitrate_4KUHD`,
    },
	  {
      name: 'hevc_filter_bitrate_4KUHD',
      type: 'string',
      defaultValue: 7100000,
      inputUI: {
        type: 'text',
      },
      tooltip: `Filter bitrate to reconvert_4KUHD_hevc`,
    },
    ],
  };
}

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
    var index = this.outputSettings.indexOf(configuration);

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
  var bitrateprobe = file.ffProbeData.streams[0].bit_rate;
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
  var id = 0;
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}

/**
 * Keep all audio
 */
function buildAudioConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:a copy"]);
  return configuration;
}

/**
 * Removes unsupported and unknown subtitles.
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:s copy"]);

  var languages = (".");
  if (languages.length === 0) return configuration;

  loopOverStreamsOfType(file, "subtitle", function (stream, id) {
    if ((stream.codec_name === "eia_608") ||
      (stream.codec_tag_string === "mp4s")) {
      // unsupported subtitle codec?
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      logger.AddError(
        `Removing unsupported subtitle`
      );
      return;
    }

    // Remove unknown sub streams
    if (!("codec_name" in stream)) {
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      logger.AddError(
        `Removing unknown subtitle`
      );
      return;
    }

  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No subtitle processing necessary");
  }

  return configuration;
}

/**
 * Attempts to ensure that video streams are h265 encoded and inside an
 * MKV container.
 */
function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0", "-map -0:d", "-c:v copy"]);

  var tiered = {
    "480p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "max_increase": 200,
      "cq": 29
    },
    "576p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "max_increase": 200,
      "cq": 29
    },
    "720p": {
      "bitrate": inputs.target_bitrate_720p,
      "max_increase": 250,
      "cq": 30
    },
    "1080p": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 400,
      "cq": 31
    },
    "4KUHD": {
      "bitrate": inputs.target_bitrate_4KUHD,
      "max_increase": 600,
      "cq": 31
    },
    "Other": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 400,
      "cq": 31
    }
  };

  var inputSettings = {
    "h263": "-c:v h263_cuvid",
    "h264": "",
    "mjpeg": "c:v mjpeg_cuvid",
    "mpeg1": "-c:v mpeg1_cuvid",
    "mpeg2": "-c:v mpeg2_cuvid",
    "vc1": "-c:v vc1_cuvid",
    "vp8": "-c:v vp8_cuvid",
    "vp9": "-c:v vp9_cuvid"
  }

  function videoProcess(stream, id) {
    if (stream.codec_name === "mjpeg") {
      configuration.AddOutputSetting(`-map -v:${id}`);
      return;
    }

    const fileResolution = file.video_resolution;

    //Determines if a 480p and/or 576p is HEVC and should be re-encoded
	if ((inputs.reconvert_480p_576p_hevc === false) && ((fileResolution === "480p") || (fileResolution === "576p"))) {
      if (stream.codec_name === "hevc" || stream.codec_name === "vp9") {
	    logger.AddSuccess("File is in HEVC and, 480p or 576p, and HEVC processing is off");
	    return;
	  }
	}

    if ((inputs.hevc_480p_576p_filter_bitrate > 0) && ((fileResolution === "480p") || (fileResolution === "576p"))) {
      if ((stream.codec_name === "hevc" || stream.codec_name === "vp9") && (file.bit_rate < inputs.hevc_480p_576p_filter_bitrate)) {
        logger.AddSuccess("File is in HEVC and, 480p or 576p, and under the hevc_480p_576p_filter_bitrate");
        return;
	  }
    }
	
    //Determines if a 720p is HEVC and should be re-encoded
	if ((inputs.reconvert_720p_hevc === false) && (fileResolution === "720p")) {
      if (stream.codec_name === "hevc" || stream.codec_name === "vp9") {
	    logger.AddSuccess("File is in HEVC and 720p and HEVC processing is off");
	    return;
	  }
	}

    if ((inputs.hevc_720p_filter_bitrate > 0) && (fileResolution === "720p")) {
      if ((stream.codec_name === "hevc" || stream.codec_name === "vp9") && (file.bit_rate < inputs.hevc_720p_filter_bitrate)) {
        logger.AddSuccess("File is in HEVC and 720p and under the filter hevc 720p bit rate");
        return;
	  }
    }

    //Determines if a 1080p is HEVC and should be re-encoded
	if ((inputs.reconvert_1080p_hevc === false) && (fileResolution === "1080p")) {
      if (stream.codec_name === "hevc" || stream.codec_name === "vp9") {
	    logger.AddSuccess("File is in HEVC and 1080p and HEVC processing is off");
	    return;
	  }
	}

    if ((inputs.hevc_1080p_filter_bitrate > 0) && (fileResolution === "1080p")) {
      if ((stream.codec_name === "hevc" || stream.codec_name === "vp9") && (file.bit_rate < inputs.hevc_1080p_filter_bitrate)) {
        logger.AddSuccess("File is in HEVC and 1080p and under the filter hevc 1080p bit rate");
        return;
	  }
    }
	
	//Determines if a 4K that is HEVC should be re-encoded
	if ((inputs.reconvert_4KUHD_hevc === false) && (fileResolution === "4KUHD")) {
      if (stream.codec_name === "hevc" || stream.codec_name === "vp9") {
	    logger.AddSuccess("File is in HEVC 4KUHD and HEVC 4KUHD processing is off");
	    return;
	  }
	}

    if ((inputs.hevc_filter_bitrate_4KUHD > 0) && (fileResolution === "4KUHD")) {
      if ((stream.codec_name === "hevc" || stream.codec_name === "vp9") && (file.bit_rate < inputs.hevc_filter_bitrate_4KUHD)) {
        logger.AddSuccess("File is in HEVC and 4KUHD and under the filter hevc 4KUHD bit rate");
        return;
	  }
    }
	
	//Check HDR

    // remove png streams.
    if (stream.codec_name === "png") {
      configuration.AddOutputSetting(`-map -0:v:${id}`);
    } else {  // Transcode.
      var bitrateprobe = calculateBitrate(file);
      var bitratetarget = 0;
      var bitratemax = 0;
      var cq = 0;
      var bitratecheck = 0;

      /*  Determine tiered bitrate variables */
      var tier = tiered[file.video_resolution];

      bitratecheck = parseInt(tier["bitrate"]);
      if (bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt((bitrateprobe * inputs.target_pct_reduction) / 1000);
      } else {
        bitratetarget = parseInt(tier["bitrate"] / 1000);
      }
      bitratemax = bitratetarget + tier["max_increase"];
      cq = tier["cq"];

      configuration.RemoveOutputSetting("-c:v copy");
      configuration.AddOutputSetting(
        `-c:v hevc_nvenc -qmin 0 -cq:v ${cq} -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k -preset slow -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8`
      );

      configuration.AddInputSetting(inputSettings[file.video_codec_name]);

      if (file.video_codec_name === "h264" && file.ffProbeData.streams[0].profile !== "High 10") {
        configuration.AddInputSetting("-c:v h264_cuvid");
      }
	  
	  if (stream.color_space === "bt2020nc") {
        configuration.AddOutputSetting(
		  ` -pix_fmt p010le -color_primaries bt2020 -colorspace bt2020nc -color_trc smpte2084 `
		);
		logger.AddSuccess("HDR Detected Maintaining");
      } else {
        configuration.AddOutputSetting(
		  ` -pix_fmt p010le `
		);
		logger.AddSuccess("HDR Not Detected");
      }

      logger.AddError("Transcoding to HEVC using NVidia NVENC");
    }
  }

  loopOverStreamsOfType(file, "video", videoProcess);

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No video processing necessary");
  }

  return configuration;
}

//#endregion
// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    container: ".mkv",
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: true,
  };

  var logger = new Log();
  var audioSettings = buildAudioConfiguration(inputs, file, logger);
  var videoSettings = buildVideoConfiguration(inputs, file, logger);
  var subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

  response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()}`
  response.preset += ` ${audioSettings.GetOutputSettings()}`
  response.preset += ` ${subtitleSettings.GetOutputSettings()}`
  response.preset += ` -max_muxing_queue_size 9999`;

  // Extra parameters
  var id = 0;
  var badTypes = ['mov_text', 'eia_608', 'timed_id3', 'mp4s'];
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (badTypes.includes(file.ffProbeData.streams[i].codec_name)) {
      response.preset += ` -map -0:${i}`;
    };
    id++;
  }

  // b frames argument
  response.preset += ` -bf 5`;

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