const details = () => ({
  id: 'Tdarr_Plugin_tws101_Order_Streams_Plus_Remove_Images',
  Stage: 'Pre-processing',
  Name: 'tws101 - Order Streams Plus Remove Images',
  Type: 'Any',
  Operation: 'Transcode',
  Description: ` Put stream in order video, audio by channel count less to more, then subtitles.  Option remove image formats, MJPEG, PNG & GIF, recommended leave true `,
  //    Created by tws101 
  //    Release Version 1.10
  Version: '1.10',
  Tags: 'pre-processing,configurable,ffmpeg',
  Inputs: [
    {
      name: 'remove_images',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `This will remove: MJPEG, PNG & GIF.  Recommended `,
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
 * Video    Map ALL  "-map 0"   Map Video  "-map 0:v"    Copy Video  "-c:v copy"
 */
function buildVideoConfiguration(inputs, file, logger) {
  let configuration = new Configurator(["-map 0:v"]);

  function imageremoval(stream, id) {
    if (
      stream.codec_name === 'mjpeg'
      || stream.codec_name === 'png'
      || stream.codec_name === 'gif'
    ) {
      configuration.AddOutputSetting(` -map -0:v:${id} `);
    }
  }

  if (inputs.remove_images === true) {
    loopOverStreamsOfType(file, "video", imageremoval);
  }

  return configuration;
}

/**
 * Audio   Map Audio "-map 0:a"  Copy Audio  "-c:a copy"
 */
function buildAudioConfiguration(inputs, file, logger) {
  let configuration = new Configurator([""]);

  function orderaudiostreams1ch(stream, id) {
    try {
      if (stream.channels === 1) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }
  function orderaudiostreams2ch(stream, id) {
    try {
      if (stream.channels === 2) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }
  function orderaudiostreams6ch(stream, id) {
    try {
      if (stream.channels === 6) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }
  function orderaudiostreams8ch(stream, id) {
    try {
      if (stream.channels === 8) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }

  loopOverStreamsOfType(file, "audio", orderaudiostreams1ch);
  loopOverStreamsOfType(file, "audio", orderaudiostreams2ch);
  loopOverStreamsOfType(file, "audio", orderaudiostreams6ch);
  loopOverStreamsOfType(file, "audio", orderaudiostreams8ch);

  return configuration;
}

/**
 * Subtitles and data  Map subs "-map 0:s?" Map Data "-map 0:d?"   Copy Subs  "-c:s copy"  Copy Data "-c:d copy"   Ending copy command "-c copy"
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  let configuration = new Configurator(["-map 0:s?", "-map 0:d?", "-map 0:t?", "-c copy"]);
  return configuration;
}

// #end region

// #Final Region
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

  // Check all good
  let audioIdx = 0;
  let audio2Idx = 0;
  let audio6Idx = 0;
  let audio8Idx = 0;
  let subtitleIdx = 0;
  let allgood = true;

  if (inputs.remove_images === true) {
    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
        if (
          file.ffProbeData.streams[i].codec_name === 'mjpeg'
          || file.ffProbeData.streams[i].codec_name === 'png'
          || file.ffProbeData.streams[i].codec_name === 'gif'
        ) {
          allgood = false;
          logger.AddError("Image format detected removing");
        }
      }
    }
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
        if (audioIdx !== 0 || subtitleIdx !== 0) {
          allgood = false;
          logger.AddError("Video not first.");
        }
      }

      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (subtitleIdx !== 0) {
          allgood = false;
          logger.AddError("Audio not second.");
        }
        audioIdx += 1;

        if (file.ffProbeData.streams[i].channels === 1) {
          if (audio2Idx !== 0 || audio6Idx !== 0 || audio8Idx !== 0) {
            allgood = false;
            logger.AddError("Audio 1ch not first.");
          }
        }
        if (file.ffProbeData.streams[i].channels === 2) {
          if (audio6Idx !== 0 || audio8Idx !== 0) {
            allgood = false;
            logger.AddError("Audio 2ch not second.");
          }
          audio2Idx += 1;
        }
        if (file.ffProbeData.streams[i].channels === 6) {
          if (audio8Idx !== 0) {
            allgood = false;
            logger.AddError("Audio 6ch not third.");
          }
          audio6Idx += 1;
        }

        if (file.ffProbeData.streams[i].channels === 8) {
          audio8Idx += 1;
        }
      }

      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
        subtitleIdx += 1;
      }
    } catch (err) {}
  }

  if (allgood === true) {
    logger.AddSuccess("Everything is in order.");
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
  response.preset += ` -max_muxing_queue_size 9999`

  response.processFile =
    audioSettings.shouldProcess ||
    videoSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess("YOU SHOULD NOT SEE THIS ALL GOOD FAILED AND NO ACTION WAS TAKEN!");
  }

  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
