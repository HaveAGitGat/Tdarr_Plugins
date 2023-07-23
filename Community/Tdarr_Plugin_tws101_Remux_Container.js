const details = () => ({
  id: 'Tdarr_Plugin_tws101_Remux_Container',
  Stage: 'Pre-processing',
  Name: 'tws101 - Remux Container',
  Type: 'Video',
  Operation: 'Transcode',
  Description: ` The input file will be remuxed into MKV or MP4. Force conform is recommended, this will remove incompatible items from the new container. `,
  //    Created by tws101 
  //    Release Version 1.10
  Version: '1.10',
  Tags: 'pre-processing,ffmpeg,video only,configurable',
  Inputs: [
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'mkv',
          'mp4',
        ],
      },
      tooltip: `Choose output container of file`,
    },
    {
      name: 'force_conform',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Make the file conform to output containers requirements.
                  \\n Drop all attachment streams and hdmv_pgs_subtitle/eia_608/subrip/timed_id3/ass/ssa subs for MP4.
                  \\n Drop all data streams and /mov_text/eia_608/timed_id3 subs for MKV.
                  \\n Default is true.`,
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
 * Video, Map ALL and set ALL to copy
 */
function buildVideoConfiguration(inputs, file, logger) {
  let configuration = new Configurator([""]);

  //Check if we are going to Remux
  if (file.container !== inputs.container) {
    logger.AddError(`File is ${file.container} but requested is ${inputs.container} container. Remuxing.`);
    configuration.AddOutputSetting(` -map 0 -c copy -max_muxing_queue_size 9999 `);
  }

  // If Container .ts or .avi set genpts to fix unknown timestamp
  if (file.container.toLowerCase() === 'ts' || file.container.toLowerCase() === 'avi') {
    configuration.AddInputSetting(` -fflags +genpts`);
  }

  return configuration;
}

/**
 * Audio, No Audio Config
 */
function buildAudioConfiguration(inputs, file, logger) {
  let configuration = new Configurator([""]);
  return configuration;
}

/**
 * Subtitles, remove incompatible: subs, data, or attachments as needed.
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  let configuration = new Configurator([""]);

  if (inputs.force_conform === true) {
    if (inputs.container === 'mkv') {
      configuration.AddOutputSetting(` -map -0:d `);
      function mkvconform(stream, id) {
        if (stream.codec_name !== undefined) {
          codec = stream.codec_name.toLowerCase();
        }
        if (codec === 'mov_text' || codec === 'eia_608' || codec === 'timed_id3') {
          configuration.AddOutputSetting(` -map -0:s:${id} `);
        }
      }
      loopOverStreamsOfType(file, "subtitle", mkvconform);
    }
    if (inputs.container === 'mp4') {
      configuration.AddOutputSetting(` -map -0:t `);
      function mp4conform(stream, id) {
        if (stream.codec_name !== undefined) {
          codec = stream.codec_name.toLowerCase();
          if (codec === 'hdmv_pgs_subtitle' || codec === 'eia_608' || codec === 'subrip' || codec === 'timed_id3' || codec === 'ass' || codec === 'ssa') {
            configuration.AddOutputSetting(` -map -0:s:${id} `);
          }
        }
      }
      loopOverStreamsOfType(file, "subtitle", mp4conform);
    }
  }

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
    container: `.${inputs.container}`,
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: "",
    processFile: false,
    preset: "",
    reQueueAfter: true,
  };

  let logger = new Log();

  // Begin Abort Section
  // Verify video
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

  response.processFile =
    videoSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess(`File is already in ${inputs.container} container.`);
  }

  response.infoLog += logger.GetLogData();
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
