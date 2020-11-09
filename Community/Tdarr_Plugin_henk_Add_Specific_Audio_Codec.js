function details () {
  return {
    id: 'Tdarr_Plugin_henk_Add_Specific_Audio_Codec',
    Stage: 'Pre-processing',
    Name: '[TESTING][MKV ONLY] Transcode given codec to other given codec and keep original',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: `Re-encodes all audio tracks in a given codec to another given codec.`,
    Version: '1.00',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_henk_Add_Specific_Audio_Codec',
    Tags: 'post-processing,configurable',

    Inputs: [{
      name: 'input_codecs',
      tooltip: 'Comma separated list of input codecs to be processed. Defaults to dts.' +
        '\\nExample:\\n' +
        'dts,aac,ac3'
    }, {
      name: 'output_codec',
      tooltip: 'FFMPEG encoder used for the output of the new tracks. Defaults to ac3.'
    }, {
      name: 'bitrate',
      tooltip: `Specifies the (stereo) bitrate for the new audio codec. Defaults to 128k. Only numbers.`
    }, {
      name: 'auto_adjust',
      tooltip: '[true/false] Multi-channel audio requires a higher bitrate for the same quality, do you want the plugin to calculate this? (bitrate * (channels / 2))'
    }, {
      name: 'custom_bitrate_input',
      tooltip: 'DIRECT ACCESS TO FFMPEG, USE WITH CAUTION. If filled, can be used for custom bitrate arguments.'
    }],
  }
}

function plugin (file, librarySettings, inputs) {
  var response = {
    processFile: false,
    preset: ', -c copy -map 0:v ',
    container: '.' + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  }

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒File is not video \n'
    return response
  }

  // Check if file is mkv. If it isn't then exit plugin.
  if (file.container !== 'mkv') {
    response.infoLog += '☒File is not mkv \n'
    return response
  }

  var convertCount = 0
  var streamCount = 0
  var indexCount = 0
  var killPlugin = false
  var inputCodecs = inputs.input_codecs ? inputs.input_codecs.split(',') : ['dts']

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    var currStream = file.ffProbeData.streams[i]
    if (currStream.tags.COPYRIGHT) {
      if (currStream.tags.COPYRIGHT === 'henk_asac') {
        killPlugin = true
      }
    }
  }

  if (killPlugin) {
    response.infoLog +=
      `☑File has already been processed by this plugin.\n`
    return response
  }

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    var currStream = file.ffProbeData.streams[i]
    if (currStream.codec_type.toLowerCase() === 'audio') {
      response.preset += ` -map 0:a:${indexCount}? -c:a:${streamCount} copy `
      streamCount++

      if (inputCodecs.includes(currStream.codec_name.toLowerCase())) {
        convertCount++
        var bitrate = `-b:a:${streamCount} `
        if (inputs.custom_bitrate_input) {
          bitrate += inputs.custom_bitrate_input
        } else if (inputs.bitrate) {
          bitrate += inputs.auto_adjust ? (inputs.bitrate * (currStream.channels / 2)) + 'k' : inputs.bitrate + 'k'
        } else {
          bitrate = '128k'
        }
        response.preset += ` -map 0:a:${indexCount}? -c:a:${streamCount} ${inputs.output_codec || 'ac3'} ${bitrate} ` +
          `-metadata:s:a:${streamCount} title="" -metadata:s:a:${streamCount} copyright="henk_asac"`
      }
      indexCount++
    }
  }

  if (convertCount > 0) {
    response.processFile = true
    response.container = '.' + file.container
    response.reQueueAfter = true
  } else {
    response.infoLog +=
      '☑File doesn\'t contain audio tracks with the specified codec.\n'
  }
  return response
}

module.exports.details = details
module.exports.plugin = plugin