/* eslint-disable */
function details() {
  return {
    id: "Tdarr_Plugin_VP92_VP9_Match_Bitrate_One_Pass",
    Stage: "Pre-processing",
    Name: "VP9 Encoding Match Bitrate 1 Pass System",
    Type: "Video",
    Operation: "Transcode",
    Description: `Will run through linvpx-vp9 and follow the contrained quality contraints. Will also encode audio to opus using libopus
        Allows user-input on the desired constrained quality amount for each video resolution with defaults if none are given.`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_075a_FFMPEG_HEVC_Generic.js",
    Tags: "pre-processing,ffmpeg,vp9",
    Inputs: [
      {
        name: "_240p_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 32",
      },
      {
        name: "_360p_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 31",
      },
      {
        name: "_480p_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 28",
      },
      {
        name: "_720p_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 27",
      },
      {
        name: "_1080p_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 26",
      },
      {
        name: "_4KUHD_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 15",
      },
      {
        name: "_8KUHD_CQ",
        tooltip:
          "The CQ number (recommended 15-35) for this resolution, default 15",
      },
      {
        name: "audio_language",
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
        tooltip: `Specify if audio tracks that contain commentary/description should be removed.
                \\nExample:\\n
                true
                \\nExample:\\n
                false`,
      },
      {
        name: "subtitle_language",
        tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng
                \\nExample:\\n
                eng,jap`,
      },
      {
        name: "subtitle_commentary",
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

function buildAudioConfiguration(inputs, file, logger) {
  // var configuration = new Configurator(["-c:a libopus"]);
  var configuration = new Configurator(["-c:a copy"]);
  var stream_count = 0;
  var streams_removing = 0;
  var languages = inputs.audio_language.split(",");
  var opusFormat = false;
  var mappingFamily = false;

  loopOverStreamsOfType(file, "audio", function (stream, id) {
    stream_count++;

    if (
      "tags" in stream &&
      "title" in stream.tags &&
      inputs.audio_commentary.toLowerCase() == "true"
    ) {
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

    if (stream.codec_name != "opus" && !opusFormat) {
      logger.AddError("Audio is not in proper codec, will format");
      configuration.RemoveOutputSetting("-c:a copy");
      configuration.AddOutputSetting("-c:a libopus");
      opusFormat = true;
    }

    // only add audio mappings if we've determined we need to transcode into opus
    if (!opusFormat) {
      return;
    }

    if (stream.channel_layout == "5.1(side)") {
      logger.AddSuccess(
        `Determined audio to be ${stream.channel_layout}, adding mapping configuration for proper conversion`
      );
      configuration.AddOutputSetting(
        `-af:${id} "channelmap=channel_layout=5.1"`
      );
    }
    if (stream.channel_layout == "7.1") {
      logger.AddSuccess(
        `Determined audio to be ${stream.channel_layout}, adding mapping configuration for proper conversion`
      );
      configuration.AddOutputSetting(
        `-af:${id} "channelmap=channel_layout=7.1"`
      );
    }
    if (stream.channel_layout == "stereo") {
      logger.AddSuccess(
        `Determined audio to be ${stream.channel_layout}, adding mapping configuration for proper conversion`
      );
      configuration.AddOutputSetting(
        `-af:${id} "channelmap=channel_layout=stereo"`
      );
    }
    if (stream.channel_layout == "mono") {
      logger.AddSuccess(
        `Determined audio to be ${stream.channel_layout}, adding mapping configuration for proper conversion`
      );
      configuration.AddOutputSetting(
        `-af:${id} "channelmap=channel_layout=mono"`
      );
    }

    if (!mappingFamily) {
      configuration.AddOutputSetting(`-mapping_family 1`);
      mappingFamily = true;
    }
  });

  if (stream_count == streams_removing) {
    logger.AddError(
      `*** All audio tracks would have been removed.  Defaulting to keeping all tracks for this file.`
    );
    configuration.ResetOutputSetting(["-c:a copy"]);
  }

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No audio processing necessary");
  }

  return configuration;
}

function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0", "-map -0:d", "-c:v copy"]);

  loopOverStreamsOfType(file, "video", function (stream, id) {
    if (stream.codec_name === "mjpeg") {
      configuration.AddOutputSetting(`-map -v:${id}`);
      return;
    }

    if (stream.codec_name === "vp9" && file.container === "webm") {
      logger.AddSuccess("File is in proper video format");
      return;
    }

    if (stream.codec_name === "vp9" && file.container !== "webm") {
      configuration.AddOutputSetting("-c:v copy");
      logger.AddError(
        "File is in proper codec but not write container. Will remux"
      );
    }

    var speed = 1;
    var targetQuality = 32;
    var tileColumns = 0;
    var threadCount = 64;
    if (file.video_resolution == "240p") {
      targetQuality = inputs._240p_CQ | 32;
      tileColumns = 0;
      speed = 1;
    } else if (
      file.video_resolution == "360p" ||
      file.video_resolution === "576p"
    ) {
      targetQuality = inputs._360p_CQ | 31;
      tileColumns = 1;
      speed = 1;
    } else if (file.video_resolution == "480p") {
      targetQuality = inputs._480p_CQ | 28;
      tileColumns = 1;
      speed = 1;
    } else if (file.video_resolution == "720p") {
      targetQuality = inputs._720p_CQ | 27;
      tileColumns = 2;
      speed = 2;
    } else if (file.video_resolution == "1080p") {
      targetQuality = inputs._1080p_CQ | 26;
      tileColumns = 2;
      speed = 2;
    } else if (
      file.video_resolution == "1440p" ||
      file.video_resolution == "2560p" ||
      file.video_resolution == "4KUHD"
    ) {
      targetQuality = inputs._4KUHD_CQ | 15;
      tileColumns = 3;
      speed = 2;
    } else if (file.video_resolution == "8KUHD") {
      targetQuality = inputs._8KUHD_CQ | 15;
      tileColumns = 3;
      speed = 2;
    }

    configuration.RemoveOutputSetting("-c:v copy");
    configuration.AddOutputSetting(
      `-pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf ${targetQuality} -threads ${threadCount} -speed ${speed} -quality good -static-thresh 0 -tile-columns ${tileColumns} -tile-rows 0 -frame-parallel 0 -row-mt 1 -aq-mode 0 -g 240`
    );

    logger.AddError("Transcoding file to VP9");
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No video processing necessary");
  }

  return configuration;
}

function buildSubtitleConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-c:s copy"]);
  //webvtt

  var languages = inputs.subtitle_language.split(",");
  var webvttFormat = false;
  // if (languages.length === 0) return configuration;

  loopOverStreamsOfType(file, "subtitle", function (stream, id) {
    if (
      stream.codec_name == "hdmv_pgs_subtitle" ||
      stream.codec_name === "eia_608"
    ) {
      logger.AddError(
        `Removing subtitle in invalid codec ${stream.codec_name}`
      );
      configuration.AddOutputSetting(`-map -0:s:${id}`);
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
      if (
        "title" in stream.tags &&
        inputs.subtitle_commentary.toLowerCase() == "true"
      ) {
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

    if (stream.codec_name != "webvtt" && !webvttFormat) {
      logger.AddError(`Formatting subtitles to webvtt format`);
      configuration.RemoveOutputSetting("-c:s copy");
      configuration.AddOutputSetting("-c:s webvtt");
      webvttFormat = true;
    }
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No subtitle processing necessary");
  }

  return configuration;
}

function plugin(file, librarySettings, inputs) {
  //Must return this object
  var response = {
    container: ".webm",
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

  response.processFile =
    audioSettings.shouldProcess ||
    videoSettings.shouldProcess ||
    subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess("No need to process file");
  }

  response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()} ${audioSettings.GetOutputSettings()} ${subtitleSettings.GetOutputSettings()}`;
  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
