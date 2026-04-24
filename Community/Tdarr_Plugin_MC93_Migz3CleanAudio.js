/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz3CleanAudio',
  Stage: 'Pre-processing',
  Name: 'Migz Clean Audio Streams',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin keeps only specified language tracks & can tags tracks with  an unknown language. \n\n',
  Version: '2.4',
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [{
    name: 'language',
    type: 'string',
    defaultValue: 'eng,und',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify language tag/s here for the audio tracks you'd like to keep
               \\nRecommended to keep "und" as this stands for undertermined
               \\nSome files may not have the language specified.
               \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
               \\nExample:\\n
               eng

               \\nExample:\\n
               eng,und

               \\nExample:\\n
               eng,und,jpn`,
  },
  {
    name: 'commentary',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify if audio tracks that contain commentary/description should be removed.
               \\nExample:\\n
               true

               \\nExample:\\n
               false`,
  },
  {
    name: 'tag_language',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify a single language for audio tracks with no language or unknown language to be tagged with.
                    \\nYou must have "und" in your list of languages to keep for this to function.
                    \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                    \\nLeave empty to disable.
               \\nExample:\\n
               eng

               \\nExample:\\n
               por`,
  },
  {
    name: 'tag_title',
    type: 'boolean',
    defaultValue: false,
    inputUI: {
      type: 'dropdown',
      options: [
        'false',
        'true',
      ],
    },
    tooltip: `Specify audio tracks with no title to be tagged with the number of channels they contain.
           \\nDo NOT use this with mp4, as mp4 does not support title tags.
    \\nExample:\\n
    true
    
    \\nExample:\\n
    false`,
  },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Check if inputs.language has been configured. If it hasn't then exit plugin.
  if (inputs.language === '') {
    response.infoLog += '☒Language/s options not set, please configure required options. Skipping this plugin.  \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  const language = inputs.language.split(',');
  let ffmpegCommandInsert = '';
  let convert = false;
  let audioIdx = 0;
  let audioStreamsRemoved = 0;
  const audioStreamCount = file.ffProbeData.streams.filter(
    (row) => row.codec_type.toLowerCase() === 'audio',
  ).length;

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    let removeTrack = false;
    // Catch error here incase the language metadata is completely missing.
    try {
      // Check if stream is audio
      // AND checks if the tracks language code does not match any of the languages entered in inputs.language.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
        && language.indexOf(
          file.ffProbeData.streams[i].tags.language.toLowerCase(),
        ) === -1
      ) {
        response.infoLog += `☒Audio stream 0:a:${audioIdx} has unwanted language tag ${file.ffProbeData.streams[
          i
        ].tags.language.toLowerCase()}, removing. \n`;
        removeTrack = true;
      }
    } catch (err) {
      // Error
    }

    // Catch error here incase the title metadata is completely missing.
    try {
      // Check if inputs.commentary is set to true
      // AND if stream is audio
      // AND then checks for stream titles with the following "commentary, description, sdh".
      // Removing any streams that are applicable.
      if (
        inputs.commentary === true
        && file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
        && (file.ffProbeData.streams[i].tags.title
          .toLowerCase()
          .includes('commentary')
          || file.ffProbeData.streams[i].tags.title
            .toLowerCase()
            .includes('description')
          || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh'))
      ) {
        removeTrack = true;
        response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as being descriptive, removing. \n`;
      }
    } catch (err) {
      // Error
    }

    if (removeTrack) {
      audioStreamsRemoved += 1;
      ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
      convert = true;
    }
    // Check if inputs.tag_language has something entered
    // (Entered means user actually wants something to happen, empty would disable this)
    // AND checks that stream is audio.
    if (
      inputs.tag_language !== ''
      && file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
    ) {
      // Catch error here incase the metadata is completely missing.
      try {
        // Look for audio with "und" as metadata language.
        if (
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes('und')
        ) {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
          response.infoLog
            += `☒Audio stream 0:a:${audioIdx} detected as having no language, tagging as ${inputs.tag_language}. \n`;
          convert = true;
        }
      } catch (err) {
        // Error
      }

      // Checks if the tags metadata is completely missing.
      // If so this would cause playback to show language as "undefined".
      // No catch error here otherwise it would never detect the metadata as missing.
      if (typeof file.ffProbeData.streams[i].tags === 'undefined') {
        ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
        response.infoLog
          += `☒Audio stream 0:a:${audioIdx} detected as having no language, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      } else if (typeof file.ffProbeData.streams[i].tags.language === 'undefined') {
        // Checks if the tags.language metadata is completely missing.
        // If so this would cause playback to show language as "undefined".
        // No catch error here otherwise it would never detect the metadata as missing.
        ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
        response.infoLog
          += `☒Audio stream 0:a:${audioIdx} detected as having no language, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      }
    }

    try {
      // Check if title metadata is missing from any streams
      // AND inputs.tag_title set to true AND if stream type is audio. Add title to any applicable streams.
      if (
        typeof file.ffProbeData.streams[i].tags.title === 'undefined'
        && inputs.tag_title === true
        && file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
      ) {
        if (file.ffProbeData.streams[i].channels === 8) {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="7.1" `;
          response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as 8 channel with no title, tagging. \n`;
          convert = true;
        }
        if (file.ffProbeData.streams[i].channels === 6) {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="5.1" `;
          response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as 6 channel with no title, tagging. \n`;
          convert = true;
        }
        if (file.ffProbeData.streams[i].channels === 2) {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="2.0" `;
          response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as 2 channel with no title, tagging. \n`;
          convert = true;
        }
      }
    } catch (err) {
      // Error
    }

    // Check if stream type is audio and increment audioIdx if true.
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
    response.infoLog += "☑File doesn't contain audio tracks which are unwanted or that require tagging.\n";
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
