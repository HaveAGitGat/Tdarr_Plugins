/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_zera_rename_file_to_remove_flag",
    Stage: "Post-processing",
    Name: "Rename file to remove Flag",
    Type: "Video",
    Operation: "Transcode",
    Description: `If the file name contains a provided flag, it will remove said flag (Put after transcoding operations) \n\n`,
    Version: "1.00",
    Tags: "post-processing",
    Inputs:[
      {
        name: 'flag',
        type: 'string',
        defaultValue: '.TDARR',
        inputUI: {
          type: 'text',
        },
        tooltip:
          `Enter the text you want to be removed from your file names. This is designed for people who want to use Sonarr/Radarr to download files but only have Plex/Emby/Jellyfin recognise them AFTER transcoding has been done. Based on the Community Plugin "Tdarr_Plugin_z18s_rename_files_based_on_codec"`,
      }
    ]
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  try {
    var fs = require("fs");
    var fileNameOld = file._id;

    if (
      file._id.includes(inputs.flag)
    ) {
      file._id = file._id.replace(inputs.flag, "");
      file.file = file.file.replace(inputs.flag, "");
    }

    if (fileNameOld != file._id) {
      fs.renameSync(fileNameOld, file._id, {
        overwrite: true,
      });

      var response = {
        file,
        removeFromDB: false,
        updateDB: true,
      };

      return response;
    }
  } catch (err) {
    console.log(err);
  }
};


 
module.exports.details = details;
module.exports.plugin = plugin;