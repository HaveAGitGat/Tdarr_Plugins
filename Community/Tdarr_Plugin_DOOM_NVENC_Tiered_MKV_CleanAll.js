/* eslint-disable */
function details() {
  return {
    id: "Tdarr_Plugin_DOOM_NVENC_Tiered_MKV_CleanAll",
    Name: "DOOM Tiered H265 MKV, remove audio & subtitles [NVENC]",
    Stage: "Pre-processing",
    Type: "Video",
    Operation: "Transcode",
    Description:
      "In a single pass ensures all files are in MKV containers and where possible encoded in h265 (Tiered bitrate based on resolution), removes audio and subtitles that are not in the configured language or marked as commentary.",
    Tags: "pre-processing,ffmpeg,nvenc h265",
    Inputs: [
      {
        name: "target_bitrate_480p576p",
        tooltip: `Specify the target bitrate for 480p and 576p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 1 Mbps:\\n
                1000000`,
      },
      {
        name: "target_bitrate_720p",
        tooltip: `Specify the target bitrate for 720p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 2 Mbps:\\n
                2000000`,
      },
      {
        name: "target_bitrate_1080p",
        tooltip: `Specify the target bitrate for 1080p files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 2.5 Mbps:\\n
                2500000`,
      },
      {
        name: "target_bitrate_4KUHD",
        tooltip: `Specify the target bitrate for 4KUHD files, if current bitrate exceeds the target. Otherwise target_pct_reduction will be used.
                \\nExample 14 Mbps:\\n
                14000000`,
      },
    {
        name: "target_pct_reduction",
        tooltip: `Specify the target reduction of bitrate, if current bitrate is less than resolution targets.
                \\nExample 60%:\\n
                .60`,
      },
      {
        name: "source_audio_codec",
        tooltip: `Specifiy the codecs which you'd like to transcode
        \\nExample:\\n
        dts
        \\nExample:\\n
        dts,eac3,aac`,
      },
      {
        name: "target_audio_codec",
        tooltip: `Specify the audio codec you'd like to transcode into:
        \\n aac
        \\n ac3
        \\n eac3
        \\n dts
        \\n flac
        \\n mp2
        \\n mp3
        \\n truehd
        \\nExample:\\n
        eac3`,
      },
      {
        name: "target_audio_bitrate",
        tooltip: `Specify the transcoded audio bitrate:
        \\n 384k
        \\n 640k
        \\nExample:\\n
        640k`,
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
  loopOverStreamsOfType(file, "audio", function (stream, id) {
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
  }});

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
      var bitrateprobe = calculateBitrate(file);
      var bitratetarget = 0;
      var bitratemax = 0;
      var cq = 0;
      var bitratecheck = 0;
      /**
       * NVENC Configuration
      */

    /*  Determine tiered bitrate variables */
    if (file.video_resolution === "480p" || file.video_resolution === "576p" ) {
      bitratecheck = parseInt(inputs.target_bitrate_480p576p);
      if(bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt((bitrateprobe * inputs.target_pct_reduction) / 1000); // Lower Bitrate to 60% of original and convert to KB
        bitratemax = bitratetarget + 500; // Set max bitrate to 0.5MB Higher  
        cq = 29;
      } else {
        bitratetarget = parseInt(inputs.target_bitrate_480p576p / 1000);
        bitratemax = bitratetarget + 500;
        cq = 29;
      } 
    }
    if (file.video_resolution === "720p") {
      bitratecheck = parseInt(inputs.target_bitrate_720p);
      if(bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt((bitrateprobe * inputs.target_pct_reduction) / 1000); // Lower Bitrate to 60% of original and convert to KB
        bitratemax = bitratetarget + 2000;  // Set max bitrate to 2MB Higher  
        cq = 30;
      } else {
        bitratetarget = parseInt(inputs.target_bitrate_720p / 1000);
        bitratemax = bitratetarget + 2000;  
        cq = 30;
      }
    }
    if (file.video_resolution === "1080p") {
      bitratecheck = parseInt(inputs.target_bitrate_1080p);
      if(bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt((bitrateprobe * inputs.target_pct_reduction) / 1000); // Lower Bitrate to 60% of original and convert to KB
        bitratemax = bitratetarget + 2500;  // Set max bitrate to 2.5MB Higher  
        cq = 31;
      } else {
        bitratetarget = parseInt(inputs.target_bitrate_1080p / 1000);
        bitratemax = bitratetarget + 2500;  
        cq = 31;
      }
    } 
    if (file.video_resolution === "4KUHD") {
      bitratecheck = parseInt(inputs.target_bitrate_4KUHD);
      if(bitrateprobe !== null && bitrateprobe < bitratecheck) {
        bitratetarget = parseInt((bitrateprobe * inputs.target_pct_reduction) / 1000); // Lower Bitrate to 60% of original and convert to KB
        bitratemax = bitratetarget + 6000;  // Set max bitrate to 6MB Higher  
        cq = 31;
      } else {
        bitratetarget = parseInt(inputs.target_bitrate_4KUHD / 1000);
        bitratemax = bitratetarget + 6000;
        cq = 31;
      }
    }

    configuration.RemoveOutputSetting("-c:v copy");
    configuration.AddOutputSetting(
      `-c:v hevc_nvenc -rc:v vbr_hq -qmin 0 -cq:v ${cq} -b:v ${bitratetarget}k -maxrate:v ${bitratemax}k -preset medium -rc-lookahead 32 -spatial_aq:v 1 -aq-strength:v 8`
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
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess("No video processing necessary");
  }

  return configuration;
}

//#endregion

function plugin(file, _librarySettings, inputs) {
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
