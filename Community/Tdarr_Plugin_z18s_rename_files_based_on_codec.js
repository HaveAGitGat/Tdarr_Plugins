/* eslint-disable */

module.exports.dependencies = [
  'fs-extra',
];

module.exports.details = function details() {
  return {
    id: "Tdarr_Plugin_z18s_rename_files_based_on_codec",
    Stage: "Post-processing",
    Name: "Rename based on codec",
    Type: "Video",
    Operation: "",
    Description: `[Contains built-in filter]This plugin renames 264 files to 265 or vice versa depending on codec. \n\n`,
    Version: "1.00",
    Link: "",
    Tags: "post-processing",
  };
};

module.exports.plugin = function plugin(file, librarySettings, inputs) {
  try {
    var fs = require("fs");
    var path = require("path");
    if (fs.existsSync(path.join(process.cwd(), "/npm"))) {
      var rootModules = path.join(process.cwd(), "/npm/node_modules/");
    } else {
      var rootModules = "";
    }

    var fsextra = require(rootModules + "fs-extra");

    var fileNameOld = file._id;

    if (
      file.ffProbeData.streams[0].codec_name == "hevc" &&
      file._id.includes("264")
    ) {
      file._id = file._id.replace("264", "265");
      file.file = file.file.replace("264", "265");
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
      fsextra.moveSync(fileNameOld, file._id, {
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
