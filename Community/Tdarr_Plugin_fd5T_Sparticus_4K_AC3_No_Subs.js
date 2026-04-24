/* eslint-disable */
const details = () => {
  return {
    id: "Tdarr_Plugin_fd5T_Sparticus_4K_AC3_No_Subs",
    Stage: "Pre-processing",
    Name: "Sparticus 4K +AC3 No Subs Original Container",
    Type: "Video",
    Operation: "Transcode",
    Description: `[Contains built-in filter] This plugin for 4K video removes subs. If no AC3 track exists, it adds one (max 5.1 channels). If only an AC3 commentary track exists, it adds a new AC3 main track (max 5.1 channels). The output container is the same as the original file. \n\n`,
    Version: "1.04",
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

  response.container = "." + file.container;
  response.FFmpegMode = true;

  if (file.fileMedium !== "video" || file.video_resolution !== "4KUHD") {
    console.log("File is not a 4K video");

    response.infoLog += "☒File is not a 4K video \n";
    response.processFile = false;

    return response;
  } else {
    var ac3TrackCount = 0;
    var AC3CommentaryCount = 0;

    var hasSubs = false;

    var commentaryStreamIdx = false;
    var audioIdx = -1;

    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
      //keep track of audio streams for when removing commentary track
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
          audioIdx++;
        }
      } catch (err) {}

      //check if commentary track and assing audio stream number
      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
          file.ffProbeData.streams[i].tags.title
            .toLowerCase()
            .includes("commentary")
        ) {
          commentaryStreamIdx = audioIdx;
        }
      } catch (err) {}

      //check if commentary AC3 track
      try {
        if (
          file.ffProbeData.streams[i].codec_name.toLowerCase() == "ac3" &&
          file.ffProbeData.streams[i].tags.title
            .toLowerCase()
            .includes("commentary")
        ) {
          AC3CommentaryCount++;
        }
      } catch (err) {}

      //check if AC3 track
      try {
        if (file.ffProbeData.streams[i].codec_name.toLowerCase() == "ac3") {
          ac3TrackCount++;
        }
      } catch (err) {}

      //check if subs track
      try {
        if (
          file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle"
        ) {
          hasSubs = true;
        }
      } catch (err) {}
    }

    var hasOnlyAC3TrackCommentaries;

    if (ac3TrackCount > 0 && AC3CommentaryCount == ac3TrackCount) {
      hasOnlyAC3TrackCommentaries = true;
    } else {
      hasOnlyAC3TrackCommentaries = false;
    }

    var hasNoAC3Track;

    if (ac3TrackCount == 0) {
      hasNoAC3Track = true;
    } else {
      hasNoAC3Track = false;
    }

    //max 5.1 audio in AC3 output
    var channels = file.ffProbeData.streams[1].channels;
    if (channels > 6) {
      channels = 6;
    }

    if (hasOnlyAC3TrackCommentaries && hasSubs) {
      response.infoLog +=
        "☒File has no AC3 main track (has AC3 commentary) and has subs \n";
      response.preset =
        ",-sn -map 0:v -map 0:a:0 -map 0:a -map 0:d? -c copy -c:a:0 ac3 -ac " +
        channels;
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    }

    if (hasNoAC3Track && hasSubs) {
      response.infoLog += "☒File has no AC3 main track and has subs \n";
      response.preset =
        ",-sn -map 0:v -map 0:a:0 -map 0:a -map 0:d? -c copy -c:a:0 ac3 -ac " +
        channels;
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    }

    if (commentaryStreamIdx !== false) {
      response.infoLog += `☒File has AC3 commentary track in stream ${commentaryStreamIdx} \n`;
      response.preset = `,-map 0 -map -0:a:${commentaryStreamIdx} -codec copy`;
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    }

    if (!!hasOnlyAC3TrackCommentaries == true) {
      response.infoLog +=
        "☒File has no AC3 main track (has AC3 commentary)! \n";
      response.preset =
        ",-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ac3 -ac " +
        channels;
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File does not have only AC3 track commentaries! \n";
    }

    if (hasNoAC3Track) {
      response.infoLog += "☒File has no AC3 track! \n";
      response.preset =
        ",-map 0:v -map 0:a:0 -map 0:a -map 0:s? -map 0:d? -c copy -c:a:0 ac3 -ac " +
        channels;
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has AC3 track! \n";
    }

    if (hasSubs) {
      response.infoLog += "☒File has subs! \n";
      response.preset = ",-sn -map 0 -c copy";
      response.reQueueAfter = true;
      response.processFile = true;
      return response;
    } else {
      response.infoLog += "☑File has no subs \n";
    }

    response.infoLog += "☑File meets conditions! \n";
    return response;
  }
}

module.exports.details = details;
module.exports.plugin = plugin;

//Test data

