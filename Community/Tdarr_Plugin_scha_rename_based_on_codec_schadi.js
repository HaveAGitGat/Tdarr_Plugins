/* eslint-disable max-len */

// tdarrSkipTest
const details = () => ({
  id: 'Tdarr_Plugin_scha_rename_based_on_codec_schadi',
  Stage: 'Post-processing',
  Name: 'Rename Based On Codec Video And Audio',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
    If the filename contains a codec information like h264, av1 or similar for video and AC3, AAC or trueHD \n\n
    the plugin will read the codec info from the file and rename it accordingly. \n\n
    It also takes care off addiotnal files deffined in the input Option.\n\n`,
  Version: '1.00',
  Tags: 'post-processing',
  Inputs: [
    {
      name: 'rename_audio',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will Rename According to Audio Codec after x264 or x265.
                   \\nExample:\\n
                   true
                   \\nExample:\\n
                   false`,
    },
    {
      name: 'rename_video',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
      tooltip: `Will Rename According to Video Codec after x264 or x265.
                   \\nExample:\\n
                   true
                   \\nExample:\\n
                   false`,
    },
    {
      name: 'additional_extensions',
      type: 'string',
      defaultValue: '.nfo,.srt',
      inputUI: {
        type: 'text',
      },
      tooltip: `Additional file extensions to rename (comma-separated).
                   \\nExample:\\n
                   .nfo,.srt`,
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  const fs = require('fs');
  const path = require('path');

  const fileNameOld = file._id;

  const response = {
    file,
    removeFromDB: false,
    updateDB: true,
    infoLog: '',
    processFile: false,
  };

  const codecMap = {
    aac: 'AAC',
    ac3: 'AC3',
    av1: 'AV1',
    avc: 'h264',
    dts: 'DTS',
    eac3: 'EAC3',
    flac: 'FLAC',
    hevc: 'h265',
    mp2: 'MP2',
    mp3: 'MP3',
    mpeg2: 'MPEG2',
    truehd: 'TrueHD',
    x264: 'h264',
    x265: 'h265',
    h264: 'h264',
    h265: 'h265',
    // dts: 'DTS-X',
    'dts-hd ma': 'DTS-HD MA',
    'dts-es': 'DTS-HD ES',
    'dts-hd hra': 'DTS-HD HRA',
    'dts express ': 'DTS Express',
    'dts 96/24': 'DTS',
  };

  let firstVideoStreamCodec;
  let firstAudioStreamCodec;

  const videoCodecRegex = /(h264|h265|x264|x265|avc|hevc|mpeg2|av1)/gi;
  const audioCodecRegex = /(aac|ac3|eac3|flac|mp2|mp3|truehd|dts[-. ]hd[-. ]ma|dts[-. ]hd[-. ]es|dts[-. ]hd[-. ]hra|dts[-. ]express|dts)/gi;

  const videoStream = file.ffProbeData.streams.find((stream) => stream.codec_type === 'video');

  if (videoStream && inputs.rename_video) {
    const videoCodec = videoStream.codec_name.toLowerCase();
    firstVideoStreamCodec = videoCodec;

    if (videoCodec in codecMap) {
      const renamedCodec = codecMap[videoCodec];
      // eslint-disable-next-line no-param-reassign
      file._id = file._id.replace(videoCodecRegex, renamedCodec);
      // eslint-disable-next-line no-param-reassign
      file.file = file.file.replace(videoCodecRegex, renamedCodec);
    }
  }

  const audioStream = file.ffProbeData.streams.find((stream) => stream.codec_type === 'audio');

  if (audioStream && inputs.rename_audio) {
    const audioCodec = audioStream.codec_name.toLowerCase();
    firstAudioStreamCodec = audioCodec;

    if (audioCodec in codecMap) {
      const renamedCodec = codecMap[audioCodec];
      // eslint-disable-next-line no-param-reassign
      file._id = file._id.replace(audioCodecRegex, renamedCodec);
      // eslint-disable-next-line no-param-reassign
      file.file = file.file.replace(audioCodecRegex, renamedCodec);
    }
  }

  let additionalFilesCount = 0; // Counter for additional files found

  if ((audioStream && inputs.rename_audio) || (videoStream && inputs.rename_video)) {
    const filename = path.basename(fileNameOld);
    const JustName = path.parse(filename).name;
    const popJustnamen = JustName.split('.');
    popJustnamen.splice(popJustnamen.length - 5);
    const modJustname = popJustnamen.join('.');

    const fileDir = path.dirname(fileNameOld);
    const directoryPath = fileDir;

    const additionalExtensions = inputs.additional_extensions.split(',');

    const fileList = []; // Array to store the file names
    const files = fs.readdirSync(directoryPath);

    files.forEach((supportFile) => {
      fileList.push(supportFile); // Add all files to the fileList array
    });

    const extensionList = additionalExtensions.map((extension) => extension.trim()); // Remove leading/trailing spaces from extensions
    const regex = new RegExp(`(${extensionList.join('|')})$`, 'i');

    files.forEach((supportFile) => {
      if (supportFile.startsWith(modJustname) && regex.test(supportFile)) {
        const renamedFileWithVideoCodec = supportFile.replace(videoCodecRegex, codecMap[firstVideoStreamCodec]);
        const renamedFileWithBothCodecs = renamedFileWithVideoCodec.replace(audioCodecRegex, codecMap[firstAudioStreamCodec]);

        fs.renameSync(`${directoryPath}/${supportFile}`, `${directoryPath}/${renamedFileWithBothCodecs}`, {
          overwrite: true,
        });

        response.infoLog += `${directoryPath}/${supportFile} renamed to ${directoryPath}/${renamedFileWithBothCodecs}\n`;
        additionalFilesCount += 1; // Increment the count for each additional file found
      }
    });

  // const textFilePath = path.join(directoryPath, `${modJustname}.txt`);
  // fs.writeFileSync(textFilePath, fileList.filter(file => file.startsWith(modJustname) && regex.test(file)).join('\n'), 'utf-8');
  }

  if (fileNameOld !== file._id) {
    fs.renameSync(fileNameOld, file._id, {
      overwrite: true,
    });
    response.infoLog += `Renamed file to: ${file._id}\n`;
    if (additionalFilesCount > 0) {
      response.infoLog += `and: ${additionalFilesCount} additional Files!\n`;
    }
    return response;
  }

  response.infoLog += 'Video File not renamed!\n';
  if (additionalFilesCount > 0) {
    response.infoLog += `But: ${additionalFilesCount} additional Files!\n`;
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
