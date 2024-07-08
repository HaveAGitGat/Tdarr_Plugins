module.exports.dependencies = [
  'touch',
];

// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_z80t_keep_original_date',
  Stage: 'Post-processing',
  Name: 'Keep Original File Dates And Times After Transcoding',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'This plugin copies the original file dates and times to the transcoded file \n\n',
  Version: '1.10',
  Tags: 'post-processing,dates,date',
  Inputs: [
    {
      name: 'log',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Write log entries to console.log. Default is false.

      \\nExample:\\n
       true`,
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  // eslint-disable-next-line import/no-unresolved,import/no-extraneous-dependencies
  const touch = require('touch');
  const os = require('os');
  const fs = require('fs');

  const log = (msg) => {
    if (inputs.log === true) {
      // eslint-disable-next-line no-console
      console.log(msg);
    }
  };

  const responseData = {
    file,
    removeFromDB: false,
    updateDB: false,
    infoLog: '',
  };

  try {
    log('Changing date...');

    const { mtimeMs, ctimeMs } = otherArguments.originalLibraryFile.statSync;
    if (os.platform() === 'win32') {
      fs.utimes(
        file._id,
        ctimeMs / 1000,
        mtimeMs / 1000,
        (err) => {
          if (err) {
            log('Error updating modified date');
          }
        },
      );
    } else {
      touch.sync(file._id, { mtimeMs, force: true });
    }

    log('Done.');
    responseData.infoLog += 'File timestamps updated or match original file\n';
    return responseData;
  } catch (err) {
    log(err);
  }

  return responseData;
};

module.exports.details = details;
module.exports.plugin = plugin;