// file.ffProbeData = { streams:
//   [ { index: 0,
//       codec_name: 'h264',
//       codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
//       profile: 'High',
//       codec_type: 'video',
//       codec_time_base: '1001/48000',
//       codec_tag_string: '[0][0][0][0]',
//       codec_tag: '0x0000',
//       width: 1280,
//       height: 720,
//       coded_width: 1280,
//       coded_height: 720,
//       has_b_frames: 2,
//       sample_aspect_ratio: '1:1',
//       display_aspect_ratio: '16:9',
//       pix_fmt: 'yuv420p',
//       level: 41,
//       chroma_location: 'left',
//       refs: 1,
//       is_avc: 'true',
//       nal_length_size: '4',
//       r_frame_rate: '24000/1001',
//       avg_frame_rate: '24000/1001',
//       time_base: '1/1000',
//       start_pts: 0,
//       start_time: '0.000000',
//       bits_per_raw_sample: '8',
//       disposition:
//        { default: 1,
//          dub: 0,
//          original: 0,
//          comment: 0,
//          lyrics: 0,
//          karaoke: 0,
//          forced: 0,
//          hearing_impaired: 0,
//          visual_impaired: 0,
//          clean_effects: 0,
//          attached_pic: 0 },
//       tags: { language: 'eng' } },
//     { index: 1,
//       codec_name: 'ac3',
//       codec_long_name: 'ATSC A/52A (AC-3)',
//       codec_type: 'audio',
//       codec_time_base: '1/48000',
//       codec_tag_string: '[0][0][0][0]',
//       codec_tag: '0x0000',
//       sample_fmt: 'fltp',
//       sample_rate: '48000',
//       channels: 6,
//       channel_layout: '5.1(side)',
//       bits_per_sample: 0,
//       dmix_mode: '-1',
//       ltrt_cmixlev: '-1.000000',
//       ltrt_surmixlev: '-1.000000',
//       loro_cmixlev: '-1.000000',
//       loro_surmixlev: '-1.000000',
//       r_frame_rate: '0/0',
//       avg_frame_rate: '0/0',
//       time_base: '1/1000',
//       start_pts: 0,
//       start_time: '0.000000',
//       bit_rate: '640000',
//       disposition:
//        { default: 1,
//          dub: 0,
//          original: 0,
//          comment: 0,
//          lyrics: 0,
//          karaoke: 0,
//          forced: 0,
//          hearing_impaired: 0,
//          visual_impaired: 0,
//          clean_effects: 0,
//          attached_pic: 0 },
//       tags: { language: 'eng', title: 'commentary' } },
//     { index: 2,
//       codec_name: 'aac',
//       codec_long_name: 'AAC (Advanced Audio Coding)',
//       profile: 'HE-AAC',
//       codec_type: 'audio',
//       codec_time_base: '1/48000',
//       codec_tag_string: '[0][0][0][0]',
//       codec_tag: '0x0000',
//       sample_fmt: 'fltp',
//       sample_rate: '48000',
//       channels: 2,
//       channel_layout: 'stereo',
//       bits_per_sample: 0,
//       r_frame_rate: '0/0',
//       avg_frame_rate: '0/0',
//       time_base: '1/1000',
//       start_pts: 31,
//       start_time: '0.031000',
//       disposition:
//        { default: 0,
//          dub: 0,
//          original: 0,
//          comment: 0,
//          lyrics: 0,
//          karaoke: 0,
//          forced: 0,
//          hearing_impaired: 0,
//          visual_impaired: 0,
//          clean_effects: 0,
//          attached_pic: 0 },
//       tags: { language: 'eng' } },
//     { index: 3,
//       codec_name: 'subrip',
//       codec_long_name: 'SubRip subtitle',
//       codec_type: 'subtitle',
//       codec_time_base: '1/1000',
//       codec_tag_string: '[0][0][0][0]',
//       codec_tag: '0x0000',
//       r_frame_rate: '0/0',
//       avg_frame_rate: '0/0',
//       time_base: '1/1000',
//       start_pts: 0,
//       start_time: '0.000000',
//       duration_ts: 3601536,
//       duration: '3601.536000',
//       disposition:
//        { default: 0,
//          dub: 0,
//          original: 0,
//          comment: 0,
//          lyrics: 0,
//          karaoke: 0,
//          forced: 0,
//          hearing_impaired: 0,
//          visual_impaired: 0,
//          clean_effects: 0,
//          attached_pic: 0 },
//       tags: { language: 'eng' } },
//     { index: 4,
//       codec_name: 'subrip',
//       codec_long_name: 'SubRip subtitle',
//       codec_type: 'subtitle',
//       codec_time_base: '1/1000',
//       codec_tag_string: '[0][0][0][0]',
//       codec_tag: '0x0000',
//       r_frame_rate: '0/0',
//       avg_frame_rate: '0/0',
//       time_base: '1/1000',
//       start_pts: 0,
//       start_time: '0.000000',
//       duration_ts: 3601536,
//       duration: '3601.536000',
//       disposition:
//        { default: 0,
//          dub: 0,
//          original: 0,
//          comment: 0,
//          lyrics: 0,
//          karaoke: 0,
//          forced: 0,
//          hearing_impaired: 0,
//          visual_impaired: 0,
//          clean_effects: 0,
//          attached_pic: 0 },
//       tags: { language: 'eng', title: 'SDH' } } ],
//  format:
//   { filename:
//      '/storage/misc/downloads/Movie.mkv',
//     nb_streams: 5,
//     nb_programs: 0,
//     format_name: 'matroska,webm',
//     format_long_name: 'Matroska / WebM',
//     start_time: '0.000000',
//     duration: '3601.536000',
//     size: '4254332522',
//     bit_rate: '9450040',
//     probe_score: 100,
//     tags:
//      { encoder: 'libebml v1.3.0 + libmatroska v1.4.1',
//        creation_time: '2014-10-07 19:06:18' } } }
