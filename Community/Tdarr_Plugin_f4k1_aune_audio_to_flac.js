const details = () => ({
  id: 'Tdarr_Plugin_f4k1_aune_audio_to_flac',
  Stage: 'Pre-processing',
  Name: 'Aune - Audio To FLAC',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin transcodes different audio codecs to FLAC. '
    + 'Leaving the default inputs results in lossless conversion as ALAC and'
    + ' PCM codecs don\'t require transcoding for FLAC. It ignores files that'
    + ' contains video streams and is made for music libraries.\n\n',
  Version: '1.00',
  Tags: 'pre-processing,ffmpeg,audio only',
  Inputs: [
    {
      name: 'codecs',
      type: 'string',
      defaultValue: 'alac,pcm_s16be,pcm_s16le,pcm_s24be,pcm_s24le,pcm_u16be,pcm_u16le,pcm_u24be,pcm_u24le',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `Select the codec(s) (comma seperated) you would like to transcode to FLAC. 
              \\nExample:\\n
              alac
              \\nExample:\\n
              alac, pcm_s16be, mp3
              \\nExample:\\n
              alac,pcm_s16be,pcm_s16le,pcm_s24be,pcm_s24le,pcm_u16be,pcm_u16le,pcm_u24be,pcm_u24le`,
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    processFile: false,
    preset: '<io> -c:a flac -f flac',
    container: '.flac',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  if (inputs.codecs === '' || inputs.codecs === undefined) {
    response.infoLog += '☒No codecs selected!\n';
    return response;
  }
  // eslint-disable-next-line no-param-reassign
  inputs.codecs = inputs.codecs.split(',');

  if (file.ffProbeData.streams.filter((x) => x.codec_type === 'video' && x.avg_frame_rate !== '0/0').length) {
    response.infoLog += '☒File contains video!\n';
    return response;
  }

  // Either transcode to FLAC or ignore file
  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    for (let j = 0; j < inputs.codecs.length; j += 1) {
      if (
        file.ffProbeData.streams[i].codec_type === 'audio'
        && file.ffProbeData.streams[i].codec_name.toLowerCase() === inputs.codecs[j].toLowerCase().trim()
      ) {
        response.processFile = true;
        response.infoLog += `☒Found ${inputs.codecs[j].toLowerCase().trim()} codec!\n`;
        return response;
      }
    }
  }
  response.infoLog += '☑No matching codecs found!\n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
