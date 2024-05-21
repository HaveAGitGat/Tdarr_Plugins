/* eslint-disable */
// tdarrSkipTest
const details = () => {
  return {
    id: "Tdarr_Plugin_078d_Output_embedded_subs_to_SRT_and_remove",
    Stage: "Pre-processing",
    Name: "Output Embedded Subs To SRT And Remove",
    Type: "Video",
    Operation: "Transcode",
    Description: `This plugin outputs embedded subs to SRT and then removes them \n\n`,
    Version: "1.00",
    Tags: "ffmpeg",
    Inputs:[],
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object at some point in the function else plugin will fail.

  let response = {
    processFile: false,
    preset: "",
    container: "",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: true,
    infoLog: "",
  };

  const ffmpegPath = otherArguments.ffmpegPath
  const exec = require("child_process").exec;

  let subsArr = file.ffProbeData.streams.filter(row => row.codec_name === 'subrip')

  if (subsArr.length === 0) {
    response.infoLog += "No subs in file to extract!";
    return response
  }

  let subStream = subsArr[0]
  let lang = ''

  if (subStream.tags) {
    lang = subStream.tags.language
  }

  const { originalLibraryFile } = otherArguments;

  let subsFile = '';

  // for Tdarr V2 (2.00.05+)
  if (originalLibraryFile && originalLibraryFile.file) {
    subsFile = originalLibraryFile.file;
  } else {
    // for Tdarr V1
    subsFile = file.file;
  }
  subsFile = subsFile.split('.');
  subsFile[subsFile.length - 2] += `.${lang}`;
  subsFile[subsFile.length - 1] = 'srt';
  subsFile = subsFile.join('.');

  let index = subStream.index
  let command = `${ffmpegPath} -i "${file.file}" -map 0:${index} "${subsFile}"`

  exec(command);

  response = {
    processFile: true,
    preset: `, -map 0 -map -0:${index} -c copy`,
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "Found sub to extract!",
  };

  return response;
};


module.exports.details = details;
module.exports.plugin = plugin;