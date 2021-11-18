module.exports.dependencies = [
  'import-fresh',
];

module.exports.details = function details() {
  return {
    id: 'Tdarr_Plugin_Greg_MP3_FFMPEG_CPU',
    Name: 'Audio Transcode to MP3 using CPU and FFMPEG',
    Type: 'Audio',
    Operation: 'Transcode',
    Description: 'Convert an audio file to mp3, retaining ID3 tags, and at original bitrate up to 384K - from type of: "flac,wav,ape,ogg,m4a,wma,opus"',
    Version: '0.0.1',
    Link: 'https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_Greg_MP3_FFMPEG_CPU.js',
    Tags: 'pre-processing,ffmpeg,audio only,mp3',
  };
};

module.exports.plugin = function plugin(file) {
  const importFresh = require('import-fresh');
  const library = importFresh('../methods/library.js');

  // Must return this object at some point
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handbrakeMode: false,
    ffmpegMode: true,
    reQueueAfter: true,
    infoLog: '',

  };

  response.infoLog += `${library.filters.filterByCodec(file, 'include', 'flac,wav,ape,ogg,m4a,wma,opus').note}${library.filters.filterByCodec(file, 'exclude', 'mp3').note}`;

  if ((true && library.filters.filterByCodec(file, 'include', 'flac,wav,ape,ogg,m4a,wma,opus').outcome === true && library.filters.filterByCodec(file, 'exclude', 'mp3').outcome === true) || file.forceProcessing === true) {
    response.preset = ', -map_metadata 0 -id3v2_version 3 -b:a 384k';
    response.container = '.mp3';
    response.handbrakeMode = false;
    response.ffmpegMode = true;
    response.reQueueAfter = true;
    response.processFile = library.actions.remuxContainer(file, 'mp3').processFile;
    response.infoLog += library.actions.remuxContainer(file, 'mp3').note;
    return response;
  }
  response.processFile = false;
  response.infoLog += library.actions.remuxContainer(file, 'mp3').note;
  return response;
};
