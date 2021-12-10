module.exports.dependencies = ['import-fresh'];

// eslint-disable-next-line import/no-extraneous-dependencies
const importFresh = require('import-fresh');

function details() {
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
    Inputs: [
      {
        name: 'codecsToInclude',
        defaultValue: 'flac,wav,ape,ogg,m4a,wma,opus',
        tooltip: `Codecs to exclude
               \\nExample:\\n
               flac,wav,ape,ogg,m4a,wma,opus`,
      },
    ],
  };
}

module.exports.details = details;

module.exports.plugin = function plugin(file, librarySettings, inputs) {
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

  const codecsToInclude = inputs.codecsToInclude || details().Inputs[0].defaultValue;

  const filterByCodecInclude = library.filters.filterByCodec(file, 'include', codecsToInclude);
  const filterByCodecExclude = library.filters.filterByCodec(file, 'exclude', 'mp3');
  const remuxContainer = library.actions.remuxContainer(file, 'mp3');

  response.infoLog += `${filterByCodecInclude.note} ${filterByCodecExclude.note}`;

  if ((filterByCodecInclude.outcome
    && filterByCodecExclude.outcome)
    || file.forceProcessing) {
    response.infoLog += remuxContainer.note;
    response.processFile = remuxContainer.processFile;
    return response;
  }
  response.infoLog += remuxContainer.note;
  return response;
};
