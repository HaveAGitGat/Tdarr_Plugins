/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_z18s_rename_files_based_on_codec",
    Stage: "Post-processing",
    Name: "Rename Based On Codec",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] If the filename contains '264' or '265', this plugin renames 264 files to 265 or vice versa depending on codec. \n\n`,
    Version: "1.00",
    Tags: "post-processing",
    Inputs:[]
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  try {
    var fs = require("fs");
    var fileNameOld = file._id;

    if (
      file.ffProbeData.streams[0].codec_name == "hevc" &&
      file._id.includes("264")
    ) {
      file._id = file._id.replace("264", "265");
      file.file = file.file.replace("264", "265");
    }
    
    //added handling for files with AVC in the name instead of h264/x264
    if (
      file.ffProbeData.streams[0].codec_name == "hevc" &&
      file._id.includes("AVC")
    ) {
      file._id = file._id.replace("AVC", "HEVC");
      file.file = file.file.replace("AVC", "HEVC");
    }

    if (
      file.ffProbeData.streams[0].codec_name == "h264" &&
      file._id.includes("265")
    ) {
      file._id = file._id.replace("265", "264");
      file.file = file.file.replace("265", "264");
    }

    if (
      file.ffProbeData.streams[0].codec_name == "h264" &&
      file._id.includes("hevc")
    ) {
      file._id = file._id.replace("hevc", "264");
      file.file = file.file.replace("hevc", "264");
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