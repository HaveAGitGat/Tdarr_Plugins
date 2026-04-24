/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz4CleanSubs',
  Stage: 'Pre-processing',
  Name: 'Migz Clean Subtitle Streams',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: 'This plugin keeps only specified language tracks & can tag tracks with an unknown language. \n\n',
  Version: '2.4',
  Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
  Inputs: [{
    name: 'language',
    type: 'string',
    defaultValue: 'eng',
    inputUI: {
      type: 'text',
    },
    tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep.
                    \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
               \\nExample:\\n
               eng

               \\nExample:\\n
               eng,jpn`,
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
    tooltip: `Specify if subtitle tracks that contain commentary/description should be removed.
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
    tooltip: `Specify a single language for subtitle tracks with no language or unknown language to be tagged with.
                    \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
                    \\nLeave empty to disable.
               \\nExample:\\n
               eng

               \\nExample:\\n
               por`,
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
    response.infoLog
      += '☒Language/s to keep have not been configured, '
      + 'please configure required options. Skipping this plugin.  \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  const language = inputs.language.split(',');
  let ffmpegCommandInsert = '';
  let subtitleIdx = 0;
  let convert = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Catch error here incase the language metadata is completely missing.
    try {
      // Check if stream is subtitle
      // AND checks if the tracks language code does not match any of the languages entered in inputs.language.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
        && language.indexOf(
          file.ffProbeData.streams[i].tags.language.toLowerCase(),
        ) === -1
      ) {
        ffmpegCommandInsert += `-map -0:s:${subtitleIdx} `;
        response.infoLog += `☒Subtitle stream 0:s:${subtitleIdx} has unwanted language tag ${file.ffProbeData.streams[
          i
        ].tags.language.toLowerCase()}, removing. \n`;
        convert = true;
      }
    } catch (err) {
      // Error
    }

    // Catch error here incase the title metadata is completely missing.
    try {
      // Check if inputs.commentary is set to true
      // AND if stream is subtitle
      // AND then checks for stream titles with the following "commentary, description, sdh".
      // Removing any streams that are applicable.
      if (
        inputs.commentary === true
        && file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
        && (file.ffProbeData.streams[i].tags.title
          .toLowerCase()
          .includes('commentary')
          || file.ffProbeData.streams[i].tags.title
            .toLowerCase()
            .includes('description')
          || file.ffProbeData.streams[i].tags.title.toLowerCase().includes('sdh'))
      ) {
        ffmpegCommandInsert += `-map -0:s:${subtitleIdx} `;
        response.infoLog += `☒Subtitle stream 0:s:${subtitleIdx} detected as being descriptive, removing. \n`;
        convert = true;
      }
    } catch (err) {
      // Error
    }

    // Check if inputs.tag_language has something entered.
    // (Entered means user actually wants something to happen, empty would disable this)
    // AND checks that stream is subtitle.
    if (
      inputs.tag_language !== ''
      && file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle'
    ) {
      // Catch error here incase the metadata is completely missing.
      try {
        // Look for subtitle with "und" as metadata language.
        if (
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes('und')
        ) {
          ffmpegCommandInsert += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_language} `;
          response.infoLog
            += `☒Subtitle stream 0:s:${subtitleIdx} has no language, tagging as ${inputs.tag_language}. \n`;
          convert = true;
        }
      } catch (err) {
        // Error
      }

      // Checks if the tags metadata is completely missing.
      //  If so this would cause playback to show language as "undefined".
      // No catch error here otherwise it would never detect the metadata as missing.
      if (typeof file.ffProbeData.streams[i].tags === 'undefined') {
        ffmpegCommandInsert += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_language} `;
        response.infoLog
          += `☒Subtitle stream 0:s:${subtitleIdx} has no language, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      } else if (typeof file.ffProbeData.streams[i].tags.language === 'undefined') {
      // Checks if the tags.language metadata is completely missing.
      // If so this would cause playback to show language as "undefined".
      // No catch error here otherwise it would never detect the metadata as missing
        ffmpegCommandInsert += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_language} `;
        response.infoLog
          += `☒Subtitle stream 0:s:${subtitleIdx} has no language, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      }
    }

    // Check if stream type is subtitle and increment subtitleIdx if true.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
      subtitleIdx += 1;
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.container = `.${file.container}`;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain subtitle tracks which are unwanted or that require tagging.\n";
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
