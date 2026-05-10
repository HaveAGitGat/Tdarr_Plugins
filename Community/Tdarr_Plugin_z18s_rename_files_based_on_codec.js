/* eslint-disable */

const details = () => {
  return {
    id: "Tdarr_Plugin_z18s_rename_files_based_on_codec",
    Stage: "Post-processing",
    Name: "Rename Based On Codec",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] If the filename contains '264', '265', 'AVC', 'HEVC', or 'AV1', this plugin renames codec tags in filenames to match the detected video codec (h264, hevc, av1). \n\n`,
    Version: "1.02",
    Tags: "post-processing",
    Inputs:[]
  };
};

const renameMap = {
  hevc: [
    ["264", "265"],
    ["AVC", "HEVC"],
    ["avc", "HEVC"],
    ["AV1", "265"],
    ["av1", "265"],
  ],
  h264: [
    ["265", "264"],
    ["hevc", "264"],
    ["HEVC", "264"],
    ["AV1", "264"],
    ["av1", "264"],
  ],
  av1: [
    ["h264", "AV1"],
    ["H264", "AV1"],
    ["x264", "AV1"],
    ["X264", "AV1"],
    ["h265", "AV1"],
    ["H265", "AV1"],
    ["x265", "AV1"],
    ["X265", "AV1"],
    ["264", "AV1"],
    ["265", "AV1"],
    ["hevc", "AV1"],
    ["HEVC", "AV1"],
    ["AVC", "AV1"],
    ["avc", "AV1"],
    ["av1", "AV1"],
  ],
};

const applyRulesToFileName = (filePath, rules) => {
  var fileNameStart = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")) + 1;
  var directory = filePath.slice(0, fileNameStart);
  var fileName = filePath.slice(fileNameStart);

  rules.forEach(function (rule) {
    fileName = fileName.replace(rule[0], rule[1]);
  });

  return directory + fileName;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  try {
    var fs = require("fs");
    var fileNameOld = file._id;
    var codecName = file.ffProbeData.streams[0] && file.ffProbeData.streams[0].codec_name;

    if (renameMap[codecName]) {
      file._id = applyRulesToFileName(file._id, renameMap[codecName]);
      file.file = applyRulesToFileName(file.file, renameMap[codecName]);
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
