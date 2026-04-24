/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () => ({
  id: 'Tdarr_Plugin_MC93_Migz6OrderStreams',
  Stage: 'Pre-processing',
  Name: 'Migz Order Streams',
  Type: 'Any',
  Operation: 'Transcode',
  Description: 'Orders streams into Video first, then Audio (2ch, 6ch, 8ch) and finally Subtitles. \n\n',
  Version: '1.3',
  Tags: 'pre-processing,ffmpeg,',
  Inputs: [],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: '',
  };

  // Set up required variables.
  let ffmpegCommandInsert = '';
  let audioIdx = 0;
  let audio6Idx = 0;
  let audio8Idx = 0;
  let subtitleIdx = 0;
  let convert = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is video.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
        // Check if audioIdx or subtitleIdx do NOT equal 0
        //  If so then it means a audio or subtitle track has already appeared before the video track
        // So file needs to be organized.
        if (audioIdx !== 0 || subtitleIdx !== 0) {
          convert = true;
          response.infoLog += '☒ Video not first. \n';
        }
      }

      // Check if stream is audio.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        // Check if subtitleIdx does NOT equal 0.
        // If so then it means a subtitle track has already appeared before an audio track
        // So file needs to be organized.
        if (subtitleIdx !== 0) {
          convert = true;
          response.infoLog += '☒ Audio not second. \n';
        }
        // Increment audioIdx.
        audioIdx += 1;

        // Check if audio track is 2 channel.
        if (file.ffProbeData.streams[i].channels === 2) {
          // Check if audio6Idx or audio8Idx do NOT equal 0.
          // If so then it means a 6 or 8 channel audio track has already appeared before the 2 channel audio track
          // So file needs to be organized.
          if (audio6Idx !== 0 || audio8Idx !== 0) {
            convert = true;
            response.infoLog += '☒ Audio 2ch not first. \n';
          }
        }
        // Check if audio track is 6 channel.
        if (file.ffProbeData.streams[i].channels === 6) {
          // Check if audio8Idx does NOT equal 0.
          // If so then it means a 8 channel audio track has already appeared before the 6 channel audio track
          // So file needs to be organized.
          if (audio8Idx !== 0) {
            convert = true;
            response.infoLog += '☒ Audio 6ch not second. \n';
          }
          // Increment audio6Idx.
          audio6Idx += 1;
        }

        // Check if audio track is 8 channel.
        if (file.ffProbeData.streams[i].channels === 8) {
          // Increment audio8Idx.
          audio8Idx += 1;
        }
      }

      // Check if stream is subtitle.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
        // Increment subtitleIdx
        subtitleIdx += 1;
      }
    } catch (err) {
    // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is video AND is not a mjpeg.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video'
        && file.ffProbeData.streams[i].codec_name.toLowerCase() !== 'mjpeg'
      ) {
        ffmpegCommandInsert += `-map 0:${i} `;
      }
    } catch (err) {
    // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 2 channel.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
        && file.ffProbeData.streams[i].channels === 2
      ) {
        ffmpegCommandInsert += `-map 0:${i} `;
      }
    } catch (err) {
    // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 6 channel.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
        && file.ffProbeData.streams[i].channels === 6
      ) {
        ffmpegCommandInsert += `-map 0:${i} `;
      }
    } catch (err) {
    // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 8 channel.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
        && file.ffProbeData.streams[i].channels === 8
      ) {
        ffmpegCommandInsert += `-map 0:${i} `;
      }
    } catch (err) {
    // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND not 2, 6 or 8 channel.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio'
        && file.ffProbeData.streams[i].channels !== 2
        && file.ffProbeData.streams[i].channels !== 6
        && file.ffProbeData.streams[i].channels !== 8
      ) {
        ffmpegCommandInsert += `-map 0:${i} `;
      }
    } catch (err) {
    // Error
    }
  }

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is subtitle.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
        ffmpegCommandInsert += `-map 0:${i} `;
      }
    } catch (err) {
    // Error
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `,${ffmpegCommandInsert} -c copy -max_muxing_queue_size 9999`;
    response.reQueueAfter = true;
    response.infoLog
      += '☒ Streams are out of order, reorganizing streams. Video, Audio, Subtitles. \n';
  } else {
    response.infoLog += '☑ Streams are in expected order. \n ';
    response.processFile = false;
  }
  return response;
};
module.exports.details = details;
module.exports.plugin = plugin;
