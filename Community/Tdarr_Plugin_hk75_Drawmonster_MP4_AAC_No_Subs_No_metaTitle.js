/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_hk75_Drawmonster_MP4_AAC_No_Subs_No_metaTitle",
    Stage: "Pre-processing",
    Name: "Drawmonster MP4 Stereo AAC, No Subs, No Title Meta Data",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin removes subs, metadata (if a title exists) and adds a stereo 192kbit AAC track if an AAC track (English or any) doesn't exist. The output container is mp4. \n\n
`,
    Version: "1.07",
    Tags: "pre-processing,ffmpeg",
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

    response.infoLog += "☒File is not video \n";
    response.processFile = false;

    return response;
  } else {
    var hasPreferredLangTrack = false;
    var hasPreferredLangInRequiredCodecs = false;
    var hasAnyInRequiredCodecs = false;

    var audioIdx = -1;
    var engTrackIdx = -1;

    var requiredAudioCodecs = "aac";
    var preferredLangTrack = "eng";
    var preferredCodec = "aac";

    var hasSubs = false;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle"
        ) {
          hasSubs = true;
        }
      } catch (err) {}

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
      response.preset = `,-map 0:v -map 0:a:${engTrackIdx} -map 0:a -c copy -c:a:0 ${preferredCodec} -b:a:0 192k -ac 2 -strict -2`;
      response.container = ".mp4";
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
        response.preset = `,-map 0:v -map 0:a:0 -map 0:a -c copy -c:a:0 ${preferredCodec} -b:a:0 192k -ac 2 -strict -2`;
        response.container = ".mp4";
        response.handBrakeMode = false;
        response.FFmpegMode = true;
        response.reQueueAfter = true;
        response.infoLog += `☒File has no language track in ${requiredAudioCodecs}. No ${preferredLangTrack} track marked so transcoding audio track 1 into ${preferredCodec}! \n`;
        return response;
      }
    }

    if (file.meta.Title != "undefined" && hasSubs) {
      response.infoLog += "☒File has title and has subs \n";
      response.preset = ",-sn -map_metadata -1 -c:v copy -c:a copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    }

    ///
    if (file.meta.Title != undefined) {
      response.infoLog += "☒File has title metadata \n";
      response.preset = ",-map_metadata -1 -c:v copy -c:a copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has no title metadata \n";
    }

    if (hasSubs) {
      response.infoLog += "☒File has subs \n";
      response.preset = ",-sn -c:v copy -c:a copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has no subs \n";
    }

    if (file.container != "mp4") {
      response.infoLog += "☒File is not in mp4 container! \n";
      response.preset = ", -c:v copy -c:a copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File is in mp4 container! \n";
    }

    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;
