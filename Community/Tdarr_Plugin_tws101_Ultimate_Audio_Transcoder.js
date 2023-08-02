/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
module.exports.dependencies = ['axios@0.27.2', '@cospired/i18n-iso-languages'];
const details = () => ({
  id: 'Tdarr_Plugin_tws101_Ultimate_Audio_Transcoder',
  Stage: 'Pre-processing',
  Name: 'tws101 - Ultimate Audio Transcoder',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: `Choose the languages you want to keep, 8 tags, one of each will be kept.  Select codec, channel count, and bit rate. Choose to keep undefined and/or native language.
   Max lang tags would be 10 if both undefined and native are true.  If native language is set true, you will need a TVDB api key and a radarr or sonarr instance. `,
//    Created by tws101 
//    Release Version 1.60
  Version: '1.60',
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
        `If you leave this false it will still be kept if it is the only track.  This will keep the best track with NO TAG, und tag, or unspecified language. 
          It will only keep ONE of these with the best channel count`,
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
  This filter is ignored on "aac", "flac", and "truehd" if the file is mkv.
      \\n 384k
      \\n 640k
      \\nExample:\\n
      640k
      `,
    },
    {
      name: "keep_native_language",
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `If false the options below may be left blank.  If true fill out the bellow options and the native language will also be kept.`,
    },
    {
      name: 'priority',
      type: 'string',
      defaultValue: 'Radarr',
      inputUI: {
        type: 'dropdown',
        options: [
          'Radarr',
          'Sonarr',
        ],
      },
      tooltip:
        'Required if keep_native_language is true.  Priority for either Radarr or Sonarr. Leaving it empty defaults to Radarr first.'
        + '\\nExample:\\n'
        + 'sonarr',
    },
    {
      name: 'api_key',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Required if keep_native_language is true.  Input your TMDB api (v3) key here. (https://www.themoviedb.org/)',
    },
    {
      name: 'radarr_api_key',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Required if keep_native_language is true.  Input your Radarr api key here.',
    },
    {
      name: 'radarr_url',
      type: 'string',
      defaultValue: '192.168.1.2:7878',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Required if keep_native_language is true.  Input your Radarr url here. (Without http://). Do include the port.'
        + '\\nExample:\\n'
        + '192.168.1.2:7878',
    },
    {
      name: 'sonarr_api_key',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Required if keep_native_language is true.  Input your Sonarr api key here.',
    },
    {
      name: 'sonarr_url',
      type: 'string',
      defaultValue: '192.168.1.2:8989',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Required if keep_native_language is true. Input your Sonarr url here. (Without http://). Do include the port.'
        + '\\nExample:\\n'
        + '192.168.1.2:8989',
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
    const index = this.outputSettings.indexOf(configuration);

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
  let id = 0;
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
      method(file.ffProbeData.streams[i], id);
      id++;
    }
  }
}

const tmdbApi = async (filename, api_key, axios) => {
  let fileName;
  // If filename begins with tt, it's already an imdb id
  if (filename) {
    if (filename.slice(0, 2) === 'tt') {
      fileName = filename;
    } else {
      const idRegex = /(tt\d{7,8})/;
      const fileMatch = filename.match(idRegex);
      // eslint-disable-next-line prefer-destructuring
      if (fileMatch) fileName = fileMatch[1];
    }
  }

  if (fileName) {
    const result = await axios
      .get(
        `https://api.themoviedb.org/3/find/${fileName}?api_key=`
        + `${api_key}&language=en-US&external_source=imdb_id`,
      )
      .then((resp) => (resp.data.movie_results.length > 0
        ? resp.data.movie_results[0]
        : resp.data.tv_results[0]));

    if (!result) {
      logger.AddError(`No IMDB result was found.`);
    }
    return result;
  }
  return null;
};

// eslint-disable-next-line consistent-return
const parseArrResponse = async (body, filePath, arr) => {
  // eslint-disable-next-line default-case
  switch (arr) {
    case 'radarr':
      return body.movie;
    case 'sonarr':
      return body.series;
  }
};

function getHighest(first, second) {
  if (first.channels > second.channels && first) {
    return first;
  } else {
    return second;
  }
}

