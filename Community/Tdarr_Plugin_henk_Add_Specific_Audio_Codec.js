const details = () => ({
  id: 'Tdarr_Plugin_henk_Add_Specific_Audio_Codec',
  Stage: 'Pre-processing',
  Name: '[MKV ONLY] Transcode Given Codec To Other Given Codec And Keep Original',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'Re-encodes all audio tracks in a given codec to another given codec and keeps original.',
  Version: '1.01',
  Tags: 'post-processing,configurable',

  Inputs: [{
    name: 'input_codecs',
    type: 'string',
    defaultValue: 'dts',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Comma separated list of input codecs to be processed. Defaults to dts.'
      + '\\nExample:\\n'
      + 'dts,aac,ac3',
  }, {
    name: 'output_codec',
    type: 'string',
    defaultValue: 'ac3',
    inputUI: {
      type: 'text',
    },
    tooltip: 'FFMPEG encoder used for the output of the new tracks. Defaults to ac3.',
  }, {
    name: 'position_new_audio',
    type: 'string',
    defaultValue: 'after',
    inputUI: {
      type: 'dropdown',
      options: [
        'before',
        'after',
      ],
    },
    tooltip: 'Set the position of the new audio stream befor or after original',
  }, {
    name: 'bitrate',
    type: 'string',
    defaultValue: '128',
    inputUI: {
      type: 'text',
    },
    tooltip: 'Specifies the (stereo) bitrate for the new audio codec in kb. Defaults to 128. Only numbers.',
  }, {
    name: 'auto_adjust',
    type: 'string',
    defaultValue: 'true',
    inputUI: {
      type: 'text',
    },
    tooltip: '[true/false] Multi-channel audio requires a higher bitrate for the same quality, '
      + 'do you want the plugin to calculate this? (bitrate * (channels / 2))',
  }, {
    name: 'custom_bitrate_input',
    type: 'string',
    defaultValue: '',
    inputUI: {
      type: 'text',
    },
    tooltip: 'DIRECT ACCESS TO FFMPEG, USE WITH CAUTION. If filled, can be used for custom bitrate arguments.',
  }],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: ', -c copy -map 0:v ',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒File is not video \n';
    return response;
  }

  // Check if file is mkv. If it isn't then exit plugin.
  if (file.container !== 'mkv') {
    response.infoLog += '☒File is not mkv \n';
    return response;
  }

  let convertCount = 0;
  let streamCount = 0;
  let indexCount = 0;
  let killPlugin = false;
  const inputCodecs = inputs.input_codecs ? inputs.input_codecs.split(',') : ['dts'];

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const currStream = file.ffProbeData.streams[i];
    if (
      currStream.codec_type.toLowerCase() === 'audio'
      && currStream.codec_name === inputs.output_codec
      && currStream.tags
    ) {
      if (currStream.tags.COPYRIGHT === 'henk_asac' || currStream.tags.COPYRIGHT === '"henk_asac"') {
        killPlugin = true;
      }
    }
  }

  if (killPlugin) {
    response.infoLog
      += '☑File has already been processed by this plugin.\n';
    return response;
  }

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const currStream = file.ffProbeData.streams[i];
    if (currStream.codec_type.toLowerCase() === 'audio') {
      if (inputs.position_new_audio === 'after') {
        response.preset += ` -map 0:a:${indexCount}? -c:a:${streamCount} copy `;
        streamCount += 1;
      }

      if (inputCodecs.includes(currStream.codec_name.toLowerCase())) {
        convertCount += 1;
        let bitrate = `-b:a:${streamCount} `;
        if (inputs.custom_bitrate_input) {
          bitrate += inputs.custom_bitrate_input;
        } else if (inputs.bitrate) {
          bitrate += `${inputs.auto_adjust ? (inputs.bitrate * (currStream.channels / 2)) : inputs.bitrate}k`;
        } else {
          bitrate = '128k';
        }
        response.preset += ` -map 0:a:${indexCount}? -c:a:${streamCount} ${inputs.output_codec || 'ac3'} ${bitrate} `
          + `-metadata:s:a:${streamCount} title="" -metadata:s:a:${streamCount} copyright="henk_asac" `
          + `-disposition:a:${streamCount} 0`;
        streamCount += 1;
      }
      if (inputs.position_new_audio === 'before') {
        response.preset += ` -map 0:a:${indexCount}? -c:a:${streamCount} copy `;
        streamCount += 1;
      }
      indexCount += 1;
    }
  }

  if (convertCount > 0) {
    response.processFile = true;
    response.container = `.${file.container}`;
    response.reQueueAfter = true;
    response.preset += ' -map 0:s? ';
  } else {
    response.infoLog
      += '☑File doesn\'t contain audio tracks with the specified codec.\n';
  }
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
