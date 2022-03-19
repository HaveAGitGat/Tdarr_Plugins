const details = () => ({
  id: 'Tdarr_Plugin_DaveThe0nly_Remove_From_Plex_ignore',
  Stage: 'Post-processing',
  Name: 'Remove from plexignore file',
  Type: 'Video',
  Operation: 'Transcode',
  // eslint-disable-next-line max-len
  Description: 'This plugin removes the file from the specified .plexignore',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,subtitles',
  Inputs: [
    {
      name: 'plexingoreFileLocation',
      type: 'string',
      defaultValue: 'libraryRoot',
      inputUI: {
        type: 'dropdown',
        options: [
          'libraryRoot',
          'fileRoot',
        ],
      },
      tooltip: 'The plexignore that should be targeted',
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  const fs = require('fs');

  const {
    plexingoreFileLocation,
  } = lib.loadDefaultValues(inputs, details);

  // Optional response if you need to modify database
  const response = {
    file,
    removeFromDB: false,
    updateDB: false,
  };

  const fileLocation = (otherArguments.originalLibraryFile || file).file.split('/');
  const fileName = fileLocation[fileLocation.length - 1];
  const hasSeasonFolder = !!fileLocation[fileLocation.length - 2].match(/season/gi);
  const seriesLocation = fileLocation.slice(0, hasSeasonFolder ? fileLocation.length - 2 : fileLocation.length - 1);

  const ignoreFileLocation = plexingoreFileLocation === 'libraryRoot'
    ? librarySettings.folder
    : seriesLocation.join('/');
  const ignoreFile = fs.readFileSync(`${ignoreFileLocation}/.plexignore`, 'utf-8');

  const ignoredFiles = ignoreFile.split('\n');

  const isIgnored = ignoredFiles.findIndex((ignoredFile) => ignoredFile.includes(fileName));

  if (isIgnored > -1) {
    ignoredFiles.splice(isIgnored, 1);

    fs.writeFileSync(`${ignoreFileLocation}/.plexignore`, ignoredFiles.join('\n'));
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
