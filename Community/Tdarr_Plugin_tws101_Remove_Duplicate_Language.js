/* eslint-disable */
const details = () => {
    return {
      id: 'Tdarr_Plugin_tws101_Remove_Duplicate_Language',
      Stage: 'Pre-processing',
      Name: 'tws101 remove duplicate language audio streams',
      Type: 'Audio',
      Operation: 'Transcode',
      Description: `
  Configured language will be checked to see if multiple streams exist.  If yes the highest channel count will be kept the others removed.
  Tracks with commentary or descriptive should be cleared in advance before using this plugin.
  `,
//    Created by tws101 
//    Based on Keep One Audio Stream Method
//    Release version
      Version: '1.00',
      Tags: "pre-processing,audio only,ffmpeg,configurable",
      Inputs: [
        {
          name: "language",
          type: 'string',
          defaultValue: 'en',
          inputUI: {
            type: 'text',
          },
          tooltip:
            'Tdarr will check to see if you have more than one of this languages stream.'
            + ' Case-insensitive. One tag only',
        },
    ],
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  var langTag = inputs.language;
  langTag = langTag.toLowerCase();
  var numberOfAudioStreams = 0
  var numberOfLangStreams = 0


  var numberOfAudioStreams = file.ffProbeData.streams.filter(
    (stream) => stream.codec_type == "audio"
    ).length;


  try {
    var numberOfLangStreams = file.ffProbeData.streams.filter(
      (stream) => stream.codec_type == "audio" &&
      stream.tags.language.toLowerCase().includes(langTag.toLowerCase())
      ).length;
  } catch (err) {
  }

  let ffmpegCommandInsert = '';
  let convert = false;
  let audioIdx = 0;
  let audioStreamsRemoved = 0;
  const audioStreamCount = file.ffProbeData.streams.filter(
    (row) => row.codec_type.toLowerCase() === 'audio',
  ).length;
  

// config and file check

  if (
    numberOfAudioStreams == 0
  ) {
    response.processFile = false;
    response.infoLog += `☒ Invalid file no audio stream exists.\n`;
    return response;
  }

  if (
    numberOfAudioStreams == 1
  ) {
    response.processFile = false;
    response.infoLog += `☑ Only One Audio Stream Exists.\n`;
    return response;
  }

  if (
    numberOfLangStreams == 0
  ) {
    response.processFile = false;
    response.infoLog += `☒ No Stream of ${langTag} Exists.\n`;
    return response;
  }

  if (inputs.language === '') {
    response.infoLog += '☒Language/s options not set, please configure required options. Skipping this plugin.  \n';
    response.processFile = false;
    return response;
  }


//Check to see if we have only one audio stream of the chosen language

  if (
    numberOfLangStreams == 1
  ) {
    response.processFile = false;
    response.infoLog += `☑ Only One Audio Stream of ${langTag} Exists.\n`;
    return response;
  }

  //extra variable to prepare to process

  var streamsWithLangTag = file.ffProbeData.streams.filter((stream) => {
    try {
      if (
        stream.codec_type == "audio" &&
        stream.tags.language.toLowerCase().includes(langTag)
      ) {
        return true;
      }
      return false;
    }  catch (err) {
        return false;
    }
  });

  var streamwithhighestChannelCount = streamsWithLangTag.reduce(getHighest);

  function getHighest(first, second) {
    if (first.channels > second.channels && first) {
      return first;
    } else {
      return second;
    }
  }

  var highestChannelCount = parseInt(streamwithhighestChannelCount.channels)


  // check to see if we have more than one of chosen stream

  if (
    numberOfLangStreams >= 2
  ) {



    for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      let removeTrack = false;
      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio' &&
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes(langTag.toLowerCase()) &&
          file.ffProbeData.streams[i].channels < highestChannelCount
          ) {
          response.infoLog += '☒Audio stream 0:a:${audioIdx} is a duplicate of the selected language removing.  \n';
          removeTrack = true;
        } else if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio' &&
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes(langTag.toLowerCase()) &&
          file.ffProbeData.streams[i].index === streamwithhighestChannelCount.index
          )  {
          removeTrack = false;
        } else if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio' &&
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes(langTag.toLowerCase())
          )  {
          response.infoLog += '☒Audio stream 0:a:${audioIdx} is a duplicate of the selected language removing. It is equal to the highest.  \n';
          removeTrack = true;
        }
      } catch (err) {
        //Error
      }

      if (removeTrack) {
        audioStreamsRemoved += 1;
        ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
        convert = true;
      }

      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        audioIdx += 1;
      }
    }

    // Failsafe to cancel processing if all streams would be removed following this plugin. We don't want no audio.
    if (audioStreamsRemoved === audioStreamCount) {
      response.infoLog += '☒Cancelling plugin otherwise all audio tracks would be removed. \n';
      response.processFile = false;
      return response;
    }
    
    // Convert file if convert variable is set to true.
    if (convert === true) {
      response.processFile = true;
      response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
      response.container = `.${file.container}`;
      response.reQueueAfter = true;
    } else {
      response.processFile = false;
      response.infoLog += "☑File doesn't contain audio tracks which are duplicates.\n";
    }
    return response;
  }
};
module.exports.details = details;
module.exports.plugin = plugin;