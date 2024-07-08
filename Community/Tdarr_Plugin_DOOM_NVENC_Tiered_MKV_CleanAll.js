/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_DOOM_NVENC_Tiered_MKV_CleanAll",
    Stage: 'Pre-processing',
    Name: "DOOM Tiered H265 MKV, Remove Audio & Subtitles [NVENC]",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      "In a single pass ensures all files are in MKV containers and where possible encoded in h265 (Tiered bitrate based on resolution), removes audio and subtitles that are not in the configured language or marked as commentary.",
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
        tooltip: `Specify the target bitrate for 480p and 576p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 1 Mbps:\\n
                1000000`,
      },
      {
        name: "target_bitrate_720p",
        type: 'string',
        defaultValue: '2000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 720p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 2 Mbps:\\n
                2000000`,
      },
      {
        name: "target_bitrate_1080p",
        type: 'string',
        defaultValue: '2500000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 1080p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 2.5 Mbps:\\n
                2500000`,
      },
      {
        name: "target_bitrate_4KUHD",
        type: 'string',
        defaultValue: '14000000',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target bitrate for 4KUHD files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 14 Mbps:\\n
                14000000`,
      },
      {
        name: "target_pct_reduction",
        type: 'string',
        defaultValue: '.50',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the target reduction of bitrate, if current bitrate is less than resolution targets.
                \\nExample 50%:\\n
                .50`,
      },
      {
        name: "audio_language",
        type: 'string',
        defaultValue: 'eng',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify language tag/s here for the audio tracks you'd like to keep, recommended to keep "und" as this stands for undertermined, some files may not have the language specified. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng

                \\nExample:\\n
                eng,und

                \\nExample:\\n
                eng,und,jap`,
      },
      {
        name: "audio_commentary",
        type: 'string',
        defaultValue: 'false',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify if audio tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
      },
      {
        name: "subtitle_language",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng

                \\nExample:\\n
                eng,jap`,
      },
      {
        name: "subtitle_commentary",
        type: 'string',
        defaultValue: 'false',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify if subtitle tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true

                \\nExample:\\n
                false`,
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
 * Removes audio tracks that aren't in the allowed languages or labeled as Commentary tracks.
 * Transcode audio if specified.
 */
function buildAudioConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:a copy"]);
  var stream_count = 0;
  var streams_removing = 0;
  var languages = inputs.audio_language.split(",");

  function audioProcess(stream, id) {
    stream_count++;
    if ("tags" in stream && "title" in stream.tags && inputs.audio_commentary.toLowerCase() == "true") {
      if (
        stream.tags.title.toLowerCase().includes("commentary") ||
        stream.tags.title.toLowerCase().includes("description") ||
        stream.tags.title.toLowerCase().includes("sdh")
      ) {
        streams_removing++;
        configuration.AddOutputSetting(`-map -0:a:${id}`);
        logger.AddError(
          `Removing Commentary or Description audio track: ${stream.tags.title}`
        );
      }
    }
    if ("tags" in stream) {
      // Remove unwanted languages
      if ("language" in stream.tags) {
        if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
          configuration.AddOutputSetting(`-map -0:a:${id}`);
          streams_removing++;
          logger.AddError(
            `Removing audio track in language ${stream.tags.language}`
          );
        }
      }
    }
  }

  loopOverStreamsOfType(file, "audio", audioProcess);

  if (stream_count == streams_removing) {
    logger.AddError(
      `*** All audio tracks would have been removed.  Defaulting to keeping all tracks for this file.`
    );
    configuration.ResetOutputSetting(["-c:a copy"]);
  }

  return configuration;
}


/**
 * Removes subtitles that aren't in the allowed languages or labeled as Commentary tracks.
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:s copy"]);

  var languages = inputs.subtitle_language.split(",");
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

    if ("tags" in stream) {
      // Remove unwanted languages
      if ("language" in stream.tags) {
        if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing subtitle in language ${stream.tags.language}`
          );
          return;
        }
      }

      // Remove commentary subtitles
      if ("title" in stream.tags && (inputs.subtitle_commentary.toLowerCase() == "true")) {
        if (
          stream.tags.title.toLowerCase().includes("commentary") ||
          stream.tags.title.toLowerCase().includes("description") ||
          stream.tags.title.toLowerCase().includes("sdh")
        ) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing Commentary or Description subtitle: ${stream.tags.title}`
          );
          return;
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
 * MKV container.
 */
function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0", "-map -0:d", "-c:v copy"]);

  var tiered = {
    "480p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "max_increase": 500,
      "cq": 29
    },
    "576p": {
      "bitrate": inputs.target_bitrate_480p576p,
      "max_increase": 500,
      "cq": 29
    },
    "720p": {
      "bitrate": inputs.target_bitrate_720p,
      "max_increase": 2000,
      "cq": 30
    },
    "1080p": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 2500,
      "cq": 31
    },
    "4KUHD": {
      "bitrate": inputs.target_bitrate_4KUHD,
      "max_increase": 6000,
      "cq": 31
    },
    "Other": {
      "bitrate": inputs.target_bitrate_1080p,
      "max_increase": 2500,
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

    if ((stream.codec_name === "hevc" || stream.codec_name === "vp9") && file.container === "mkv") {
      logger.AddSuccess("File is in HEVC codec and in MKV");
      return;
    }

    // Check if should Remux.
    if ((stream.codec_name === "hevc" || stream.codec_name === "vp9") && file.container !== "mkv") {
      configuration.AddOutputSetting("-c:v copy");
      logger.AddError("File is in HEVC codec but not MKV. Will remux");
    }

    // remove png streams.
    if (stream.codec_name === "png") {
      configuration.AddOutputSetting(`-map -0:v:${id}`);
    } else if (stream.codec_name !== "hevc" && stream.codec_name !== "vp9") {  // Check if should Transcode.
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
        `-c:v hevc_nvenc -qmin 0 -cq:v ${cq} -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k -preset medium -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8`
      );

      configuration.AddInputSetting(inputSettings[file.video_codec_name]);

      if (file.video_codec_name === "h264" && file.ffProbeData.streams[0].profile !== "High 10") {
        configuration.AddInputSetting("-c:v h264_cuvid");
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