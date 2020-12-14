/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
function details() {
  return {
    id: 'Tdarr_Plugin_MC93_MigzImageRemoval',
    Stage: 'Pre-processing',
    Name: 'Migz-Remove image formats from file',
    Type: 'Video',
    Operation: 'Clean',
    Description: 'Identify any unwanted image formats in the file and remove those streams. MJPEG & PNG \n\n',
    Version: '1.3',
    Link:
      'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_MigzImageRemoval.js',
    Tags: 'pre-processing,ffmpeg,video only',
  };
}

function plugin(file, librarySettings) {
  const response = {
    processFile: false,
    preset: '',
    handBrakeMode: false,
    container: `.${file.container}`,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video. \n';
    return response;
  }

  // Set up required variables.
  let videoIdx = 0;
  let extraArguments = '';
  let convert = false;

  // Go through each stream in the file.
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    // Check if stream is video.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
      // Check if stream codec is mjpeg or png. Remove if so.
      if (
        file.ffProbeData.streams[i].codec_name === 'mjpeg'
        || file.ffProbeData.streams[i].codec_name === 'png'
      ) {
        convert = true;
        extraArguments += `-map -v:${videoIdx} `;
      }
      // Increment videoIdx.
      videoIdx += 1;
    }
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.preset += `,-map 0 -c copy -max_muxing_queue_size 9999 ${extraArguments}`;
    response.infoLog += '☒File has image format stream, removing. \n';
    response.processFile = true;
  } else {
    response.processFile = false;
    response.infoLog
      += "☑File doesn't contain any unwanted image format streams.\n";
  }
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
