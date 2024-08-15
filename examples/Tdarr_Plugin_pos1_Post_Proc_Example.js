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
  id: 'Tdarr_Plugin_pos1_Post_Proc_Example',
  Stage: 'Post-processing', // Preprocessing or Post-processing. Determines when the plugin will be executed. This plugin does some stuff after all plugins have been executed
  Name: 'Post Proc',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin does some stuff after all plugins have been executed. \n\n',
  Version: '1.00',
  Tags: 'ffmpeg,h265', // Provide tags to categorise your plugin in the plugin browser.Tag options: h265,hevc,h264,nvenc h265,nvenc h264,video only,audio only,subtitle only,handbrake,ffmpeg,radarr,sonarr,pre-processing,post-processing,configurable

  Inputs: [
    // (Optional) Inputs you'd like the user to enter to allow your plugin to be easily configurable from the UI
    {
      name: 'language',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter one language tag here for the language of the subtitles you'd like to keep.  
      
      \\nExample:\\n
       eng  
       
       \\nExample:\\n
       fr  
       
       \\nExample:\\n
       de`, // Each line following `Example:` will be clearly formatted. \\n used for line breaks
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // load default plugin inputs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  inputs = lib.loadDefaultValues(inputs, details);

  // Only 'require' dependencies within this function or other functions. Do not require in the top scope.
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  const importFresh = require('import-fresh');

  console.log(
    'Transcode success! Now do some stuff with the newly scanned file.',
  );

  // Optional response if you need to modify database
  const response = {
    file,
    removeFromDB: false,
    updateDB: false,
  };

  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
