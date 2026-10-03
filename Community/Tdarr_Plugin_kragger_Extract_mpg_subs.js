// List any npm dependencies which the plugin needs, they will be auto installed when the plugin runs:
module.exports.dependencies = [
  'import-fresh',
];

const details = () => ({
  id: 'Tdarr_Plugin_kragger_Extract_mpg_subs',
  Stage: 'Pre-processing', // Pre-processing or Post-processing. Determines when the plugin will be executed.
  Name: 'Extract mpg Subtitles ',
  Type: 'Subtitle',
  Operation: 'Transcode',
  Description: 'This plugin extracts the first subtitle in an mpg or ts file where subtitles are tied to the video.\n',
  Version: '1.00',
  Tags: 'ffmpeg,pre-processing,subtitle only', // Provide tags to categorise your plugin in the plugin browser.Tag

  Inputs: [
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  // const lib = require('../methods/lib')();
  // load default plugin inputs
  // inputs = lib.loadDefaultValues(inputs, details);

  // Only 'require' dependencies within this function or other functions. Do not require in the top scope.
  // const importFresh = require('import-fresh');

  // Must return following object at some point in the function else plugin will fail.

  const response = {
    processFile: false, // If set to false, the file will be skipped. Set to true to have the file transcoded.
    preset: '', // HandBrake/FFmpeg CLI arguments you'd like to use.
    container: '.mkv', // The container of the transcoded output file.
    handBrakeMode: false, // Set whether to use HandBrake or FFmpeg for transcoding
    FFmpegMode: true,
    infoLog: '', // This will be shown when the user clicks the 'i' (info) button on a file in the output queue if

    file,
    reQueueAfter: false,
    removeFromDB: false, // Tell Tdarr to remove file from database if true
    updateDB: false, // Change file object above and update database if true
  };

  // We will use FFmpeg for this procedure.
  response.FFmpegMode = true;

  if (file.container === 'mpg' || file.container === 'ts') {
    response.infoLog += ' File has the proper container';
    let lfn = `${file.meta.Directory}/${file.meta.FileName}`;

    lfn = lfn.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/:/g, '\\\\:').replace(/'/g, "\\\\\\'");
    response.preset = `<io> -f lavfi -i "movie=${lfn}[out0+subcc]" `;
    response.preset += '-map 1:1 -c:s srt -map 0 -c:v copy -c:a copy -copyts ';
    response.processFile = true;
    return response;
  }

  response.infoLog += ' File must be of type .mpg or .ts to be processed';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
