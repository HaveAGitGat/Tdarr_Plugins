const details = () => ({
  id: 'Tdarr_Plugin_jeons001_Downmix_to_stereo_and_apply_DRC',
  Stage: 'Pre-processing',
  Name: 'Downmix & Dynamic Range Compression',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'Downmixes surround to AAC stereo AND applies dynamic range compression.'
    + 'Files already in stereo or with multiple audio tracks will be skipped \n\n',
  Version: '1.00',
  Tags: 'ffmpeg',
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
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
    container: `.${file.container}`,
  };

  let audioStreams = 0;
  let surroundTrackFound = false;

  for (let index = 0; index < file.ffProbeData.streams.length; index += 1) {
    const stream = file.ffProbeData.streams[index];
    if (stream.codec_type === 'audio') {
      audioStreams += 1;
    }

    if (stream.codec_type === 'audio' && stream.channels && stream.channels > 3) {
      surroundTrackFound = true;
    }
  }

  if (audioStreams > 1) {
    response.infoLog = 'File has more than 1 audio track - not processing';
    return response;
  }

  if (!surroundTrackFound) {
    response.infoLog = 'File has no surround tracks - not processing';
    return response;
  }

  if (surroundTrackFound && audioStreams === 1) {
    response.preset = '-sn <io> -vcodec copy -scodec copy -acodec aac -filter:a '
    + '"dynaudnorm,pan=stereo|FL < 1.0*FL + 0.707*FC + 0.707*BL|FR < 1.0*FR + 0.707*FC + 0.707*BR"';
    response.processFile = true;
    response.infoLog = 'File matches requirements for processing. Downmixing and applying DRC!';
    return response;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
