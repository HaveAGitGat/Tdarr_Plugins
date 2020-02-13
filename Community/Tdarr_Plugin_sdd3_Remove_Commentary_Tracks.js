

function details() {

  return {
    id: "Tdarr_Plugin_sdd3_Remove_Commentary_Tracks",
    Stage: "Pre-processing",
    Name: "Remove video commentary tracks",
    Type: "Video",
    Operation: "Remux",
    Description: `[Contains built-in filter] If commentary tracks are detected, they will be removed. \n\n`,
    Version: "1.00",
    Link: "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_sdd3_Remove_Commentary_Tracks.js",
    Tags: 'pre-processing,ffmpeg,audio only'
  };

}

function plugin(file) {


  // Must return this object

  var response = {

    processFile: false,
    preset: '',
    container: '.mp4',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: ''

  };

  if (file.fileMedium !== "video") {
    response.processFile = false;
    response.infoLog += "☒File is not a video! \n";
    return response;
  } else {
    response.infoLog += "☑File is a video! \n";
  }


  var audioIdx = -1;
  var hasCommentaryTrack = false;
  var ffmpegCommandInsert = "";


  for (var i = 0; i < file.ffProbeData.streams.length; i++) {

    // Keep track of audio streams for when removing commentary track
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        audioIdx++;
      }
    } catch (err) {
      console.error(JSON.stringify(err));
    }


    // Check if commentary track and passing audio stream number
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].tags.title.toLowerCase().includes("commentary")) {


        ffmpegCommandInsert += ` -map -0:a:${audioIdx}`;
        hasCommentaryTrack = true;

      }
    } catch (err) {
      console.error(JSON.stringify(err));
    }

  }

  if (hasCommentaryTrack === true) {

    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy`;
    response.container = '.' + file.container;
    response.handBrakeMode = false;
    response.FFmpegMode = true;
    response.reQueueAfter = true;
    response.infoLog += "☒File contains commentary tracks. Removing! \n";
    return response;

  } else {

    response.infoLog += "☑File doesn't contain commentary tracks! \n";

  }

  response.processFile = false;
  response.infoLog += "☑File meets conditions! \n";
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;

