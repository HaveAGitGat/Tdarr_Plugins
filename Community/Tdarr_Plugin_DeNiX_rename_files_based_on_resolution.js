/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_DeNiX_rename_files_based_on_resolution",
    Stage: "Post-processing",
    Name: "Rename Based On Resolution",
    Type: "Video",
    Operation: "Transcode",
    Description: [Contains built-in filter] If the filename contains resolution indicators such as '720p', '1080p', '2160p', '4K', '480p', etc., this plugin renames files to match the actual resolution of the video stream. \n\n,
    Version: "1.00",
    Tags: "post-processing",
    Inputs: []
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);

  try {
    const fs = require("fs");
    const fileNameOld = file._id;
    const width = file.ffProbeData.streams[0].width;
    let resolution;

    if (width >= 3840) {
      resolution = "2160p";
    } else if (width >= 1920) {
      resolution = "1080p";
    } else if (width >= 1280) {
      resolution = "720p";
    } else if (width >= 640) {
      resolution = "480p";
    } else {
      resolution = "SD";
    }

    console.log(Detected resolution: ${resolution});

    const regex = /720p|1080p|2160p|4K|480p/;
    if (regex.test(file._id)) {
      file._id = file._id.replace(regex, resolution);
      file.file = file.file.replace(regex, resolution);
    }

    if (fileNameOld !== file._id) {
      fs.renameSync(fileNameOld, file._id, { overwrite: true });

      return {
        file,
        removeFromDB: false,
        updateDB: true,
      };
    }
  } catch (err) {
    console.log(Error renaming file: ${err.message});
  }

  return {
    file,
    removeFromDB: false,
    updateDB: false,
  };
};

module.exports.details = details;
module.exports.plugin = plugin;
