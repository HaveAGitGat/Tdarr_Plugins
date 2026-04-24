/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_b38x_Nosirus_h265_aac_no_meta",
    Stage: "Pre-processing",
    Name: "Nosirus H265, AAC, No Meta, Subs Kept",
    Type: "Video",
    Operation: 'Transcode',
    Description: `[Contains built-in filter] If the file is not in h265 it will be trancoded into h265 with FFmpeg using the following command '-e x265 -q 22 --encoder-preset slow --all-audio --all-subtitles copy:aac -E fdk_aac -Q 4 -x aq-mode=3'. If no aac, aac track will be added. Subtitles are kept. Metadata is removed.\n\n
`,
    Version: "1.01",
    Tags: "pre-processing,ffmpeg,h265,",
    Inputs:[]
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
    
    const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  //Must return this object

  var response = {
    processFile: false,
    preset: "",
    container: ".mp4",
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: "",
  };

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  } else {
    if (file.ffProbeData.streams[0].codec_name != "hevc") {
      response.processFile = true;
      response.preset =
        ', -map 0 -c copy -c:v:0 libx265 -preset:v slow -pix_fmt yuv420p10le -x265-params "crf=22:aq-mode=3"';
      response.container = ".mkv";
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog += "☒File is not in hevc! \n";
      return response;
    } else {
      response.infoLog += "☑File is already in hevc! \n";
    }

    var audioIdx = -1;
    var ffmpegCommandInsert = "";
    var hasnonAACTrack = false;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
          audioIdx++;
        }
      } catch (err) {}

      try {
        if (
          file.ffProbeData.streams[i].codec_name !== "aac" &&
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio"
        ) {
          ffmpegCommandInsert += ` -c:a:${audioIdx} aac -vbr 4 `;
          hasnonAACTrack = true;
        }
      } catch (err) {}
    }

    var ffmpegCommand = `,-map 0 -c:v copy  -c:a copy ${ffmpegCommandInsert} -c:s copy -c:d copy`;

    if (hasnonAACTrack == true) {
      response.processFile = true;
      response.preset = ffmpegCommand;
      response.container = ".mkv";
      response.handBrakeMode = false;
      response.FFmpegMode = true;
      response.reQueueAfter = true;
      response.infoLog += "☒ File has audio which is not in aac! \n";
      return response;
    } else {
      response.infoLog += "☑ All audio streams are in aac! \n";
    }

    if (file.meta.Title != undefined) {
      response.infoLog += "☒File has title metadata \n";
      response.preset =
        ',-metadata title="" -metadata comment="" -map 0 -c copy';
      response.container = ".mkv";
      response.reQueueAfter = true;
      response.processFile = true;
      response.FFmpegMode = true;
      return response;
    } else {
      response.infoLog += "☑File has no title metadata \n";
    }

    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
