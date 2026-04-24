/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_drdd_standardise_all_in_one",
    Stage: "Pre-processing",
    Name: "DrDD H265 MKV AC3 Audio Subtitles [VAAPI & NVENC]",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      "[Non-Windows] In a single pass ensures all files are in MKV containers and where possible encoded in h265 (settings dependant on file bitrate), converts all multi channel audio to AC3, removes audio commentary and removes subtitles that are not in the configured language or marked as commentary. This plugin is opinionated based on how I like my library to be configured and based on the work done by Migz with his plugins (Thanks!).",
    Version: "1.0",
    Tags: "pre-processing,ffmpeg,vaapi,h265, nvenc h265",
    Inputs: [
      {
        name: "nvenc",
        type: 'string',
        defaultValue: 'false',
        inputUI: {
          type: 'text',
        },
        tooltip:
          "If the NVidia NVENC encoder should be used. Requires an NVidia GPU with NVENC capabilties.\\nValid values: true / false\\nDefault: false",
      },
      {
        name: "qsv",
        type: 'string',
        defaultValue: 'false',
        inputUI: {
          type: 'text',
        },
        tooltip:
          "If Intel Quick Sync should be used. Requires an Intel CPU with Quick Sync capabilties.\\nValid values: true / false\\nDefault: false",
      },
      {
        name: "minimum_target_bitrate",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip:
          "The minimum RESULTING bitrate allowed for a file. Any target bitrate lower than this will cause transcoding to be skipped.\\nExample value: 3000",
      },
      {
        name: "wanted_subtitle_languages",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip:
          "The comma separated subtitle languages (in 3 letter format) you'd like to keep. If left blank, all subtitles will be kept.\\nExample value: eng,fre",
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

/**
 * Returns the duration of the file in minutes.
 */
function getFileDurationInMinutes(file) {
  if (parseFloat(file.ffProbeData?.format?.duration) > 0) {
    return parseFloat(file.ffProbeData?.format?.duration) * 0.0166667;
  }

  return typeof file.meta.Duration != undefined
    ? file.meta.Duration * 0.0166667
    : file.ffProbeData.streams[0].duration * 0.0166667;
}

/**
 * Returns bitrate information.
 */
function calculateBitrate(
  file,
  divideBy = 2,
  minMultiplier = 0.7,
  maxMultiplier = 1.3
) {
  var duration = getFileDurationInMinutes(file);
  var original = ~~(file.file_size / (duration * 0.0075));

  // Change how much we cut the bitrate based on the original bitrate
  // of the file. When bitrate is already low, we don't want to lose
  // much more, but can still do a conversion.
  if (original < 10000 && original >= 6000) {
    divideBy = 1.75;
  }

  if (original < 6000) {
    divideBy = 1.5;
  }

  if (original < 3000) {
    divideBy = 1;
  }

  var target = ~~(original / divideBy);
  return {
    original: original,
    target: target,
    min: ~~(target * minMultiplier),
    max: ~~(target * maxMultiplier),
  };
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
 * Converts all multi channel audio streams to AC3.
 */
function buildAudioConfiguration(_inputs, file, logger) {
  var configuration = new Configurator(["-c:a copy"]);
  var hasNonAc3MultiChannelAudio = false;
  var hasMultiChannelAudio = false;
  loopOverStreamsOfType(file, "audio", function (stream, id) {
    hasMultiChannelAudio = stream.channels >= 6;
    if (stream.codec_name !== "ac3" && stream.channels >= 6) {
      configuration.AddOutputSetting(`-c:a:${id} ac3`);
      hasNonAc3MultiChannelAudio = true;
    }

    if ("tags" in stream && "title" in stream.tags) {
      if (
        stream.tags.title.toLowerCase().includes("commentary") ||
        stream.tags.title.toLowerCase().includes("description") ||
        stream.tags.title.toLowerCase().includes("sdh")
      ) {
        configuration.AddOutputSetting(`-map -0:a:${id}`);
        logger.AddError(
          `Removing Commentary or Description audio track: ${stream.tags.title}`
        );
      }
    }
  });

  if (hasNonAc3MultiChannelAudio) {
    logger.AddError("Will convert multi channel audio to AC3");
  }

  if (hasMultiChannelAudio && !hasNonAc3MultiChannelAudio) {
    logger.AddSuccess("Multi channel audio already exists in AC3");
  }

  if (!hasMultiChannelAudio) {
    logger.AddSuccess("No multi channel audio found");
  }

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No audio processing necessary");
  }

  return configuration;
}

/**
 * Removes subtitles that aren't in the allowed languages or labeled as Commentary tracks.
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:s copy"]);

  if (!inputs.wanted_subtitle_languages) return configuration;
  var languages = inputs.wanted_subtitle_languages.split(",");

  loopOverStreamsOfType(file, "subtitle", function (stream, id) {
    if (stream.codec_name === "eia_608") {
      // unsupported subtitle codec?
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      return;
    }

    if ("tags" in stream) {
      // Remove unwated languages
      if ("language" in stream.tags) {
        if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing subtitle in language ${stream.tags.language}`
          );
        }
      }

      // Remove commentary subtitles
      if ("title" in stream.tags) {
        if (
          stream.tags.title.toLowerCase().includes("commentary") ||
          stream.tags.title.toLowerCase().includes("description") ||
          stream.tags.title.toLowerCase().includes("sdh")
        ) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing Commentary or Description subtitle: ${stream.tags.title}`
          );
        }
      }
    }
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No subtitle processing necessary");
  }

  return configuration;
}

/**
 * Attempts to ensure that video streams are h265 encoded and inside an
 * MKV container. Will use CPU, Intel Quick Sync or NVidia NVENC encoding
 * as configured in the plugin inputs.
 */
function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0", "-map -0:d", "-c:v copy"]);
  loopOverStreamsOfType(file, "video", function (stream, id) {
    if (stream.codec_name === "mjpeg") {
      configuration.AddOutputSetting(`-map -v:${id}`);
      return;
    }

    if (stream.codec_name === "hevc" && file.container === "mkv") {
      logger.AddSuccess("File is in HEVC codec and in MKV");
      return;
    }

    // Check if should Remux.
    if (stream.codec_name === "hevc" && file.container !== "mkv") {
      configuration.AddOutputSetting("-c:v copy");
      logger.AddError("File is in HEVC codec but not MKV. Will remux");
    }

    // Check if should Transcode.
    if (stream.codec_name !== "hevc") {
      var bitrate = calculateBitrate(file);
      if (
        inputs.minimum_target_bitrate !== "" &&
        bitrate.target < inputs.minimum_target_bitrate
      ) {
        logger.AddError(
          `Skipping video encoding as target bitrate (${bitrate.target}) too low`
        );
        return;
      }

      var bitrateSettings = `-b:v ${bitrate.target}k -minrate ${bitrate.min}k -maxrate ${bitrate.max}k -bufsize ${bitrate.original}k`;

      /**
       * Intel Quick Sync configuration
       */
      if (inputs.qsv === "true" && stream.codec_name !== "mpeg4") {
        configuration.AddInputSetting(
          "-hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi"
        );

        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(`-c:v hevc_vaapi ${bitrateSettings}`);
        logger.AddError("Transcoding to HEVC using VAAPI");
      }

      /**
       * NVENC Configuration
       */
      if (inputs.nvenc === "true") {
        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(
          `-c:v hevc_nvenc -cq:v 19 ${bitrateSettings} -spatial_aq:v 1 -rc-lookahead:v 32`
        );

        if (file.video_codec_name === "h263") {
          configuration.AddInputSetting("-c:v h263_cuvid");
        } else if (file.video_codec_name === "h264") {
          if (file.ffProbeData.streams[0].profile !== "High 10") {
            configuration.AddInputSetting("-c:v h264_cuvid");
          } else if (file.video_codec_name === "mjpeg") {
            configuration.AddInputSetting("c:v mjpeg_cuvid");
          } else if (file.video_codec_name == "mpeg1") {
            configuration.AddInputSetting("-c:v mpeg1_cuvid");
          } else if (file.video_codec_name == "mpeg2") {
            configuration.AddInputSetting("-c:v mpeg2_cuvid");
          } else if (file.video_codec_name == "mpeg4") {
            configuration.AddInputSetting("-c:v mpeg4_cuvid");
          } else if (file.video_codec_name == "vc1") {
            configuration.AddInputSetting("-c:v vc1_cuvid");
          } else if (file.video_codec_name == "vp8") {
            configuration.AddInputSetting("-c:v vp8_cuvid");
          } else if (file.video_codec_name == "vp9") {
            configuration.AddInputSetting("-c:v vp9_cuvid");
          }
        }

        logger.AddError("Transcoding to HEVC using NVidia NVENC");
      }

      if (
        (inputs.qsv !== "true" && inputs.nvenc !== "true") ||
        (inputs.qsv === "true" && stream.codec_name === "mpeg4")
      ) {
        configuration.RemoveOutputSetting("-c:v copy");
        configuration.AddOutputSetting(`-c:v libx265 ${bitrateSettings}`);
        logger.AddError("Transcoding to HEVC (software)");
      }

      logger.Add(
        `Encoder configuration:\n• Original Bitrate: ${bitrate.original}\n• Target Bitrate: ${bitrate.target}\n• Minimum Bitrate: ${bitrate.min}\n• Maximum Bitrate: ${bitrate.max}\n`
      );
    }
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No video processing necessary");
  }

  return configuration;
}

//#endregion

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {

  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    container: ".mkv",
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: false,
  };

  if (inputs.qsv === "true" && inputs.nvenc === "true") {
    response.infoLog += `Cannot select both Intel Quick Sync and NVidia NVENC. Aborting.`;
    return response;
  }

  var logger = new Log();
  var audioSettings = buildAudioConfiguration(inputs, file, logger);
  var videoSettings = buildVideoConfiguration(inputs, file, logger);
  var subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

  response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()} ${audioSettings.GetOutputSettings()} ${subtitleSettings.GetOutputSettings()} -max_muxing_queue_size 4096`;
  response.processFile =
    audioSettings.shouldProcess ||
    videoSettings.shouldProcess ||
    subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess("No need to process file");
  }

  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
