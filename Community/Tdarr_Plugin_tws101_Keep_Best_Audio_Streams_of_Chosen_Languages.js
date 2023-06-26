/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_tws101_Keep_Best_Audio_Streams_of_Chosen_Languages',
  Stage: 'Pre-processing',
  Name: 'tws101 Keep Best Audio Stream of Chosen Languages',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: `Prototype, Keep Best Audio Stream of Chosen Languages, one of each language will be chosen based on highest channel count all others will be removed
  The codec and bit rate will be encoded`,
//    Created by tws101 
//    Prototype version
  Version: '0.6',
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [
    {
      name: "language",
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Choose up too 8 lang tags, no more than 8'
        + ' Case-insensitive. seperate additional tags with commas eng,jpn,kor.  If you want to keep an Undefinded tag please use the option below this option',
    },
    {
      name: "keepundefined",
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip:
        `Do you want to keep the best undefined track? `,
    },
    {
      name: "audioCodec",
      type: 'string',
      defaultValue: 'ac3',
      inputUI: {
        type: 'dropdown',
        options: [
          'aac',
          'ac3',
          'eac3',
          'dca',
          'flac',
          'libmp3lame',
          'truehd',
        ],
      },
      tooltip:
        `Enter the desired audio codec
		    If you chose ac3, eac3, dca, libmp3lame, or truehd, make sure you choose a SUPPORTED Channel Count.  Under Channel count Unsupported channel counts are listed by codec.
		    `,
    },
    {
      name: "channels",
      type: 'number',
      defaultValue: 6,
      inputUI: {
        type: 'dropdown',
        options: [
          '1',
          '2',
          '6',
          '8',
        ],
      },
      tooltip:
        `Enter the desired number of channels
    The following configurations are NOT supported by ffmpeg, the plugin will be skipped if these are selected.
    "dca 6 and 8 Channels",
        "libmp3lame 6 and 8 Channels",
        "truehd 1 and 8 Channels",
    "eac3 8 Channels",
    "ac3 8 Channels"
    `,
    },
    {
      name: "bitrate",
      type: 'string',
      defaultValue: '300k',
      inputUI: {
        type: 'text',
      },
      tooltip: `This must be less than the filter bit rate below. Specify the target bit rate:
  The stream will be encoded at this bitrate
      \\n 384k
      \\n 640k
      \\nExample:\\n
      640k

     `,
    },
    {
      name: "filter_bitrate",
      type: 'string',
      defaultValue: '330k',
      inputUI: {
        type: 'text',
      },
      tooltip: `This must be greater than the bitrate above. If you are above this number you will be reduced to the chosen value in the bitrate setting above.
  This filter is ignored on "aac", "flac", and "truehd".
      \\n 384k
      \\n 640k
      \\nExample:\\n
      640k
      `,
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
    this.shouldProcess = true;
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
 * Begin Audio Configuration
 * Variable Setup
 */
function buildAudioConfiguration(inputs, file, logger) {
  var configuration = new Configurator([""]);
  var audioCodec = inputs.audioCodec;
  var audioEncoder = audioCodec;
  var channelCount = inputs.channels;

  if (audioEncoder == "dca") {
    audioCodec = "dts";
  }
  if (audioEncoder == "libmp3lame") {
	  audioCodec = "mp3";
  }

  const language = inputs.language.split(',');
  var numberOfAudioStreams = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type == "audio"
  ).length;
  var numberOfGoodAudioStreams = 0;
  var [lan1, lan2, lan3, lan4, lan5, lan6, lan7, lan8] = inputs.language.split(',');
  var lan1count = 0;
  var lan2count = 0;
  var lan3count = 0;
  var lan4count = 0;
  var lan5count = 0;
  var lan6count = 0;
  var lan7count = 0;
  var lan8count = 0;
  var lanundcount = 0;

  //begin audio loopthrough

  function audioProcess(stream, id) {
    try {
      if (
        stream.tags.language.toLowerCase() == lan1
      ) {
        lan1count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan2
      ) {
        lan2count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan3
      ) {
        lan3count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan4
      ) {
        lan4count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan5
      ) {
        lan5count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan6
      ) {
        lan6count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan7
      ) {
        lan7count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan8
      ) {
        lan8count += 1;
      }
    } catch (err) {
      lanundcount += 1;
    }

    var bitratecheckdisabled = false;
    if (
      (stream.codec_name === 'aac' ||
      stream.codec_name === 'truehd' ||
      stream.codec_name === 'flac') &&
      file.container.toLowerCase() === 'mkv'
    ) {
      var bitratecheckdisabled = true;
    }
    try {
      if (
        bitratecheckdisabled == false
      ) {
        if (stream.bit_rate > (inputs.filter_bitrate)) {
          return;
        }
      }
      try {
        if (
          stream.codec_type == "audio" &&
          (stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh'))
        ) {
          return;
        }
      } catch (err) {}
      if (
        stream.codec_type == "audio" &&
        stream.codec_name === audioCodec &&
        stream.channels <= channelCount &&
        (stream.tags.language.toLowerCase().includes(lan1) ||
        stream.tags.language.toLowerCase().includes(lan2) ||
        stream.tags.language.toLowerCase().includes(lan3) ||
        stream.tags.language.toLowerCase().includes(lan4) ||
        stream.tags.language.toLowerCase().includes(lan5) ||
        stream.tags.language.toLowerCase().includes(lan6) ||
        stream.tags.language.toLowerCase().includes(lan7) ||
        stream.tags.language.toLowerCase().includes(lan8))
      ) {
        logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, ${stream.tags.language}.`);
        numberOfGoodAudioStreams += 1;
        return;
      }
      if (
        stream.codec_type == "audio" &&
        stream.codec_name === audioCodec &&
        stream.channels <= channelCount &&
        numberOfAudioStreams === 1
      ) {
        logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, Other Language, it is the only track.`);
        numberOfGoodAudioStreams += 1;
        return;
      }
      return;
    } catch (err) {
      try {
        if (
          inputs.keepundefined === true &&
          stream.codec_type == "audio" &&
          stream.codec_name === audioCodec &&
          stream.channels <= channelCount
        ) {
          logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, Other Language.`);
          numberOfGoodAudioStreams += 1;
          return;
        }
        if (
          stream.codec_type == "audio" &&
          stream.codec_name === audioCodec &&
          stream.channels <= channelCount &&
          numberOfAudioStreams === 1
        ) {
          logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, Other Language, it is the only track.`);
          numberOfGoodAudioStreams += 1;
          return;
        }
      } catch (err) {
        logger.AddError(`Error reading Stream ${id} Exit Plugin`);
        response.processFile = false;
        response.infoLog += logger.GetLogData();
        return response;
      }
      return;
    }
  }

  //End Loop

  loopOverStreamsOfType(file, "audio", audioProcess);

  //After Loop
  //Check to see if the file is exactly what we want

  if (
    numberOfAudioStreams === numberOfGoodAudioStreams &&
    lan1count <= 1 &&
    lan2count <= 1 &&
    lan3count <= 1 &&
    lan4count <= 1 &&
    lan5count <= 1 &&
    lan6count <= 1 &&
    lan7count <= 1 &&
    lan8count <= 1 &&
    lanundcount <= 1
  ) {
    logger.AddSuccess(`All Stream are what we want`);
    return configuration;
  }

//Setup Additional Variables to prepare to trascode

  var lan1Tagcount = 0;
  var lan2Tagcount = 0;
  var lan3Tagcount = 0;
  var lan4Tagcount = 0;
  var lan5Tagcount = 0;
  var lan6Tagcount = 0;
  var lan7Tagcount = 0;
  var lan8Tagcount = 0;
  var UndTagcount = 0;
  var lan1Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan1)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan1Tagcount += 1;
        return true;
      } catch (err) {
        lan1Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan2Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan2)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan2Tagcount += 1;
        return true;
      } catch (err) {
        lan2Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan3Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan3)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan3Tagcount += 1;
        return true;
      } catch (err) {
        lan3Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan4Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan4)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan4Tagcount += 1;
        return true;
      } catch (err) {
        lan4Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan5Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan5)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan5Tagcount += 1;
        return true;
      } catch (err) {
        lan5Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan6Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan6)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan6Tagcount += 1;
        return true;
      } catch (err) {
        lan6Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan7Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan7)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan7Tagcount += 1;
        return true;
      } catch (err) {
        lan7Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });
  var lan8Tag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(lan8)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        lan8Tagcount += 1;
        return true;
      } catch (err) {
        lan8Tagcount += 1;
        return true;
      }
      return false;
    } catch (err) {}
    return false;
  });

  var UndTag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        (stream.tags.language.toLowerCase().includes(lan1) ||
        stream.tags.language.toLowerCase().includes(lan2) ||
        stream.tags.language.toLowerCase().includes(lan3) ||
        stream.tags.language.toLowerCase().includes(lan4) ||
        stream.tags.language.toLowerCase().includes(lan5) ||
        stream.tags.language.toLowerCase().includes(lan6) ||
        stream.tags.language.toLowerCase().includes(lan7) ||
        stream.tags.language.toLowerCase().includes(lan8))
      ) {
        return false;
      }
    } catch (err) {}
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(und)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        UndTagcount += 1;
        return true;
      } catch (err) {
        UndTagcount += 1;
        return true;
      }
      return false;
    } catch (err) {
      UndTagcount += 1;
      return true;
    }
  });

  var attemptMakeStreamlan1Tagtriggered = false;
  var attemptMakeStreamlan2Tagtriggered = false;
  var attemptMakeStreamlan3Tagtriggered = false;
  var attemptMakeStreamlan4Tagtriggered = false;
  var attemptMakeStreamlan5Tagtriggered = false;
  var attemptMakeStreamlan6Tagtriggered = false;
  var attemptMakeStreamlan7Tagtriggered = false;
  var attemptMakeStreamlan8Tagtriggered = false;
  var attemptMakeStreamundTagtriggered = false;
  var audioIdx = -1;

  //Take Decision to trascode

  if (lan1Tagcount != 0) {
    if (lan1Tagcount >= 1) {
      var highestChannelCount = lan1Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan1Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan1} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan1Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan1} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan2Tagcount != 0) {
    if (lan2Tagcount >= 1) {
      var highestChannelCount = lan2Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan2Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan2} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan2Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan2} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan3Tagcount != 0) {
    if (lan3Tagcount >= 1) {
      var highestChannelCount = lan3Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan3Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan3} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan3Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan3} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan4Tagcount != 0) {
    if (lan4Tagcount >= 1) {
      var highestChannelCount = lan4Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan4Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan4} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan4Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan4} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan5Tagcount != 0) {
    if (lan5Tagcount >= 1) {
      var highestChannelCount = lan5Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan5Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan5} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan5Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan5} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan6Tagcount != 0) {
    if (lan6Tagcount >= 1) {
      var highestChannelCount = lan6Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan6Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan6} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan6Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan6} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan7Tagcount != 0) {
    if (lan7Tagcount >= 1) {
      var highestChannelCount = lan7Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan7Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan7} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan7Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan7} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan8Tagcount != 0) {
    if (lan8Tagcount >= 1) {
      var highestChannelCount = lan8Tag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamlan8Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan8} stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamlan8Tagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating ${lan8} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (inputs.keepundefined === true) {
    if (UndTagcount >= 1) {
      var highestChannelCount = UndTag.reduce(getHighest);
      function getHighest(first, second) {
        if (first.channels > second.channels && first) {
          return first;
        } else {
          return second;
        }
      }
      if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
        attemptMakeStreamundTagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating Undefined stream in ${audioEncoder}, ${channelCount} channels`);
      } else {
        attemptMakeStreamundTagtriggered = true;
        audioIdx += 1;
        configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
        configuration.AddOutputSetting(
          ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
        );
        logger.AddError(`Creating Undefined stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
      }
    }
  }

  if (lan1Tagcount + lan2Tagcount + lan3Tagcount + lan4Tagcount + lan5Tagcount + lan6Tagcount + lan7Tagcount + lan8Tagcount === 0) {
    if (inputs.keepundefined === false) {
      if (UndTagcount >= 1) {
        var highestChannelCount = UndTag.reduce(getHighest);
        function getHighest(first, second) {
          if (first.channels > second.channels && first) {
            return first;
          } else {
            return second;
          }
        }
        if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
          attemptMakeStreamundTagtriggered = true;
          audioIdx += 1;
          configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
          configuration.AddOutputSetting(
            ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
          );
          logger.AddError(`Creating Undefined stream in ${audioEncoder}, ${channelCount} channels`);
        } else {
          attemptMakeStreamundTagtriggered = true;
          audioIdx += 1;
          configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
          configuration.AddOutputSetting(
            ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
          );
          logger.AddError(`Creating Undefined stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
        }
      }
    }
  }

  //Check to see if we are trascoding

  if (
    (attemptMakeStreamlan1Tagtriggered ||
    attemptMakeStreamlan2Tagtriggered ||
    attemptMakeStreamlan3Tagtriggered ||
    attemptMakeStreamlan4Tagtriggered ||
    attemptMakeStreamlan5Tagtriggered ||
    attemptMakeStreamlan6Tagtriggered ||
    attemptMakeStreamlan7Tagtriggered ||
    attemptMakeStreamlan8Tagtriggered ||
    attemptMakeStreamundTagtriggered) === true) {
      logger.AddError(`We are Trascoding the above streams`);
      return configuration;
    }

  // Code should not hit this next message

  logger.AddError(`YOU SHOULD NOT SEE THIS NO TRASCODE AND NO ALL GOOD MESSAGE SHOWED UP`);
  return configuration;
}


/**
 * Keep all subtitles and data streams
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0:s? -map 0:d? -c copy"]);
  return configuration;
}

/**
 * Keep all Video
 */
function buildVideoConfiguration(inputs, file, logger) {
  var configuration = new Configurator(["-map 0:v"]);
  return configuration;
}


// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
  const lib = require('../methods/lib')();
// eslint-disable-next-line no-unused-vars,no-param-reassign
inputs = lib.loadDefaultValues(inputs, details);
var response = {
  container: `.${file.container}`,
  FFmpegMode: true,
  handBrakeMode: false,
  infoLog: "",
  processFile: false,
  preset: "",
  reQueueAfter: true,
};

var logger = new Log();

//Abort Section not supported

var audioCodec = inputs.audioCodec;
var audioEncoder = audioCodec;
var channelCount = inputs.channels;
var numberOfLagTags = inputs.language.split(',').length;

//Too Many Language Choices

if (
  numberOfLagTags >= 9
) {
  logger.AddError("More than 8 language tags are present. Reconfigure the Plugin");
  response.processFile = false;
  response.infoLog += logger.GetLogData();
  return response;
}

//Bitrate settings not supported

if (
  (inputs.filter_bitrate) < (inputs.bitrate) ||
  (inputs.filter_bitrate) === 0 ||
  (inputs.bitrate) == 0
) {
  logger.AddError("Bitrate setting are invalid. Reconfigure the Plugin");
  response.processFile = false;
  response.infoLog += logger.GetLogData();
  return response;
}

//channel count 1 not supported
if (
  (['truehd'].includes(audioCodec)) &&
  channelCount === 1
) {
  logger.AddError(`Selected ${audioEncoder} does not support the channel count of ${channelCount}. Reconfigure the Plugin`);
  response.processFile = false;
  response.infoLog += logger.GetLogData();
  return response;
}
  
//channel count 6 not supported
if (
  (['dca', 'libmp3lame'].includes(audioCodec)) &&
  channelCount === 6
) {
  logger.AddError(`Selected ${audioEncoder} does not support the channel count of ${channelCount}. Reconfigure the Plugin`);
  response.processFile = false;
  response.infoLog += logger.GetLogData();
  return response;
}
  
//channel count 8 not supported
if (
  (['dca', 'libmp3lame', 'truehd', 'ac3', 'eac3'].includes(audioCodec)) &&
  channelCount === 8
) {
  logger.AddError(`Selected ${audioEncoder} does not support the channel count of ${channelCount}. Reconfigure the Plugin`);
  response.processFile = false;
  response.infoLog += logger.GetLogData();
  return response;
}


// End Abort Section not supported

var audioSettings = buildAudioConfiguration(inputs, file, logger);
var videoSettings = buildVideoConfiguration(inputs, file, logger);
var subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);


response.preset = `,${videoSettings.GetOutputSettings()}`
response.preset += ` ${audioSettings.GetInputSettings()}`
response.preset += ` ${subtitleSettings.GetOutputSettings()}`
response.preset += ` ${audioSettings.GetOutputSettings()}`

if (['dca', 'truehd', 'flac'].includes(audioCodec)) {
  response.preset += ` -strict -2`;
}


response.processFile =
  audioSettings.shouldProcess;

if (!response.processFile) {
  logger.AddSuccess("No need to process file");
}

response.infoLog += logger.GetLogData();
return response;
}

module.exports.details = details;
module.exports.plugin = plugin;