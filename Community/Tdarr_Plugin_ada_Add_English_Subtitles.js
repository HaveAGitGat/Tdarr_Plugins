/* eslint-disable */

// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_ada_Add_Eng_Subtitles",
    Stage: "Pre-processing",
    Name: "Add subtitles to MKV files",
    Type: "Video",
    Operation: "Transcode",
    Description: `Based on Tdarr_Plugin_e5c3_CnT_Add_Subtitles but without requiring node modules.
                  Can be used in conjunction with Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT
                  or Tdarr_Plugin_rr01_drpeppershaker_extract_subs_to_SRT to remove image subs and re-embedd as srt.
                  This plugin will check for English subtitles and add them if they are there,
                  they should be named as the {file name without .mkv/mp4}.eng.srt}. Example is Interstellar.mkv the respective sub name should be Interstellar.eng.srt.
                  It will not proceed if there are already English subtitles (also acts as a filtering measure), or if there are no related subtitles in the directory.
                  Everything else remains the same and output container is mkv.`,
    Version: "1",
    Tags: "pre-processing,ffmpeg,subtitle only",
    Inputs: [],
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require("../methods/lib")();
  const fs = require("fs");
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  var response = {
    processFile: false,
    preset: "",
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: `Searching new subtitles...\n`,
  };

  var found_subtitle_stream = 0;
  var sub = 0; //becomes first subtitle stream
  var path = file.meta.Directory; //path of media folder
  var embedded_sub_exist = 0; // 0 - subs doesn't exist in file, 1 - it does
  var srt_exist = 0; // 0 - file isn't present in directory, 1 - it is

  const { originalLibraryFile } = otherArguments;

  let subsFile = "";

  // for Tdarr V2 (2.00.05+)
  if (originalLibraryFile && originalLibraryFile.file) {
    subsFile = originalLibraryFile.file;
  } else {
    // for Tdarr V1
    subsFile = file.file;
  }
  subsFile = subsFile.split(".");
  subsFile[subsFile.length - 2] += `.eng`;
  subsFile[subsFile.length - 1] = "srt";
  subsFile = subsFile.join(".");

  //find first subtitle stream
  while (found_subtitle_stream == 0 && sub < file.ffProbeData.streams.length) {
    if (file.ffProbeData.streams[sub].codec_type.toLowerCase() == "subtitle") {
      found_subtitle_stream = 1;
    } else {
      sub++;
    }
  }

  response.infoLog += `Path: ${path}\n`;
  //check if srt file exists in folder
  if (fs.existsSync(`${subsFile}`)) {
    response.infoLog += `\nFound subtitle ${subsFile}`;
    srt_exist = 1;
  } else {
    srt_exist = 0;
  }
  if (found_subtitle_stream == 1) {
    //check if language already exists
    for (
      sub_stream = sub;
      sub_stream < file.ffProbeData.streams.length;
      sub_stream++
    ) {
      if (file.ffProbeData.streams[sub_stream].tags.language) {
        if (
          file.ffProbeData.streams[sub_stream].tags.language
            .toLowerCase()
            .includes("eng")
        ) {
          embedded_sub_exist = 1;
        }
      }
    }
  } else {
    embedded_sub_exist = 0;
  }

  if (embedded_sub_exist == 0 && srt_exist == 1) {
    response.FFmpegMode = true;
    response.processFile = true;
    response.reQueueAfter = false;
    response.preset = `, -sub_charenc "UTF-8" -f srt -i "${subsFile}" -metadata:s:s:0 language=English -map 0:v -map 0:a -map 1:s -c copy`;
    response.infoLog += `\n${subsFile} subs will be added\n`;
  } else if (embedded_sub_exist == 1) {
    response.infoLog +=
      `\nNot needed as there are already English subtitles embedded` +
      (srt_exist
        ? ` but ${subsFile} does exist.`
        : ` and ${subsFile} does not exist`);
    response.processFile = false;
  } else {
    response.infoLog +=
      `${subsFile} does not exist` +
      (embedded_sub_exist
        ? ` but not needed as English subs are already embedded`
        : " and English subs are not embedded.");
    response.processFile = false;
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
