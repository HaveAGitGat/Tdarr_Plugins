// Rules disabled for example purposes
/* eslint max-len: 0 */ // --> OFF
/* eslint no-unused-vars: 0 */ // --> OFF
/* eslint global-require: 0 */ // --> OFF
/* eslint import/no-extraneous-dependencies: 0 */ // --> OFF
/* eslint no-console: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF

// List any npm dependencies which the plugin needs, they will be auto installed when the plugin runs:
module.exports.dependencies = [
  'import-fresh',
];

const details = () => ({
  id: 'Tdarr_Plugin_pre1_Pre_Proc_Example',
  Stage: 'Pre-processing', // Pre-processing or Post-processing. Determines when the plugin will be executed.
  Name: 'No Title Meta Data',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin removes metadata (if a title exists). The output container is the same as the original. \n\n',
  Version: '1.00',
  Tags: 'ffmpeg,h265', // Provide tags to categorise your plugin in the plugin browser.Tag options: h265,hevc,h264,nvenc h265,nvenc h264,video only,audio only,subtitle only,handbrake,ffmpeg,radarr,sonarr,pre-processing,post-processing,configurable

  Inputs: [
    // (Optional) Inputs you'd like the user to enter to allow your plugin to be easily configurable from the UI
    {
      name: 'language',
      type: 'string', // set the data type of the input ('string', 'number', 'boolean')
      defaultValue: 'eng', // set the default value of the input incase the user enters no input
      inputUI: {
        type: 'text', // specify how the input UI will appear to the user ('text' or 'dropdown')
      },
      // inputUI: {            // dropdown inputUI example
      //   type: 'dropdown',
      //   options: [
      //     'false',
      //     'true',
      //   ],
      // },
      tooltip: `Enter one language tag here for the language of the subtitles you'd like to keep. 
      
      \\nExample:\\n 
      eng  
      
      \\nExample:\\n 
      
      fr  
      
      \\nExample:\\n 
      
      de`, // Each line following `Example:` will be clearly formatted. \\n used for line breaks
    },
    {
      name: 'channels',
      type: 'number',
      defaultValue: 2,
      inputUI: {
        type: 'dropdown',
        options: [
          '1',
          '2',
          '6',
        ],
      },
      tooltip: `Desired audio channel number.
      \\nExample:\\n
      2`,
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // load default plugin inputs
  inputs = lib.loadDefaultValues(inputs, details);

  // Only 'require' dependencies within this function or other functions. Do not require in the top scope.
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  const importFresh = require('import-fresh');

  // Must return following object at some point in the function else plugin will fail.

  const response = {
    processFile: false, // If set to false, the file will be skipped. Set to true to have the file transcoded.
    preset: '', // HandBrake/FFmpeg CLI arguments you'd like to use.
    // For FFmpeg, the input arguments come first followed by <io>, followed by the output argument.
    // Examples
    // HandBrake
    // '-Z "Very Fast 1080p30"'
    // FFmpeg
    // '-sn <io> -map_metadata -1 -c:v copy -c:a copy'
    container: '.mp4', // The container of the transcoded output file.
    handBrakeMode: false, // Set whether to use HandBrake or FFmpeg for transcoding
    FFmpegMode: false,
    infoLog: '', // This will be shown when the user clicks the 'i' (info) button on a file in the output queue if
    // it has been skipped.
    // Give reasons why it has been skipped ('File has no title metadata, File meets conditions!')

    // Optional (include together)
    file,
    removeFromDB: false, // Tell Tdarr to remove file from database if true
    updateDB: false, // Change file object above and update database if true
  };

  console.log(inputs.language); // eng if user entered 'eng' in input box in Tdarr plugin UI
  console.log(inputs.channels); // 2 if user entered '2' in input box in Tdarr plugin UI

  // Here we specify that we want the output file container to be the same as the current container.
  response.container = `.${file.container}`;

  // We will use FFmpeg for this procedure.
  response.FFmpegMode = true;

  // Check if file has title metadata
  if (file.meta.Title !== undefined) {
    // if so, remove it

    response.infoLog += ' File has title metadata';
    response.preset = '<io> -map_metadata -1 -c:v copy -c:a copy';
    response.processFile = true;
    return response;
  }
  response.infoLog += ' File has no title metadata';

  response.infoLog += ' File meets conditions!';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