/**
 * Video, Map all Video
 */
function buildVideoConfiguration(inputs, file, logger) {
  const configuration = new Configurator(["-map 0:v"]);
  return configuration;
}

/**
 * Audio, Map and trascode what we want
 */
function buildAudioConfiguration(inputs, file, logger, flagTmdbResult, result) {
  const configuration = new Configurator([""]);
  let audioCodec = inputs.audioCodec;
  const audioEncoder = audioCodec;
  const channelCount = inputs.channels;

  if (audioEncoder == "dca") {
    audioCodec = "dts";
  }
  if (audioEncoder == "libmp3lame") {
	  audioCodec = "mp3";
  }

  const numberOfAudioStreams = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type == "audio"
  ).length;
  let numberOfGoodAudioStreams = 0;
  const [lan1, lan2, lan3, lan4, lan5, lan6, lan7, lan8] = inputs.language.split(',');
  let lan1Count = 0;
  let lan2Count = 0;
  let lan3Count = 0;
  let lan4Count = 0;
  let lan5Count = 0;
  let lan6Count = 0;
  let lan7Count = 0;
  let lan8Count = 0;
  let lan101Count = 0;
  let lanUndefinedCount = 0;

  if (flagTmdbResult === true) {
    const languages = require('@cospired/i18n-iso-languages');
    const langsTemp = result.original_language === 'cn' ? 'zh' : result.original_language;
    logger.AddSuccess(`Original language: ${langsTemp}, Using code: ${languages.alpha2ToAlpha3B(
      langsTemp,
    )}.`);
    const originalLang = (languages.alpha2ToAlpha3B(langsTemp))

    if (originalLang !== (lan1 || lan2 || lan3 || lan4 || lan5 || lan6 || lan7 || lan8)) {
      var lan101 = originalLang
    }
  }

  //Start loop to check the audio streams

  function audioProcess(stream, id) {
    try {
      if (
        stream.tags.language.toLowerCase() == lan1
      ) {
        lan1Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan2
      ) {
        lan2Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan3
      ) {
        lan3Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan4
      ) {
        lan4Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan5
      ) {
        lan5Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan6
      ) {
        lan6Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan7
      ) {
        lan7Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan8
      ) {
        lan8Count += 1;
      }
      if (
        stream.tags.language.toLowerCase() == lan101
      ) {
        lan101Count += 1;
      }
    } catch (err) {
      lanUndefinedCount += 1;
    }

    let boolBitrateCheckDisabled = false;
    if (
      (stream.codec_name === 'aac' ||
      stream.codec_name === 'truehd' ||
      stream.codec_name === 'flac') &&
      file.container.toLowerCase() === 'mkv'
    ) {
      boolBitrateCheckDisabled = true;
    }
    try {
      if (
        boolBitrateCheckDisabled == false
      ) {
        if (stream.bit_rate > (inputs.filter_bitrate)) {
          return;
        }
      }
      try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return;
        }
      } catch (err) {}
      if (
        stream.codec_name === audioCodec &&
        stream.channels <= channelCount &&
        (stream.tags.language.toLowerCase().includes(lan1) ||
        stream.tags.language.toLowerCase().includes(lan2) ||
        stream.tags.language.toLowerCase().includes(lan3) ||
        stream.tags.language.toLowerCase().includes(lan4) ||
        stream.tags.language.toLowerCase().includes(lan5) ||
        stream.tags.language.toLowerCase().includes(lan6) ||
        stream.tags.language.toLowerCase().includes(lan7) ||
        stream.tags.language.toLowerCase().includes(lan8) ||
        stream.tags.language.toLowerCase().includes(lan101))
      ) {
        logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, ${stream.tags.language}.`);
        numberOfGoodAudioStreams += 1;
        return;
      }
      if (
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
          stream.codec_name === audioCodec &&
          stream.channels <= channelCount
        ) {
          logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, Other Language.`);
          numberOfGoodAudioStreams += 1;
          return;
        }
        if (
          stream.codec_name === audioCodec &&
          stream.channels <= channelCount &&
          numberOfAudioStreams === 1
        ) {
          logger.AddSuccess(`Good, Stream ${id} is ${stream.codec_name}, ${stream.channels} channels, Other Language, it is the only track.`);
          numberOfGoodAudioStreams += 1;
          return;
        }
      } catch (err) {
        logger.AddError(`Error reading Stream ${id} `);
        return;
      }
      return;
    }
  }

  loopOverStreamsOfType(file, "audio", audioProcess);

  //End Loop
  //Check to see if the file is exactly what we want

  if (
    numberOfAudioStreams === numberOfGoodAudioStreams &&
    lan1Count <= 1 &&
    lan2Count <= 1 &&
    lan3Count <= 1 &&
    lan4Count <= 1 &&
    lan5Count <= 1 &&
    lan6Count <= 1 &&
    lan7Count <= 1 &&
    lan8Count <= 1 &&
    lan101Count <= 1 &&
    lanUndefinedCount <= 1
  ) {
    logger.AddSuccess(`All Stream are what we want`);
    return configuration;
  }

