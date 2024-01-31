/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_a9hd_FFMPEG_Transcode_Specific_Audio_Stream_Codecs",
    Stage: "Pre-processing",
    Name: "Transcode Specific Audio Stream Codecs",
    Type: "Audio",
    Operation: "Transcode",
    Description: `[Contains built-in filter] Transcode audio streams with specific codecs into another codec.  \n\n`,
    Version: "1.00",
    Tags: "pre-processing,audio only,ffmpeg,configurable",
    Inputs: [
      {
        name: "codecs_to_transcode_2channels",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specifiy the codecs which you'd like to transcode for audio tracks with 2 channels.
                \\nExample:\\n
                ac3
                \\nExample:\\n
                eac3,ac3,aac`,
      },
      {
        name: "codec_2channels",
        type: 'string',
        defaultValue: 'ac3',
        inputUI: {
          type: 'dropdown',
          options: [
            'aac'
            , 'ac3'
            , 'eac3'
            , 'dts'
            , 'flac'
            , 'mp2'
            , 'mp3'
            , 'truehd'
          ],
        },
        tooltip: `Specify the codec you'd like to transcode into for audio tracks with 2 channels. Will do nothing if codecs_to_transcode_2channels is empty.
                \\n aac
                \\n ac3
                \\n eac3
                \\n dts
                \\n flac
                \\n mp2
                \\n mp3
                \\n truehd
                \\nExample:\\n
                eac3`,
      },
      {
        name: "bitrate_2channels",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the transcoded audio bitrate (optional) for audio tracks with 2 channels:
                  \\n 384k
                  \\n 640k
                  \\nExample:\\n
                  640k`,
      },
      {
        name: "codecs_to_transcode_6channels",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specifiy the codecs which you'd like to transcode for audio tracks with 6 channels.
                \\nExample:\\n
                ac3
                \\nExample:\\n
                eac3,ac3,aac`,
      },
      {
        name: "codec_6channels",
        type: 'string',
        defaultValue: 'ac3',
        inputUI: {
          type: 'dropdown',
          options: [
            'aac'
            , 'ac3'
            , 'eac3'
            , 'dts'
            , 'flac'
            , 'mp2'
            , 'mp3'
            , 'truehd'
          ],
        },
        tooltip: `Specify the codec you'd like to transcode into for audio tracks with 6 channels. Will do nothing if codecs_to_transcode_6channels is empty.
                \\n aac
                \\n ac3
                \\n eac3
                \\n dts
                \\n flac
                \\n mp2
                \\n mp3
                \\n truehd
                \\nExample:\\n
                eac3`,
      },
      {
        name: "bitrate_6channels",
        type: 'string',
        defaultValue: '',
        inputUI: {
          type: 'text',
        },
        tooltip: `Specify the transcoded audio bitrate (optional) for audio tracks with 6 channels:
                  \\n 384k
                  \\n 640k
                  \\nExample:\\n
                  640k`,
      }
    ]
  };
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {

  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object

  var response = {
    processFile: false,
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "",
  };

  const resolveEncoder = (encoder) => encoder == "mp3" ? 'libmp3lame' : (encoder == "dts" ? 'dca' : encoder);
  const safeToLowerCase = (stringInput) => stringInput?.toLowerCase() || '';

  // Set up inputs
  const codecsToTranscode2Channels = safeToLowerCase(inputs.codecs_to_transcode_2channels).split(",");
  const codecsToTranscode6Channels = safeToLowerCase(inputs.codecs_to_transcode_6channels).split(",");
  const encoder2Channels = resolveEncoder(inputs.codec_2channels);
  const encoder6Channels = resolveEncoder(inputs.codec_6channels);
  const bitrate_2channels = safeToLowerCase(inputs.bitrate_2channels);
  const bitrate_6channels = safeToLowerCase(inputs.bitrate_6channels);

  // Set up variables
  let hasStreamsToTranscode = false;
  let ffmpegCommand = '';

  const fillTranscodeCommandForAudioTrack = (index, channels, codecsToTranscode, encoder, bitrate) => {
    let stream = file.ffProbeData.streams[index];
    if (stream.channels === channels && codecsToTranscode.includes(stream.codec_name?.toLowerCase() || '')) {
      ffmpegCommand += ` -c:${index} ${encoder} ${bitrate ? `-b:${index} ${bitrate} ` : ''}`;
      hasStreamsToTranscode = true;
      response.infoLog += `☒ Audio track ${index} has ${channels} channels and codec ${stream.codec_name}. It will be transcoded to ${encoder}. \n`;
    }
  };

  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (safeToLowerCase(file.ffProbeData.streams[i].codec_type) == "audio") {
      fillTranscodeCommandForAudioTrack(i, 2, codecsToTranscode2Channels, encoder2Channels, bitrate_2channels);
      fillTranscodeCommandForAudioTrack(i, 6, codecsToTranscode6Channels, encoder6Channels, bitrate_6channels);
    }
  }

  response.processFile = hasStreamsToTranscode;
  if (response.processFile)
    response.preset = `, -map 0 -c:v copy -c:a copy ${ffmpegCommand} -strict -2 -c:s copy -max_muxing_queue_size 9999 `;
  else
    response.infoLog += "☑ File does not have any streams that need to be transcoded! \n";
  return response;
};


module.exports.details = details;
module.exports.plugin = plugin;