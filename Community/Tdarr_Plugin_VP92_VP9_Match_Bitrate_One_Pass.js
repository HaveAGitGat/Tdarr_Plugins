/* eslint max-classes-per-file: ["error", 2] */
const details = () => ({
  id: 'Tdarr_Plugin_VP92_VP9_Match_Bitrate_One_Pass',
  Stage: 'Pre-processing',
  Name: 'VP9 Encoding Match Bitrate 1 Pass System',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `Will run through linvpx-vp9 and follow the contrained quality contraints. Will also encode audio to
      opus using libopus. Allows user-input on the desired constrained quality amount for each video resolution with
      defaults if none are given.`,
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,vp9',
  Inputs: [
    {
      name: 'CQ_240p',
      type: 'string',
      defaultValue: '32',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 32',
    },
    {
      name: 'CQ_360p',
      type: 'string',
      defaultValue: '31',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 31',
    },
    {
      name: 'CQ_480p',
      type: 'string',
      defaultValue: '28',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 28',
    },
    {
      name: 'CQ_720p',
      type: 'string',
      defaultValue: '27',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 27',
    },
    {
      name: 'CQ_1080p',
      type: 'string',
      defaultValue: '26',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 26',
    },
    {
      name: 'CQ_4KUHD',
      type: 'string',
      defaultValue: '15',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 15',
    },
    {
      name: 'CQ_8KUHD',
      type: 'string',
      defaultValue: '15',
      inputUI: {
        type: 'text',
      },
      tooltip:
          'The CQ number (recommended 15-35) for this resolution, default 15',
    },
    {
      name: 'audio_language',
      type: 'string',
      defaultValue: 'eng,und',
      inputUI: {
        type: 'text',
      },
      tooltip: `
            Specify language tag/s here for the audio tracks you'd like to keep, recommended to keep "und" as this\\n
           stands for undertermined, some files may not have the language specified. Must follow ISO-639-2 3 letter\\n
            format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng
                \\nExample:\\n
                eng,und
                \\nExample:\\n
                eng,und,jap`,
    },
    {
      name: 'audio_commentary',
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
      name: 'subtitle_language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 \\n
        letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                \\nExample:\\n
                eng
                \\nExample:\\n
                eng,jap`,
    },
    {
      name: 'subtitle_commentary',
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
    {
      name: 'remove_mjpeg',
      type: 'string',
      defaultValue: 'false',
      inputUI: {
        type: 'text',
      },
      tooltip: `Specify if mjpeg codecs should be removed.
                \\nExample:\\n
                true
                \\nExample:\\n
                false`,
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

  RemoveAllConfigurationsBySearchString(search_string) {
    for (let i = this.outputSettings.length - 1; i >= 0; i -= 1) {
      if (this.outputSettings[i].includes(search_string)) {
        this.outputSettings.splice(i, 1);
      }
    }
  }

  GetOutputSettings() {
    return this.outputSettings.join(' ');
  }

  GetInputSettings() {
    return this.inputSettings.join(' ');
  }
}

/**
 * Loops over the file streams and executes the given method on
 * each stream when the matching codec_type is found.
 * @param {Object} file the file.
 * @param {string} type the typeo of stream.
 * @param {function} method the method to call.
 */
const loopOverStreamsOfType = (file, type, method) => {
  let id = 0;
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id += 1;
    }
  }
};

const buildAudioConfiguration = (inputs, file, logger) => {
  const configuration = new Configurator(['-c:a copy']);
  let stream_count = 0;
  let streams_removing = 0;
  const languages = inputs.audio_language.split(',');
  let opusFormat = false;
  let mappingFamily = false;

  loopOverStreamsOfType(file, 'audio', (stream, id) => {
    stream_count += 1;

    if (stream.codec_name !== 'opus' && !opusFormat) {
      logger.AddError('Audio is not in proper codec, will format');
      configuration.RemoveOutputSetting('-c:a copy');
      configuration.AddOutputSetting('-c:a libopus');
      opusFormat = true;
    }

    if (
      (stream.channel_layout === '5.1(side)' || (stream.codec_name === 'eac3' && stream.channels === 6)) && opusFormat
    ) {
      logger.AddSuccess(
        `Determined audio to be ${stream.channel_layout}, adding mapping configuration for proper conversion`,
      );
      configuration.AddOutputSetting(
        `-filter_complex "[0:a:${id}]channelmap=channel_layout=5.1"`,
      );
      if (!mappingFamily) {
        configuration.AddOutputSetting('-mapping_family 1');
        mappingFamily = true;
      }
    }

    if (stream.channel_layout === '6.1(back)' && opusFormat) {
      logger.AddSuccess(
        `Determined audio to be ${stream.channel_layout}, adding mapping configuration for proper conversion`,
      );
      configuration.AddOutputSetting(
        `-filter_complex "[0:a:${id}]channelmap=channel_layout=6.1"`,
      );
      if (!mappingFamily) {
        configuration.AddOutputSetting('-mapping_family 1');
        mappingFamily = true;
      }
    }

    if (
      'tags' in stream && 'title' in stream.tags && inputs.audio_commentary.toLowerCase() === 'true'
    ) {
      if (
        stream.tags.title.toLowerCase().includes('commentary')
        || stream.tags.title.toLowerCase().includes('description')
        || stream.tags.title.toLowerCase().includes('sdh')
      ) {
        streams_removing += 1;
        configuration.AddOutputSetting(`-map -0:a:${id}`);
        logger.AddError(
          `Removing Commentary or Description audio track: ${stream.tags.title}`,
        );
        return;
      }
    }

    if ('tags' in stream) {
      // Remove unwanted languages
      if ('language' in stream.tags) {
        if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
          configuration.AddOutputSetting(`-map -0:a:${id}`);
          streams_removing += 1;
          logger.AddError(
            `Removing audio track in language ${stream.tags.language}`,
          );
        }
      }
    }
  });

  if (stream_count === streams_removing) {
    logger.AddError(
      '*** All audio tracks would have been removed, removing all delete entries',
    );
    configuration.RemoveAllConfigurationsBySearchString('-map -0');
  }

  if (!configuration.shouldProcess) {
    logger.AddSuccess('No audio processing necessary');
  }

  return configuration;
};

const buildVideoConfiguration = (inputs, file, logger) => {
  const configuration = new Configurator(['-map 0', '-map -0:d', '-c:v copy']);

  loopOverStreamsOfType(file, 'video', (stream, id) => {
    if (stream.codec_name === 'mjpeg') {
      if (inputs.remove_mjpeg.toLowerCase() === 'true') {
        logger.AddError('Removing mjpeg');
        configuration.AddOutputSetting(`-map -0:v:${id}`);
      } else {
        configuration.AddOutputSetting(`-map -v:${id}`);
      }
      return;
    }

    if (stream.codec_name === 'vp9' && file.container === 'webm') {
      logger.AddSuccess('File is in proper video format');
      return;
    }

    if (stream.codec_name === 'vp9' && file.container !== 'webm') {
      configuration.AddOutputSetting('-c:v copy');
      logger.AddError(
        'File is in proper codec but not write container. Will remux',
      );
    }

    let speed = 1;
    let targetQuality = 32;
    let tileColumns = 0;
    const threadCount = 64;
    if (file.video_resolution === '240p') {
      targetQuality = inputs.CQ_240p || 32;
      tileColumns = 0;
      speed = 1;
    } else if (file.video_resolution === '360p' || file.video_resolution === '576p') {
      targetQuality = inputs.CQ_360p || 31;
      tileColumns = 1;
      speed = 1;
    } else if (file.video_resolution === '480p') {
      targetQuality = inputs.CQ_480p || 28;
      tileColumns = 1;
      speed = 1;
    } else if (file.video_resolution === '720p') {
      targetQuality = inputs.CQ_720p || 27;
      tileColumns = 2;
      speed = 2;
    } else if (file.video_resolution === '1080p') {
      targetQuality = inputs.CQ_1080p || 26;
      tileColumns = 2;
      speed = 2;
    } else if (
      file.video_resolution === '1440p' || file.video_resolution === '2560p' || file.video_resolution === '4KUHD'
    ) {
      targetQuality = inputs.CQ_4KUHD || 15;
      tileColumns = 3;
      speed = 2;
    } else if (file.video_resolution === '8KUHD') {
      targetQuality = inputs.CQ_8KUHD || 15;
      tileColumns = 3;
      speed = 2;
    }

    configuration.RemoveOutputSetting('-c:v copy');
    configuration.AddOutputSetting(
      `-pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf ${targetQuality} -threads ${threadCount} -speed ${speed} 
      -quality good -static-thresh 0 -tile-columns ${tileColumns} -tile-rows 0 -frame-parallel 0 -row-mt 1 
      -aq-mode 0 -g 240`,
    );

    logger.AddError('Transcoding file to VP9');
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess('No video processing necessary');
  }

  return configuration;
};

const buildSubtitleConfiguration = (inputs, file, logger) => {
  const configuration = new Configurator(['-c:s copy']);
  // webvtt

  const languages = inputs.subtitle_language.split(',');
  let webvttFormat = false;
  // if (languages.length === 0) return configuration;

  loopOverStreamsOfType(file, 'subtitle', (stream, id) => {
    if (
      stream.codec_name === 'hdmv_pgs_subtitle'
      || stream.codec_name === 'eia_608'
      || stream.codec_name === 'dvd_subtitle'
    ) {
      logger.AddError(
        `Removing subtitle in invalid codec ${stream.codec_name}`,
      );
      configuration.AddOutputSetting(`-map -0:s:${id}`);
      return;
    }

    if ('tags' in stream) {
      // Remove unwated languages
      if ('language' in stream.tags) {
        if (languages.indexOf(stream.tags.language.toLowerCase()) === -1) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing subtitle in language ${stream.tags.language}`,
          );
          return;
        }
      }

      // Remove commentary subtitles
      if (
        'title' in stream.tags
        && inputs.subtitle_commentary.toLowerCase() === 'true'
      ) {
        if (
          stream.tags.title.toLowerCase().includes('commentary')
          || stream.tags.title.toLowerCase().includes('description')
          || stream.tags.title.toLowerCase().includes('sdh')
        ) {
          configuration.AddOutputSetting(`-map -0:s:${id}`);
          logger.AddError(
            `Removing Commentary or Description subtitle: ${stream.tags.title}`,
          );
          return;
        }
      }
    }

    if (stream.codec_name !== 'webvtt' && !webvttFormat) {
      logger.AddError('Formatting subtitles to webvtt format');
      configuration.RemoveOutputSetting('-c:s copy');
      configuration.AddOutputSetting('-c:s webvtt');
      webvttFormat = true;
    }
  });

  if (!configuration.shouldProcess) {
    logger.AddSuccess('No subtitle processing necessary');
  }

  return configuration;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // Must return this object
  const response = {
    container: '.webm',
    FFmpegMode: true,
    handBrakeMode: false,
    infoLog: '',
    processFile: false,
    preset: '',
    reQueueAfter: true,
  };

  const logger = new Log();

  const audioSettings = buildAudioConfiguration(inputs, file, logger);
  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

  response.processFile = audioSettings.shouldProcess
    || videoSettings.shouldProcess
    || subtitleSettings.shouldProcess;

  if (!response.processFile) {
    logger.AddSuccess('No need to process file');
  }

  response.preset = `${videoSettings.GetInputSettings()},${videoSettings.GetOutputSettings()} 
  ${audioSettings.GetOutputSettings()} ${subtitleSettings.GetOutputSettings()}`;
  response.infoLog += logger.GetLogData();
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
