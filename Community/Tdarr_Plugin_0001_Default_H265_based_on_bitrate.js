function details() {
  return {
    id: 'Tdarr_Plugin_0001_Default_H265_based_on_bitrate',
    Stage: 'Pre-processing',
    Name: 'In House - To H265 based on bitrate',
    Type: 'Video',
    Operation: 'Transcode',
    Description: `In-house plugin. Transcode based on video bitrate into h265 MP4 using FFmpeg. Different bitrate targets for different resolutions. Option to ignore transcoding files already in h265. MP4 is used as FFmpeg correctly tags the video stream bitrate which this plugin depends on. \n\n`,
    Version: '1',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_0001_Default_H265_based_on_bitrate.js',
    Tags: 'pre-processing,ffmpeg,video only,configurable,h265',
    Inputs: [
    //   {
    //     name: 'container',
    //     tooltip: `Specify output container of file, ensure that all stream types you may have are supported by your chosen container. mkv is recommended.
	  //  \\nExample:\\n
	  //  mkv

	  //  \\nExample:\\n
	  //  mp4`


    //   },
      {
        name: 'ignore_h265',
        tooltip: `Set as true to ignore files which are already in h265 else leave empty. If true is not set, then files in h265 which are above the target bitrates will be transcoded.
	   \\nExample:\\n
	   true
     
     `


      },
    ]
  }
}

function plugin(file, librarySettings, inputs) {
  var response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: ''
  }

  console.dir(inputs)
  

  if(inputs == undefined){
    throw '☒Plugin has not been configured in plugin stack. \n'
  }


  // Check what output container should be

  // if (inputs.container == '') {
  //   throw '☒Container has not been configured within plugin settings, please configure required options. Skipping this plugin. \n'
  // } else {
  //   response.container = '.' + inputs.container
  // }

  inputs.container = 'mp4'
  response.container = '.' + inputs.container


  //Check if file has been tagged as a video

  if (file.fileMedium !== 'video') {
    response.processFile = false
    response.infoLog += '☒File is not a video. \n'
    return response
  }


  //Check if plugin should transcode files already in h265

  if (inputs.ignore_h265 === 'true' && file.ffProbeData.streams[0].codec_name == 'hevc') {
    response.infoLog += '☒ File is already in h265 and configuration has been set to ignore files already in h265. Skipping. \n'
    response.processFile = false
    return response
  }



  //Check if video stream bitrate exists. If not, remux the file so FFmpeg will tag the bitrate

  console.log(`Stream 0 bitrate:`+file.ffProbeData.streams[0]['bit_rate'])

  if (file.ffProbeData.streams[0]['bit_rate'] == undefined) {

    response.infoLog += `☒No bitrate for video stream. Remuxing.\n`
    response.preset = ', -map 0:v -map 0:a -map 0:s? -map 0:d? -c copy '
    response.handBrakeMode = false
    response.FFmpegMode = true
    response.processFile = true
    response.container = '.mp4'
    return response

  }

  var bit_rate = parseFloat(file.ffProbeData.streams[0]['bit_rate'])


  // If the file is h264 then the target bitrate ONE will be set at 60% of source bitrate as h265 has approximately double the information density as h264
  //Using 60% to leave some wiggle room

  var targetBitrate_b1

  if (file.ffProbeData.streams[0].codec_name == 'h264') {
    targetBitrate_b1 = bit_rate * 0.6
  } else {
    targetBitrate_b1 = 'none'
  }

  //Set target bitrate TWO based on resolution, regardless of codec

  var targetBitrate_b2
  switch (file.video_resolution) {

    case '8KUHD':
      targetBitrate_b2 = 16000000
      break;
    case 'DCI4K':
      targetBitrate_b2 = 16000000
      break;
    case '4KUHD':
      targetBitrate_b2 = 16000000
      break;
    case '1080p':
      targetBitrate_b2 = 4000000
      break;
    case '720p':
      targetBitrate_b2 = 2000000
      break;
    case '576p':
      targetBitrate_b2 = 1000000
      break;
    case '480p':
      targetBitrate_b2 = 1000000
      break;

    case 'Other':
      targetBitrate_b2 = 4000000
      break;

    default:
      targetBitrate_b2 = 4000000

  }


  //Set final target bitrate based on which of bitrate ONE and TWO are lower

  //For example, a 1080p 40Mb/s h264 file would have the following target bitrates:
  //targetBitrate_b1 = (40*0.6) = 24Mb/s
  //targetBitrate_b2 = 4Mb/s
  //24Mb/s is still well above the preferred bitrate of 4Mb/s for 1080p, so we'll use targetBitrate_b2 = 4Mb/s

  //On the other hand, a 1080p 6Mb/s h264 file would have the following target bitrates:
  //targetBitrate_b1 = (6*0.6) = 3.6Mb/s
  //targetBitrate_b2 = 4Mb/s
  //In this case we want to make the most of h264 ---> h265 space savings so will go with targetBitrate_b1 = 3.6Mb/s

  var targetBitrate_b

  if (targetBitrate_b1 === 'none') {
    targetBitrate_b = targetBitrate_b2
  } else {
    if (targetBitrate_b1 < targetBitrate_b2) {
      targetBitrate_b = targetBitrate_b1
    } else {
      targetBitrate_b = targetBitrate_b2
    }
  }



  bit_rate = parseInt(bit_rate)
  targetBitrate_b = parseInt(targetBitrate_b)

  //Check if bitrate is valid or not

  if (isNaN(bit_rate) || bit_rate == '0') {
    response.processFile = false
    response.infoLog += `☒Bitrate could not be calculated (${bit_rate}). Skipping this plugin. \n`
    return response

  } else if (bit_rate < targetBitrate_b && file.ffProbeData.streams[0].codec_name == 'hevc') {

    //check if file is in correct container

    if (inputs.container != file.container) {
      response.infoLog += `☒Wrong container. Remuxing.\n`
      response.preset = ', -map 0:v -map 0:a -map 0:s? -map 0:d? -c copy '
      response.handBrakeMode = false
      response.FFmpegMode = true
      response.processFile = true
      response.container = '.' + inputs.container
      return response

    } else {
      response.processFile = false
      response.infoLog += `☑File ${(bit_rate / 1000000).toPrecision(4)}Mbs is already under ${(targetBitrate_b / 1000000).toPrecision(4)}Mbs and in h265. \n`
      return response
    }

  } else {


    //HandBrake example
    //response.preset += ` -e x265 --vb ${(targetBitrate_b / 1000) - 50} --pfr 30 --align-av --optimize --all-subtitles --all-audio -E copy --audio-fallback ca_aac --audio-copy-mask aac,ac3,eac3,truehd,dts,dtshd,mp3,flac`

    //FFmpeg example
    response.preset += `, -map 0:v -map 0:a -map 0:s? -map 0:d? -c copy -c:v:0 libx265 -b:v ${(targetBitrate_b / 1000) - 50}k -maxrate ${(targetBitrate_b / 1000) - 50}k -bufsize 1M `
    response.processFile = true
    response.infoLog += `☒File ${(bit_rate/1000000).toPrecision(4)}Mbs is above bitrate ${(targetBitrate_b/1000000).toPrecision(4)}Mbs. Transcoding. \n`
    return response

  }




}

module.exports.details = details;
module.exports.plugin = plugin;
