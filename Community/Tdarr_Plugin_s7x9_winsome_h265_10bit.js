/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_s7x9_winsome_h265_10bit",
    Stage: "Pre-processing",
    Name: "Winsome H265 10 Bit",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin transcodes all videos to h265 10 bit (if not in h265 already) and remuxes if not in mkv. If the English language track is not in AC3,EAC3 or DTS then an AC3 track is added.\n\n
`,
    Version: "1.00",
    Tags: "pre-processing,handbrake,ffmpeg,h265",
    Inputs:[],
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

  response.FFmpegMode = true;

  if (file.fileMedium !== "video") {
    console.log("File is not video");

    response.infoLog += "☒File is not video";
    response.processFile = false;

    return response;
  } else {
    var jsonString = JSON.stringify(file);
    response.container = ".mkv";

    if (file.ffProbeData.streams[0].codec_name == "hevc") {
      var hasPreferredLangTrack = false;
      var hasPreferredLangInRequiredCodecs = false;
      var hasAnyInRequiredCodecs = false;

      var audioIdx = -1;
      var engTrackIdx = -1;

      var requiredAudioCodecs = "ac3,eac3,dts";
      var preferredLangTrack = "eng";
      var preferredCodec = "ac3";

      for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
          if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
            audioIdx++;
          }
        } catch (err) {}

        try {
          if (
            requiredAudioCodecs.includes(file.ffProbeData.streams[i].codec_name)
          ) {
            hasAnyInRequiredCodecs = true;
          }
        } catch (err) {}

        try {
          if (
            requiredAudioCodecs.includes(
              file.ffProbeData.streams[i].codec_name
            ) &&
            file.ffProbeData.streams[i].tags.language
              .toLowerCase()
              .includes(preferredLangTrack)
          ) {
            hasPreferredLangInRequiredCodecs = true;
          }
        } catch (err) {}

        try {
          if (
            file.ffProbeData.streams[i].tags.language
              .toLowerCase()
              .includes(preferredLangTrack) &&
            file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio"
          ) {
            hasPreferredLangTrack = true;
            engTrackIdx = audioIdx;
          }
        } catch (err) {}
      }

      if (hasPreferredLangInRequiredCodecs) {
        response.infoLog += `☑File already has ${preferredLangTrack} language track in ${requiredAudioCodecs}! \n`;
      } else if (hasPreferredLangTrack) {
        response.processFile = true;
        response.preset = `,-map 0:v -map 0:a:${engTrackIdx} -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ${preferredCodec} -b:a:0 192k -ac 2`;
        response.container = ".mkv";
        response.handBrakeMode = false;
        response.FFmpegMode = true;
        response.reQueueAfter = true;
        response.infoLog += `☒File has ${preferredLangTrack} language track but not in ${requiredAudioCodecs}! \n`;
        return response;
      } else if (!hasAnyInRequiredCodecs) {
        if (audioIdx == -1) {
          response.infoLog += `☒File does not have any audio streams. Can't create ${preferredCodec} track. \n`;
        } else {
          response.processFile = true;
          response.preset = `,-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ${preferredCodec} -b:a:0 192k -ac 2`;
          response.container = ".mkv";
          response.handBrakeMode = false;
          response.FFmpegMode = true;
          response.reQueueAfter = true;
          response.infoLog += `☒File has no language track in ${requiredAudioCodecs}. No ${preferredLangTrack} track marked so transcoding audio track 1 into ${preferredCodec}! \n`;
          return response;
        }
      }

      if (file.container != "mkv") {
        response.processFile = true;
        response.preset = ", -map 0 -c copy";
        response.container = ".mkv";
        response.handBrakeMode = false;
        response.FFmpegMode = true;
        response.reQueueAfter = true;
        response.infoLog += "☒File is not in mkv container! \n";
        return response;
      } else {
        response.infoLog += "☑File is in mkv container! \n";
      }

      response.processFile = false;
      return response;
    } else {
      response.processFile = true;
      response.preset =
        '-Z "H.265 MKV 2160p60" -e x265_10bit --all-audio --all-subtitles';
      response.container = ".mkv";
      response.handBrakeMode = true;
      response.FFmpegMode = false;
      response.reQueueAfter = true;
      response.infoLog += "☒File isn't in hevc! \n";
      return response;
    }
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
