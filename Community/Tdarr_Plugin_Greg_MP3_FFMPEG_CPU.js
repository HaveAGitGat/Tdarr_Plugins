module.exports.dependencies = [
  'import-fresh',
];

const importFresh = require('import-fresh');

module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_Greg_MP3_FFMPEG_CPU',
    Description: '[Contains built-in filter] Convert an audio file to mp3, retaining ID3 tags, '
    + 'and at original bitrate up to 320k - from type of: "flac,wav,ape,ogg,m4a,wma,opus" ',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_Greg_MP3_FFMPEG_CPU.js',
    Name: 'Audio Transcode to MP3 using CPU and FFMPEG',
    Operation: 'Transcode',
    Tags: 'pre-processing,ffmpeg,audio only',
    Type: 'Audio',
    Stage: 'Pre-processing',
    Version: '0.0.1',
  };
};

module.exports.plugin = function plugin(file) {
  const library = importFresh('../methods/library.js');

  const response = {
    // 320K selected over 384k intentionally
    // https://en.m.wikipedia.org/wiki/MPEG-1#Part_3:_Audio
    preset: ', -map_metadata 0 -id3v2_version 3 -b:a 320k',
    container: '.mp3',
    handbrakeMode: false,
    ffmpegMode: true,
    processFile: false,
    reQueueAfter: true,
  };

  response.infoLog += `${library.filters.filterByCodec(file, 'include', 'flac,wav,ape,ogg,m4a,wma,opus').note}
  ${library.filters.filterByCodec(file, 'exclude', 'mp3').note}`;

  if ((library.filters.filterByCodec(file, 'include', 'flac,wav,ape,ogg,m4a,wma,opus').outcome
    && library.filters.filterByCodec(file, 'exclude', 'mp3').outcome)
    || file.forceProcessing) {
    response.infoLog += library.actions.remuxContainer(file, 'mp3').note;
    response.processFile = library.actions.remuxContainer(file, 'mp3').processFile;
    return response;
  }
  response.infoLog += library.actions.remuxContainer(file, 'mp3').note;
  return response;
};
