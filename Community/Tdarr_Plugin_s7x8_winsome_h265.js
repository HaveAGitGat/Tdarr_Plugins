


function details() {

  return {
    id: "Tdarr_Plugin_s7x8_winsome_h265",
    Name: "Winsome H265 ",
    Type: "Video",
    Description: `This plugin transcodes all videos to h265. If the English language track is not in AC3,EAC3 or DTS then an AC3 track is added.\n\n
`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugin_s7x8_winsome_h265"
  }

}

function plugin(file) {


  //Must return this object

  var response = {

    processFile: false,
    preset: '',
    container: '.mp4',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',

  }


  response.FFmpegMode = true




  if (file.fileMedium !== "video") {


    console.log("File is not video")

    response.infoLog += " File is not video"
    response.processFile = false;

    return response

  } else {

    var jsonString = JSON.stringify(file)
    response.container = '.' + file.container


    if (file.ffProbeData.streams[0].codec_name == 'hevc') {


      var hasEngTrack = false


      // for (var i = 0; i < file.ffProbeData.streams.length; i++) {

      //   try {
      //     if ( (file.ffProbeData.streams[i].codec_name == "ac3" || file.ffProbeData.streams[i].codec_name == "eac3" ||  file.ffProbeData.streams[i].codec_name == "dts") && file.ffProbeData.streams[i].tags.language == 'eng') {

      //       hasEngTrack = true

      //     }
      //   } catch (err) {

      //    }
      // }

      try {
        if ((file.ffProbeData.streams[1].codec_name == "ac3" || file.ffProbeData.streams[1].codec_name == "eac3" || file.ffProbeData.streams[1].codec_name == "dts")) {

          hasEngTrack = true

        }
      } catch (err) {

      }


      if (hasEngTrack) {

        response.infoLog += " File is already hevc and has English language track in  AC3,EAC3 or DTS!"
        response.processFile = false;
        return response


      } else {

        response.infoLog += " File is already hevc and doesn't have English language track in AC3,EAC3 or DTS!"
        response.processFile = true;
        response.preset = ',-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ac3 -b:a:0 192k -ac 2'
        response.reQueueAfter = true;
        response.FFmpegMode = true
        return response




      }

    } else {



      response.infoLog += " File isn't in hevc!"
      response.processFile = true;
      response.preset = '-Z "H.265 MKV 2160p60"'
      response.reQueueAfter = true;
      response.handBrakeMode = true

      return response

    }








  }
}

module.exports.details = details;

module.exports.plugin = plugin;