//Setup Additional Variables to prepare to trascode, streams will be sorted into good streams and possible streams. 

  function goodStreams(lang) {
    const goodStreams = file.ffProbeData.streams.filter((stream) => {
      try {
        if (
          stream.codec_type == "audio" &&
          stream.tags.language.toLowerCase().includes(lang) &&
          stream.codec_name === audioCodec &&
          stream.channels <= channelCount &&
          stream.bit_rate < (inputs.filter_bitrate)
        ) try {
          if (
            stream.tags.title.toLowerCase().includes('commentary') ||
            stream.tags.title.toLowerCase().includes('description') ||
            stream.tags.title.toLowerCase().includes('sdh')
          ) {
            return false;
          }
          return true;
        } catch (err) {
          return true;
        }
        return false;
      } catch (err) {}
      return false;
    });
    return goodStreams;
  }

  function possibleStreams(lang) {
    const possibleStreams = file.ffProbeData.streams.filter((stream) => {
      try {
        if (
          stream.codec_type == "audio" &&
          stream.tags.language.toLowerCase().includes(lang)
        ) try {
          if (
            stream.tags.title.toLowerCase().includes('commentary') ||
            stream.tags.title.toLowerCase().includes('description') ||
            stream.tags.title.toLowerCase().includes('sdh')
          ) {
            return false;
          }
          return true;
        } catch (err) {
          return true;
        }
        return false;
      } catch (err) {}
      return false;
    });
    return possibleStreams;
  }
  
  if (lan1) {
    var lan1GoodStreams = goodStreams(lan1);
    var lan1PossibleStreams = possibleStreams(lan1);
  }

  if (lan2) {
    var lan2GoodStreams = goodStreams(lan2);
    var lan2PossibleStreams = possibleStreams(lan2);
  }

  if (lan3) {
    var lan3GoodStreams = goodStreams(lan3);
    var lan3PossibleStreams = possibleStreams(lan3);
  }

  if (lan4) {
    var lan4GoodStreams = goodStreams(lan4);
    var lan4PossibleStreams = possibleStreams(lan4);
  }

  if (lan5) {
    var lan5GoodStreams = goodStreams(lan5);
    var lan5PossibleStreams = possibleStreams(lan5);
  }

  if (lan6) {
    var lan6GoodStreams = goodStreams(lan6);
    var lan6PossibleStreams = possibleStreams(lan6);
  }

  if (lan7) {
    var lan7GoodStreams = goodStreams(lan7);
    var lan7PossibleStreams = possibleStreams(lan7);
  }

  if (lan8) {
    var lan8GoodStreams = goodStreams(lan8);
    var lan8PossibleStreams = possibleStreams(lan8);
  }

  if (lan101) {
    var lan101GoodStreams = goodStreams(lan101);
    var lan101PossibleStreams = possibleStreams(lan101);
  }

  const undefinedGoodStreams = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.codec_name === audioCodec &&
        stream.channels <= channelCount &&
        stream.bit_rate < (inputs.filter_bitrate) &&
        (!stream.tags.language ||
        stream.tags.language.toLowerCase().includes('und'))
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        return true;
      } catch (err) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  });

  const undefinedPossibleStreams = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        (!stream.tags.language ||
        stream.tags.language.toLowerCase().includes('und'))
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        return true;
      } catch (err) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  });

  const foreignGoodStreams = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        (!stream.tags.language ||
        stream.tags.language.toLowerCase().includes('und') ||
        stream.tags.language.toLowerCase().includes(lan1) ||
        stream.tags.language.toLowerCase().includes(lan2) ||
        stream.tags.language.toLowerCase().includes(lan3) ||
        stream.tags.language.toLowerCase().includes(lan4) ||
        stream.tags.language.toLowerCase().includes(lan5) ||
        stream.tags.language.toLowerCase().includes(lan6) ||
        stream.tags.language.toLowerCase().includes(lan7) ||
        stream.tags.language.toLowerCase().includes(lan8) ||
        stream.tags.language.toLowerCase().includes(lan101))
      ) {
        return false;
      }
    } catch (err) {}
    try {
      if (
        stream.codec_type == "audio" &&
        stream.codec_name === audioCodec &&
        stream.channels <= channelCount &&
        stream.bit_rate < (inputs.filter_bitrate)
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        return true;
      } catch (err) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  });

  const foreignPossibleStreams = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        (!stream.tags.language ||
        stream.tags.language.toLowerCase().includes('und') ||
        stream.tags.language.toLowerCase().includes(lan1) ||
        stream.tags.language.toLowerCase().includes(lan2) ||
        stream.tags.language.toLowerCase().includes(lan3) ||
        stream.tags.language.toLowerCase().includes(lan4) ||
        stream.tags.language.toLowerCase().includes(lan5) ||
        stream.tags.language.toLowerCase().includes(lan6) ||
        stream.tags.language.toLowerCase().includes(lan7) ||
        stream.tags.language.toLowerCase().includes(lan8) ||
        stream.tags.language.toLowerCase().includes(lan101))
      ) {
        return false;
      }
    } catch (err) {}
    try {
      if (
        stream.codec_type == "audio"
      ) try {
        if (
          stream.tags.title.toLowerCase().includes('commentary') ||
          stream.tags.title.toLowerCase().includes('description') ||
          stream.tags.title.toLowerCase().includes('sdh')
        ) {
          return false;
        }
        return true;
      } catch (err) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  });

  //Prepare trascode arguments, good streams will be copied, possible streams will be transcoded

  let audioIdx = -1;

  function copyStream(highestChannelCount, lang) {
    audioIdx += 1;
    configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
    logger.AddError(`Copying ${lang} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
  }

  function createStream(highestChannelCount, lang) {
    audioIdx += 1;
    if (parseInt(highestChannelCount.channels) >= parseInt(channelCount)) {
      configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
      configuration.AddOutputSetting(
        ` -c:a:${audioIdx} ${audioEncoder} -ac ${channelCount} -b:a ${inputs.bitrate} `
      );
      logger.AddError(`Creating ${lang} stream in ${audioEncoder}, ${channelCount} channels`);
    } else {
      configuration.AddInputSetting(`-map 0:${highestChannelCount.index}`);
      configuration.AddOutputSetting(
        ` -c:a:${audioIdx} ${audioEncoder} -ac ${highestChannelCount.channels} -b:a ${inputs.bitrate} `
      );
      logger.AddError(`Creating ${lang} stream in ${audioEncoder}, ${highestChannelCount.channels} channels`);
    }
  }

  function runCopyCreate(goodstream, possiblestream, lang) {
    let output = false;
    if (goodstream != '') {
      const highestChannelCount = goodstream.reduce(getHighest);
      copyStream(highestChannelCount, lang)
      output = true;
    } else if (possiblestream != '') {
      const highestChannelCount = possiblestream.reduce(getHighest);
      createStream(highestChannelCount, lang);
      output = true;
    }
    return output;
  }

  const boolAttemptMakeStreamlan1Triggered = runCopyCreate(lan1GoodStreams, lan1PossibleStreams, lan1);
  const boolAttemptMakeStreamlan2Triggered = runCopyCreate(lan2GoodStreams, lan2PossibleStreams, lan2);
  const boolAttemptMakeStreamlan3Triggered = runCopyCreate(lan3GoodStreams, lan3PossibleStreams, lan3);
  const boolAttemptMakeStreamlan4Triggered = runCopyCreate(lan4GoodStreams, lan4PossibleStreams, lan4);
  const boolAttemptMakeStreamlan5Triggered = runCopyCreate(lan5GoodStreams, lan5PossibleStreams, lan5);
  const boolAttemptMakeStreamlan6Triggered = runCopyCreate(lan6GoodStreams, lan6PossibleStreams, lan6);
  const boolAttemptMakeStreamlan7Triggered = runCopyCreate(lan7GoodStreams, lan7PossibleStreams, lan7);
  const boolAttemptMakeStreamlan8Triggered = runCopyCreate(lan8GoodStreams, lan8PossibleStreams, lan8);
  const boolAttemptMakeStreamlan101Triggered = runCopyCreate(lan101GoodStreams, lan101PossibleStreams, lan101);
  let boolAttemptMakeStreamUndefinedTriggered = false;
  if (inputs.keepundefined === true) {
    boolAttemptMakeStreamUndefinedTriggered = runCopyCreate(undefinedGoodStreams, undefinedPossibleStreams, "Undefined");
  }
  let boolAttemptMakeStreamForeignTriggered = false;

  if (
    boolAttemptMakeStreamlan1Triggered === false &&
    boolAttemptMakeStreamlan2Triggered === false &&
    boolAttemptMakeStreamlan3Triggered === false &&
    boolAttemptMakeStreamlan4Triggered === false &&
    boolAttemptMakeStreamlan5Triggered === false &&
    boolAttemptMakeStreamlan6Triggered === false &&
    boolAttemptMakeStreamlan7Triggered === false &&
    boolAttemptMakeStreamlan8Triggered === false &&
    boolAttemptMakeStreamlan101Triggered === false &&
    boolAttemptMakeStreamUndefinedTriggered === false
  ) {
    if (undefinedGoodStreams != '') {
      copyStream(undefinedGoodStreams, "Undefined")
      boolAttemptMakeStreamUndefinedTriggered = true;
    } else if (undefinedPossibleStreams != '') {
      const highestChannelCount = undefinedPossibleStreams.reduce(getHighest);
      boolAttemptMakeStreamUndefinedTriggered = true;
      createStream(highestChannelCount, "Undefined");
    } else if (foreignGoodStreams != '') {
      copyStream(foreignGoodStreams, "Foreign")
      boolAttemptMakeStreamForeignTriggered = true;
    } else if (foreignPossibleStreams != '') {
      const highestChannelCount = foreignPossibleStreams.reduce(getHighest);
      boolAttemptMakeStreamForeignTriggered = true;
      createStream(highestChannelCount, "Foreign");
    }
  }

  //Check configuration and return

  if (
    (boolAttemptMakeStreamlan1Triggered ||
    boolAttemptMakeStreamlan2Triggered ||
    boolAttemptMakeStreamlan3Triggered ||
    boolAttemptMakeStreamlan4Triggered ||
    boolAttemptMakeStreamlan5Triggered ||
    boolAttemptMakeStreamlan6Triggered ||
    boolAttemptMakeStreamlan7Triggered ||
    boolAttemptMakeStreamlan8Triggered ||
    boolAttemptMakeStreamlan101Triggered ||
    boolAttemptMakeStreamUndefinedTriggered ||
    boolAttemptMakeStreamForeignTriggered) === true) {
      logger.AddError(`We are Processing the above streams`);
      return configuration;
    }

  //Code should not hit this next message, this has been left behind intentionally

  logger.AddError(`YOU SHOULD NOT SEE THIS NO TRASCODE AND NO ALL GOOD MESSAGE SHOWED UP`);
  return configuration;
}

/**
 * Subtitles, Map all subtitles data and attachments, enable copy all.
 */
function buildSubtitleConfiguration(inputs, file, logger) {
  const configuration = new Configurator(["-map 0:s?", "-map 0:d?", "-map 0:t?", "-c copy"]);
  return configuration;
}

// eslint-disable-next-line no-unused-vars
const plugin = async (file, librarySettings, inputs, otherArguments) => {
    
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

  const logger = new Log();

  // Begin Abort Section

  // Varibles for aborot section
  const audioCodec = inputs.audioCodec;
  const channelCount = inputs.channels;
  const numberOfLagTags = inputs.language.split(',').length;

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    logger.AddError("File is not a video.");
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

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
    logger.AddError(`Selected ${audioCodec} does not support the channel count of ${channelCount}. Reconfigure the Plugin`);
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }
  
  //channel count 6 not supported
  if (
    (['dca', 'libmp3lame'].includes(audioCodec)) &&
    channelCount === 6
  ) {
    logger.AddError(`Selected ${audioCodec} does not support the channel count of ${channelCount}. Reconfigure the Plugin`);
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }
  
  //channel count 8 not supported
  if (
    (['dca', 'libmp3lame', 'truehd', 'ac3', 'eac3'].includes(audioCodec)) &&
    channelCount === 8
  ) {
    logger.AddError(`Selected ${audioCodec} does not support the channel count of ${channelCount}. Reconfigure the Plugin`);
    response.processFile = false;
    response.infoLog += logger.GetLogData();
    return response;
  }

  // End Abort Section

  //Keep Native Background Work

  if (inputs.keep_native_language === true) {
    const axios = require('axios').default;
    let prio = ['radarr', 'sonarr'];
    let radarrResult = null;
    let sonarrResult = null;
    var tmdbResult = null;

    if (inputs.priority) {
      if (inputs.priority === 'sonarr') {
        prio = ['sonarr', 'radarr'];
      }
    }

    const fileNameEncoded = encodeURIComponent(file.meta.FileName);

    for (const arr of prio) {
      let imdbId;
      // eslint-disable-next-line default-case
      switch (arr) {
        case 'radarr':
          if (tmdbResult) break;
          if (inputs.radarr_api_key) {
            radarrResult = await parseArrResponse(
              await axios
                .get(
                  `http://${inputs.radarr_url}/api/v3/parse?apikey=${inputs.radarr_api_key}&title=${fileNameEncoded}`,
                )
                .then((resp) => resp.data),
              fileNameEncoded,
              'radarr',
            );
  
            if (radarrResult) {
              imdbId = radarrResult.imdbId;
              logger.AddSuccess(`Grabbed ID (${imdbId}) from Radarr `);
              // eslint-disable-next-line import/no-unresolved
              const languages = require('@cospired/i18n-iso-languages');
              tmdbResult = { original_language: languages.getAlpha2Code(radarrResult.originalLanguage.name, 'en') };
            } else {
              logger.AddError(`Couldn't grab ID from Radarr `);
              imdbId = fileNameEncoded;
            }
          }
          break;
        case 'sonarr':
          if (tmdbResult) break;
          if (inputs.sonarr_api_key) {
            sonarrResult = await parseArrResponse(
              await axios.get(
                `http://${inputs.sonarr_url}/api/v3/parse?apikey=${inputs.sonarr_api_key}&title=${fileNameEncoded}`,
              )
                .then((resp) => resp.data),
              file.meta.Directory,
              'sonarr',
            );
  
            if (sonarrResult) {
              imdbId = sonarrResult.imdbId;
              logger.AddSuccess(`Grabbed ID (${imdbId}) from Sonarr `);
            } else {
              logger.AddError(`Couldn't grab ID from Sonarr `);
              imdbId = fileNameEncoded;
            }
            tmdbResult = await tmdbApi(imdbId, inputs.api_key, axios);
          }
      }
    }

    if (tmdbResult) {
      var flagTmdbResult = true;
    } else {
      var flagTmdbResult = false;
      logger.AddError(`Couldn't find the IMDB id of this file. I do not know what the native language is.`);
    }
  }

//Build Configuration

  const videoSettings = buildVideoConfiguration(inputs, file, logger);
  const audioSettings = buildAudioConfiguration(inputs, file, logger, flagTmdbResult, tmdbResult);
  const subtitleSettings = buildSubtitleConfiguration(inputs, file, logger);

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