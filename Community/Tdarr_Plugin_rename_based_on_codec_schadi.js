const loadDefaultValues = require('../methods/loadDefaultValues');
const fs = require('fs');

const details = () => {
  return {
    id: "Tdarr_Plugin_rename_based_on_codec_schadi",
    Stage: "Post-processing",
    Name: "Rename based on codec Video and Audio",
    Type: "Video_Audio",
    Operation: "Transcode",
    Description: `[Contains built-in filter] If the filename contains '264' or '265' or some other Codecs and also Audio codecs, this plugin renames 264 files to 265 or vice versa depending on the codec same for Audio. It also takes care off addiotnal files like deffined in the input Option.	\n\n`,
    Version: "1.00",
    Tags: "post-processing",
    Inputs:[
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
        type: 'text',
        defaultValue: '.nfo,.srt',
        tooltip: `Additional file extensions to rename (comma-separated).
                   \\nExample:\\n
                   .nfo,.srt`,
      },
    ],
  };
};

const plugin = (file, librarySettings, inputs, otherArguments) => {
  inputs = loadDefaultValues(inputs, details);
  const fileNameOld = file._id;

  const codecMap = {
    'aac': 'AAC',
    'ac3': 'AC3',
    'av1': 'AV1',
    'avc': 'h264',
    'dts': 'DTS',
    'eac3': 'EAC3',
    'flac': 'FLAC',
    'hevc': 'h265',
    'mp2': 'MP2',
    'mp3': 'MP3',
    'mpeg2': 'MPEG2',
    'truehd': 'TrueHD',
    'x264': 'h264',
    'x265': 'h265',
    'h264': 'h264',
    'h265': 'h265',
    'dts': 'DTS-X',
    'dts-hd ma': 'DTS-HD MA',
    'dts-es': 'DTS-HD ES',
    'dts-hd hra': 'DTS-HD HRA',
    'dts express ': 'DTS Express',
    'dts 96/24': 'DTS',
  };

  var firstVideoStreamCodec;
  var firstAudioStreamCodec;

  const videoCodecRegex = /(h264|h265|x264|x265|avc|hevc|mpeg2|av1)/gi;
  const audioCodecRegex = /(aac|ac3|eac3|flac|mp2|mp3|truehd|dts[-. ]hd[-. ]ma|dts[-. ]hd[-. ]es|dts[-. ]hd[-. ]hra|dts[-. ]express|dts)/gi;

  const videoStream = file.ffProbeData.streams.find((stream) => stream.codec_type === 'video');

  if (videoStream && inputs.rename_video) {
    const videoCodec = videoStream.codec_name.toLowerCase();
	firstVideoStreamCodec = videoCodec;
	
    if (videoCodec in codecMap) {
      const renamedCodec = codecMap[videoCodec];
      file._id = file._id.replace(videoCodecRegex, renamedCodec);
      file.file = file.file.replace(videoCodecRegex, renamedCodec);
    }
  }

  const audioStream = file.ffProbeData.streams.find((stream) => stream.codec_type === 'audio');

  if (audioStream && inputs.rename_audio) {
    const audioCodec = audioStream.codec_name.toLowerCase();
	firstAudioStreamCodec = audioCodec;
	
    if (audioCodec in codecMap) {
      const renamedCodec = codecMap[audioCodec];
      file._id = file._id.replace(audioCodecRegex, renamedCodec);
      file.file = file.file.replace(audioCodecRegex, renamedCodec);
    }
  }

  var filename = fileNameOld.replace(/^.*[\\\/]/, '');
  var JustName = filename.split('.');
  JustName.pop();
  JustName = JustName.join('.').toString();

  const fileDir = fileNameOld.split('/');
  fileDir.pop();
  const directoryPath = fileDir.join('/');

  const additionalExtensions = inputs.additional_extensions
    .split(/[,;/]/)
    .map(extension => extension.trim())
    .filter(extension => extension !== '');

  additionalExtensions.forEach(extension => {
    const regex = new RegExp(`${JustName}.*${extension}`, 'i');
    const files = fs.readdirSync(directoryPath);

    files.forEach((supportFile) => {
      if (regex.test(supportFile)) {
        const renamedFile = supportFile.replace(regex, (match, p1, p2) => {
          const additionalFileName = match;
          const renamedVideoCodec = codecMap[firstVideoStreamCodec];
          const renamedAudioCodec = codecMap[firstAudioStreamCodec];

          const renamedFileWithCodecs = additionalFileName
            .replace(videoCodecRegex, renamedVideoCodec)
            .replace(audioCodecRegex, renamedAudioCodec);

          return renamedFileWithCodecs;
        });

        fs.renameSync(`${directoryPath}/${supportFile}`, `${directoryPath}/${renamedFile}`, {
          overwrite: true,
        });
      }
    });
  });

  if (fileNameOld !== file._id) {
    fs.renameSync(fileNameOld, file._id, {
      overwrite: true,
    });

    const response = {
      file,
      removeFromDB: false,
      updateDB: true,
    };

    return response;
  } else {
    return {
      processFile: true,
      infoLog: `Renamed file and associated files to: ${file._id}`,
    };
  }
};

module.exports.details = details;
module.exports.plugin = plugin;
