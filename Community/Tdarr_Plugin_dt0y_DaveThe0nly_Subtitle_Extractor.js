const dispositionMap = {
  forced: 'forced',
  hearing_impaired: 'sdh',
};

const details = () => ({
  id: 'Tdarr_Plugin_dt0y_DaveThe0nly_Subtitle_Extractor',
  Stage: 'Pre-processing',
  Name: 'Extract Subtitles from video',
  Type: 'Video',
  Operation: 'Transcode',
  // eslint-disable-next-line max-len
  Description: '[Contains built-in filter] To remove subtitles from file and places it alongside it',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,subtitles',
  Inputs: [
    {
      name: 'extractSubtitles',
      type: 'string',
      defaultValue: 'eng,cs,cz',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Extracts subtitles by language from the file',
    },
    {
      name: 'subtitleFormat',
      type: 'string',
      defaultValue: 'srt,ass', // most compatible with plex
      inputUI: {
        type: 'text',
      },
      tooltip: 'Comma separated list of subtitle formats to create',
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();

  const {
    extractSubtitles: _extractSubtitles,
    subtitleFormat: _subtitleFormat,
  } = lib.loadDefaultValues(inputs, details);

  const extractSubtitles = _extractSubtitles.split(',');
  const subtitleFormat = _subtitleFormat.split(',');

  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: '',
    reQueueAfter: false,
  };

  const { originalLibraryFile } = otherArguments;

  const fileName = originalLibraryFile && originalLibraryFile.file ? originalLibraryFile.file : file.file;

  // subtitles
  const totalSubtitles = file.ffProbeData.streams.filter((row) => row.codec_type === 'subtitle');
  const hasSubtitles = totalSubtitles.length > 0;
  const subtitlesToExtract = [];

  response.infoLog += `Total subtitles found: ${totalSubtitles.length}\n`;

  if (extractSubtitles.length > 0 && hasSubtitles) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < totalSubtitles.length; i++) {
      const subStream = totalSubtitles[i];
      let lang = '';

      if (subStream.tags) {
        lang = subStream.tags.language;
      }

      const { index } = subStream;

      if (!lang) {
        response.infoLog += `language not set: ${lang}\n`;
        response.infoLog += `${JSON.stringify(subStream)}`;
        // eslint-disable-next-line no-continue
        continue;
      }
      if (!extractSubtitles.includes(lang)) {
        response.infoLog += `${lang} is not wanted\n`;
        // eslint-disable-next-line no-continue
        continue;
      }

      const { forced, hearing_impaired } = subStream.disposition;

      const isForced = !!forced;
      const isSDH = !!hearing_impaired;

      response.infoLog += `Extracting sub: ${lang}\n`;

      // removes file name
      const fileWithoutExtension = fileName.replace(/\.[a-z0-9]+$/gi, '');

      subtitleFormat.forEach((format) => {
        const subsFile = [fileWithoutExtension, lang];
        if (isSDH) subsFile.push(dispositionMap.hearing_impaired);
        if (isForced) subsFile.push(dispositionMap.forced);

        subsFile.push(format);
        subtitlesToExtract.push(`-map 0:${index} "${subsFile.join('.')}"`);
      });
    }
  }

  response.preset = hasSubtitles ? `-y <io> ${subtitlesToExtract.join(' ')} -map 0 -c copy -sn` : '';
  response.processFile = subtitlesToExtract.length > 0 && hasSubtitles;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
