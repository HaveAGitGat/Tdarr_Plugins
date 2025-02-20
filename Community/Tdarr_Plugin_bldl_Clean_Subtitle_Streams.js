/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_bldl_Clean_Subtitle_Streams',
  Stage: 'Pre-processing',
  Name: 'bldl Clean Subtitle Streams',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: 'This plugin remove specified subtitle tracks. \n\n',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,subtitle only,configurable',
  Inputs: [{
    name: 'titles_to_clean',
    type: 'string',
    defaultValue: 'Signs / Songs',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Specify titles to clean, separated by a comma. Defaults to "Signs / Songs".',
  }],
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

  if (inputs.titles_to_clean === undefined) {
    response.processFile = false;
    response.infoLog += '☒ Inputs not entered! \n';
    return response;
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');
    response.infoLog += '☒File is not video \n';
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let convert = false;

  const titles_to_clean = inputs.titles_to_clean.split(',').map((s) => s.toLowerCase());

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Catch error here incase the title metadata is completely missing.
    try {
      // Check if stream is subtitle
      // AND then checks for stream titles with the specified titles.
      // Removing any streams that are applicable.
      const stream = file.ffProbeData.streams[i];
      if (stream.codec_type.toLowerCase() === 'subtitle'
        && titles_to_clean.some((s) => stream.tags.title.toLowerCase().includes(s))) {
        ffmpegCommandInsert += `-map -0:${stream.index} `;
        response.infoLog += `☒Subtitle stream 0:${stream.index} detected as being ${titles_to_clean}; removing. \n`;
        convert = true;
      }
    } catch (err) {
      // Error
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
