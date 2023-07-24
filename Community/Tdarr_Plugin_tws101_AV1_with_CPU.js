/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_tws101_AV1_with_CPU',
  Stage: 'Pre-processing',
  Name: 'tws101 - Trascode to AV1 Using CPU & FFMPEG',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Prototype, Trascode to AV1, detect and maintain HDR, Keep orginal container.
  Reconvert AV1 if the option is on and we are over the bitrate filter`,
//    Created by tws101 
//    Prototype version 0.80
  Version: '0.80',
  Tags: 'pre-processing,ffmpeg,video only,configurable,av1',
    Inputs: [
      {
        name: "target_bitrate_480p576p",
        type: 'string',
        defaultValue: '450000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 480p and 576p files, if current bitrate exceeds the target. Plus 200k equals max bit rate.`,
      },
      {
        name: "target_bitrate_720p",
        type: 'string',
        defaultValue: '562500',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 720p files, if current bitrate exceeds the target. Plus 250k equals max bit rate.`,
      },
      {
        name: "target_bitrate_1080p",
        type: 'string',
        defaultValue: '900000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 1080p files, if current bitrate exceeds the target. Plus 300k equals max bit rate.`,
      },
      {
        name: "target_bitrate_4KUHD",
        type: 'string',
        defaultValue: '1800000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 4KUHD files, if current bitrate exceeds the target. Plus 600k equals max bit rate.`,
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
        name: 'reconvert_480p_576p_av1',
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
        type: 'string',
        defaultValue: '1050000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Filter bitrate to reconvert_480p_576p_av1`,
      },
      {
        name: 'reconvert_720p_av1',
        type: 'boolean',
        defaultValue: false,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `Will reconvert 720p av1 files that are above the av1_720p_filter_bitrate`,
      },
      {
        name: 'av1_720p_filter_bitrate',
        type: 'string',
        defaultValue: '1212500',
        inputUI: {
          type: 'text',
        },
        tooltip: `Filter bitrate to reconvert_720p_av1 `,
      },
      {
        name: 'reconvert_1080p_av1',
        type: 'boolean',
        defaultValue: false,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `Will reconvert 1080p av1 files that are above the av1_1080p_filter_bitrate`,
      },
      {
        name: 'av1_1080p_filter_bitrate',
        type: 'string',
        defaultValue: '1700000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Filter bitrate to reconvert_1080p_av1 `,
      },
      {
        name: 'reconvert_4KUHD_av1',
        type: 'boolean',
        defaultValue: false,
        inputUI: {
          type: 'dropdown',
          options: [
            'false',
            'true',
          ],
        },
        tooltip: `Will reconvert 4KUHD av1 files that are above the av1_filter_bitrate_4KUHD`,
      },
      {
        name: 'av1_filter_bitrate_4KUHD',
        type: 'string',
        defaultValue: '2800000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Filter bitrate to reconvert_4KUHD_av1`,
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

  let tiered = {
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
      "max_increase": 300,
      "cq": 31
    },
    "4KUHD": {
      "bitrate": inputs.target_bitrate_4KUHD,
      "max_increase": 600,
      "cq": 31
    },
    "Other": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 300,
      "cq": 31
    }
  };

  let inputSettings = {
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

    //check for reprocess av1

    const fileResolution = file.video_resolution;

    if ((inputs.reconvert_480p_576p_av1 === false) && ((fileResolution === "480p") || (fileResolution === "576p"))) {
      if (stream.codec_name === "av1") {
        logger.AddSuccess("File is in av1 and, 480p or 576p, and av1 processing is off");
        return;
      }
    }

    if ((inputs.av1_480p_576p_filter_bitrate > 0) && ((fileResolution === "480p") || (fileResolution === "576p"))) {
      if ((stream.codec_name === "av1") && (file.bit_rate < inputs.av1_480p_576p_filter_bitrate)) {
        logger.AddSuccess("File is in av1 and, 480p or 576p, and under the av1_480p_576p_filter_bitrate");
        return;
      }
    }

    if ((inputs.reconvert_720p_av1 === false) && (fileResolution === "720p")) {
      if (stream.codec_name === "av1") {
        logger.AddSuccess("File is in av1 and 720p, and av1 processing is off");
        return;
      }
    }

    if ((inputs.av1_720p_filter_bitrate > 0) && (fileResolution === "720p")) {
      if ((stream.codec_name === "av1") && (file.bit_rate < inputs.av1_720p_filter_bitrate)) {
        logger.AddSuccess("File is in av1 and 720p, and under the av1_720p_filter_bitrate");
        return;
      }
    }

    if ((inputs.reconvert_1080p_av1 === false) && (fileResolution === "1080p")) {
      if (stream.codec_name === "av1") {
        logger.AddSuccess("File is in av1 and 1080p, and av1 processing is off");
        return;
      }
    }

    if ((inputs.av1_1080p_filter_bitrate > 0) && (fileResolution === "1080p")) {
      if ((stream.codec_name === "av1") && (file.bit_rate < inputs.av1_1080p_filter_bitrate)) {
        logger.AddSuccess("File is in av1 and 1080p, and under the av1_1080p_filter_bitrate");
        return;
      }
    }

    if ((inputs.reconvert_4KUHD_av1 === false) && (fileResolution === "4KUHD")) {
      if (stream.codec_name === "av1") {
        logger.AddSuccess("File is in av1 and 4KUHD, and av1 processing is off");
        return;
      }
    }

    if ((inputs.av1_filter_bitrate_4KUHD > 0) && (fileResolution === "4KUHD")) {
      if ((stream.codec_name === "av1") && (file.bit_rate < inputs.av1_filter_bitrate_4KUHD)) {
        logger.AddSuccess("File is in av1 and 4KUHD, and under the av1_filter_bitrate_4KUHD");
        return;
      }
    }


    // remove png streams.
    if (stream.codec_name === "png") {
      configuration.AddOutputSetting(`-map -0:v:${id}`);
    } else {  // Transcode.
      let bitrateprobe = calculateBitrate(file);
      let bitratetarget = 0;
      let bitratemax = 0;
      let bitratecheck = 0;

      /*  Determine tiered bitrate variables */
      let tier = tiered[file.video_resolution];

      bitratecheck = parseInt(tier["bitrate"]);
      if (bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt((bitrateprobe * inputs.target_pct_reduction) / 1000);
      } else {
        bitratetarget = parseInt(tier["bitrate"] / 1000);
      }
      bitratemax = bitratetarget + tier["max_increase"];
      cq = tier["cq"];

      configuration.AddOutputSetting(
        `-c:v libsvtav1 -qmin 0 -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k`
      );

      configuration.AddInputSetting(inputSettings[file.video_codec_name]);

      if (file.video_codec_name === "h264" && file.ffProbeData.streams[0].profile !== "High 10" && file.ffProbeData.streams[0].profile !== "High 4:4:4 Predictive") {
        configuration.AddInputSetting("-c:v h264");
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

      logger.AddError("Transcoding to AV1 using CPU");
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

// Extra parameters
  let id = 0;
  let badTypes = ['mov_text', 'eia_608', 'timed_id3', 'mp4s'];
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (badTypes.includes(file.ffProbeData.streams[i].codec_name)) {
      response.preset += ` -map -0:${i}`;
    };
    id++;
  }

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