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

  const hasStreamLanguageThatShouldntBeKept = (streamLanguage) => inputs.language.split(',').indexOf(streamLanguage !== 'und' ? streamLanguage : inputs.tag_language) === -1;
  const isSDHAudioStream = (stream) => stream.disposition.hearing_impaired === 1 || /\b(ad|sdh)\b/gi.test(stream.tags?.title || '');
  const isDescriptiveAudioStream = (stream) => stream.disposition.comment == 1 || stream.disposition.descriptions === 1 || stream.disposition.visual_impaired === 1 || /\b(commentary|description|descriptive)\b/gi.test(stream.tags?.title || '');

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let convert = false;
  let audioIdx = 0;
  let audioStreamsRemoved = 0;
  const audioStreamCount = file.ffProbeData.streams.filter(
      (row) => row.codec_type.toLowerCase() === 'audio',
  ).length;

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
      const stream = file.ffProbeData.streams[i];

      if (stream.codec_type.toLowerCase() === 'audio') {
          const streamLanguage = stream.tags?.language?.toLowerCase() || 'und';
          const streamTitle = stream.tags?.title?.toLowerCase() || '';

          if (
              hasStreamLanguageThatShouldntBeKept(streamLanguage)
              || (inputs.commentary === true && (isSDHAudioStream(stream) || isDescriptiveAudioStream(stream)))
          ) {
              convert = true;
              ++audioStreamsRemoved;
              response.infoLog += `☒Audio stream 0:a:${audioIdx} has unwanted language tag ${streamLanguage} or is detected as being descriptive, removing. \n`;
              ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
          } else {
              if (
                  inputs.tag_language !== ''
                  && streamLanguage === 'und'
              ) {
                  convert = true;
                  response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as having no language, tagging language to ${inputs.tag_language}. \n`;
                  ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
              }

              if (
                  inputs.tag_title === true
                  && streamTitle === ''
              ) {
                  convert = true;
                  const newStreamTitle = `${streamLanguage !== 'und' ? streamLanguage : inputs.tag_language}_${stream.channel_layout || stream.channels}`;
                  response.infoLog += `☒Audio stream 0:a:${audioIdx} detected as ${stream.channels} channels with no title, tagging title to ${newStreamTitle}. \n`;
                  ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title=${newStreamTitle} `;
              }
          }

          ++audioIdx;
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