const details = () => ({
  id: 'Tdarr_Plugin_z3ab_TheRealShadoh_FFmpeg_Subs_H264_VeryFast',
  Stage: 'Pre-processing',
  Name:
      'TheRealShadoh FFmpeg Subs VeryFast, Video MP4, Audio AAC, Keep Subs',
  Type: 'Video',
  Operation: 'Transcode',
  Description: '[Contains built-in filter] This plugin transcodes into H264 using FFmpeg\'s \'VeryFast\' preset '
    + 'if the file is not in H264 already. It maintains all subtitles. It removes metadata (if a title exists), '
    + `and maintains all audio tracks. The output container is MP4. \n\n
`,
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,h264',
  Inputs: [],
});

// eslint-disable-next-line
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  // Must return this object

  const response = {
    processFile: false,
    preset: '',
    container: '.mp4',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') {
    // eslint-disable-next-line no-console
    console.log('File is not video');

    response.infoLog += '☒File is not video \n';
    response.processFile = false;

    return response;
  }
  const jsonString = JSON.stringify(file);

  let hasSubs = false;

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    try {
      const streamData = file.ffProbeData.streams[i];
      if (
        streamData.codec_type.toLowerCase() === 'subtitle'
          && streamData.codec_name !== 'mov_text'
      ) {
        hasSubs = true;
      }
    } catch (err) {
      // err
    }
  }

  if (file.ffProbeData.streams[0].codec_name !== 'h264') {
    response.infoLog += '☒File is not in h264! \n';
    response.preset = ', -map_metadata -1 -map 0:v -map 0:s? '
    + '-map 0:a -c:v libx264 -preset veryfast -c:a aac -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }
  response.infoLog += '☑File is already in h264! \n';

  ///

  if (
    file.meta.Title !== undefined
      && !jsonString.includes('aac')
      && hasSubs
  ) {
    response.infoLog += '☒File has title metadata and no aac and subs \n';
    response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v copy -c:a aac -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }

  if (!jsonString.includes('aac') && hasSubs) {
    response.infoLog += '☒File has no aac track and has subs \n';
    response.preset = ', -map 0:v -map 0:s? -map 0:a -c:v copy -c:a aac -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }

  if (file.meta.Title !== undefined && hasSubs) {
    response.infoLog += '☒File has title and has subs \n';
    response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v copy -c:a copy -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }

  ///
  if (file.meta.Title !== undefined) {
    response.infoLog += '☒File has title metadata \n';
    response.preset = ', -map_metadata -1 -map 0:v -map 0:s? -map 0:a -c:v copy -c:a copy -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }
  response.infoLog += '☑File has no title metadata \n';

  if (!jsonString.includes('aac')) {
    response.infoLog += '☒File has no aac track \n';
    response.preset = ', -map 0:v -map 0:s? -map 0:a -c:v copy -c:a aac -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }
  response.infoLog += '☑File has aac track \n';

  if (hasSubs) {
    response.infoLog += '☒File has incompatible subs \n';
    response.preset = ', -map 0:v -map 0:s? -map 0:a -c:v copy -c:a copy -c:s mov_text';
    response.reQueueAfter = true;
    response.processFile = true;
    response.FFmpegMode = true;
    return response;
  }
  response.infoLog += '☑File has no/compatible subs \n';

  response.infoLog += '☑File meets conditions! \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
