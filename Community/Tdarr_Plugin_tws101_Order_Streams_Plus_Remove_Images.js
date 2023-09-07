/* eslint-disable */
// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_tws101_Order_Streams_Plus_Remove_Images',
  Stage: 'Pre-processing',
  Name: 'tws101 - Order Streams Plus Remove Images',
  Type: 'Any',
  Operation: 'Transcode',
  Description: ` Put stream in order video, audio by channel count less to more, then subtitles.  Option remove image formats, MJPEG, PNG & GIF, recommended leave true.
  Option to remove invalid data streams that ffmpeg does not suppport `,
  //    Created by tws101
  //    Release Version 1.50
  Version: '1.50',
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
      tooltip: 'This will remove: MJPEG, PNG, BMP, & GIF.  Recommended ',
    },
    {
      name: 'remove_invalid_data',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: 'This will remove data streams that have incomplete data in them.  Recommended ',
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
    return this.entries.join('\n');
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
    const index = this.outputSettings.indexOf(configuration);

    if (index === -1) return;
    this.outputSettings.splice(index, 1);
  }

  GetOutputSettings() {
    return this.outputSettings.join(' ');
  }

  GetInputSettings() {
    return this.inputSettings.join(' ');
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
 * Abort Section 
 */
function checkAbort(inputs, file, logger) {
  if (file.fileMedium !== 'video') {
    logger.AddError('File is not a video.');
    return true;
  }
  let audioIdx = 0;
  let audio2Idx = 0;
  let audio6Idx = 0;
  let audio8Idx = 0;
  let subtitleIdx = 0;
  let allGood = true;

  if (inputs.remove_images === true) {
    function imageRemovalCheck(stream, id) {
      if (
        stream.codec_name === 'mjpeg'
        || stream.codec_name === 'png'
        || stream.codec_name === 'gif'
        || stream.codec_name === 'bmp'
      ) {
        allGood = false;
        logger.AddError('Image format detected removing');
      }
    }
    loopOverStreamsOfType(file, 'video', imageRemovalCheck);
  }

  if (inputs.remove_invalid_data === true) {
    function invalidDataCheck(stream, id) {
      if (!stream.codec_name && stream.codec_tag_string === 'tmcd') {
        allGood = false;
        logger.AddError('Invalid data stream detected removing');
      }
    }
    loopOverStreamsOfType(file, 'data', invalidDataCheck);
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
        if (audioIdx !== 0 || subtitleIdx !== 0) {
          allGood = false;
          logger.AddError('Video not first.');
        }
      }
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (subtitleIdx !== 0) {
          allGood = false;
          logger.AddError('Audio not second.');
        }
        audioIdx += 1;
        if (file.ffProbeData.streams[i].channels === 1) {
          if (audio2Idx !== 0 || audio6Idx !== 0 || audio8Idx !== 0) {
            allGood = false;
            logger.AddError('Audio 1ch not first.');
          }
        }
        if (file.ffProbeData.streams[i].channels === 2) {
          if (audio6Idx !== 0 || audio8Idx !== 0) {
            allGood = false;
            logger.AddError('Audio 2ch not second.');
          }
          audio2Idx += 1;
        }
        if (file.ffProbeData.streams[i].channels === 6) {
          if (audio8Idx !== 0) {
            allGood = false;
            logger.AddError('Audio 6ch not third.');
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

  if (allGood) {
    logger.AddSuccess('Everything is in order.');
    return true;
  }
  return false;
}

/**
 * Video    Map ALL  "-map 0"   Map Video  "-map 0:v"    Copy Video  "-c:v copy"
 */
function buildVideoConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['-map 0:v']);

  function imageRemoval(stream, id) {
    if (
      stream.codec_name === 'mjpeg'
      || stream.codec_name === 'png'
      || stream.codec_name === 'gif'
      || stream.codec_name === 'bmp'
    ) {
      configuration.AddOutputSetting(` -map -0:v:${id} `);
    }
  }

  if (inputs.remove_images === true) {
    loopOverStreamsOfType(file, 'video', imageRemoval);
  }

  return configuration;
}

/**
 * Audio   Map Audio "-map 0:a"  Copy Audio  "-c:a copy"
 */
function buildAudioConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['']);

  function orderAudioStreams1Channel(stream, id) {
    try {
      if (stream.channels === 1) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }
  function orderAudioStreams2Channel(stream, id) {
    try {
      if (stream.channels === 2) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }
  function orderAudioStreams6Channel(stream, id) {
    try {
      if (stream.channels === 6) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }
  function orderAudioStreams8Channel(stream, id) {
    try {
      if (stream.channels === 8) {
        configuration.AddOutputSetting(` -map 0:a:${id} `);
      }
    } catch (err) {}
  }

  loopOverStreamsOfType(file, 'audio', orderAudioStreams1Channel);
  loopOverStreamsOfType(file, 'audio', orderAudioStreams2Channel);
  loopOverStreamsOfType(file, 'audio', orderAudioStreams6Channel);
  loopOverStreamsOfType(file, 'audio', orderAudioStreams8Channel);

  return configuration;
}

/**
 * Subtitles and data  Map subs "-map 0:s?" Map Data "-map 0:d?"   Copy Subs  "-c:s copy"  Copy Data "-c:d copy"   Ending copy command "-c copy"
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  const configuration = new Configurator(['-map 0:s?', '-map 0:d?', '-map 0:t?', '-c copy']);

  function invaliddata(stream, id) {
    if (!stream.codec_name && stream.codec_tag_string === 'tmcd') {
      configuration.AddOutputSetting(` -map -0:d:${id} -write_tmcd false `);
    }
  }

  loopOverStreamsOfType(file, 'data', invaliddata);

  return configuration;
}

// #end region

// #Final Region
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    container: `.${file.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: '',
    processFile: false,
    preset: '',
    reQueueAfter: true,
  };

  const logger = new Log();

  const abort = checkAbort(inputs, file, logger);
  if (abort) {
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const audioSettings = buildAudioConfiguration(inputs, file, logger);
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

  response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()}`;
  response.preset += ` ${audioSettings.GetOutputSettings()}`;
  response.preset += ` ${subtitleSettings.GetOutputSettings()}`;
  response.preset += ' -max_muxing_queue_size 9999';

  response.processFile = audioSettings.shouldProcess
    || videoSettings.shouldProcess
    || subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddError('YOU SHOULD NOT SEE THIS ALL GOOD FAILED AND NO ACTION WAS TAKEN!');
  }

  response.infoLog += logger.GetLogData();
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
