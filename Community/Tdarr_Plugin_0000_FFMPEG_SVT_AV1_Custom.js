const details = () => ({
  id: 'Tdarr_Plugin_0000_FFMPEG_SVT_AV1_Custom',
  Stage: 'Pre-processing',
  Name: 'FFMPEG SVT AV1 Custom',
  Type: 'Video',
  Operation: 'Transcode',
  Description:
    '[Contains built-in filter] This plugin transcodes non AV1 files into AV1 mkv using ffmpeg and svt-av1. Basic customization options have been provided. Generic HDR Passthrough is also included by default (may not work on all HDR videos). Audio/subtitles/attachments not affected.  \n\n',
  Version: '1.04',
  Tags: 'pre-processing,ffmpeg,av1,video only',
  Inputs: [
    {
      name: 'qp',
      type: 'string',
      defaultValue: '18',
      inputUI: {
        type: 'dropdown',
        options: [0, 4, 8, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 34, 38, 42, 50],
      },
      tooltip: 'Encoding Quality (higher decreases the file size at the expense of quality: Sane values would be 16-30)',
    },
    {
      name: 'preset',
      type: 'string',
      defaultValue: '10',
      inputUI: {
        type: 'dropdown',
        options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
      },
      tooltip: 'Preset (lower means slower, but better quality compression: Go as low as you can bare, for the best quality)',
    },
    {
      name: 'tile-rows',
      type: 'string',
      defaultValue: '4',
      inputUI: {
        type: 'dropdown',
        options: [1, 2, 3, 4, 8],
      },
      tooltip: 'Number of tile rows (May increase processing speed)',
    },
    {
      name: 'tile-columns',
      type: 'string',
      defaultValue: '2',
      inputUI: {
        type: 'dropdown',
        options: [1, 2, 3, 4, 8],
      },
      tooltip: 'Number of tile columns (May increase processing speed)',
    },
    {
      name: 'bit-depth',
      type: 'string',
      defaultValue: '8',
      inputUI: {
        type: 'dropdown',
        options: ['8', '10'],
      },
      tooltip: 'Bit depth of the output video (Likely not needed. If the source is 8-Bit, it wont magically make it 10-Bit.  Best to leave it at 10-Bit)',
    },
  ],
});

  const plugin = async (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const { qp, preset, 'tile-rows': tileRows, 'tile-columns': tileColumns, 'bit-depth': bitDepth } = inputs;

  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += '☒File is not a video! \n';
    return response;
  }
  response.infoLog += '☑File is a video! \n';

  if (file.ffProbeData.streams[0].codec_name === 'av1') {
    response.processFile = false;
    response.infoLog += '☑File is already in AV1! \n';
    return response;
  }

  response.processFile = true;
  response.preset = `,-map 0:v -map 0:a -map 0:s? -map 0:d? -c copy -c:v:0 libsvtav1 -qp ${qp} -preset ${preset} -tile_rows ${tileRows} -tile_columns ${tileColumns} -svtav1-params fast-decode=1:rc=0:aq-mode=2:undershoot-pct=100:overshoot-pct=0:enable-qm=1:bias-pct=100:film-grain=0:irefresh-type=2:enable-overlays=1:scd=1:scm=0:keyint=300:color-range=1:lookahead=-1:tune=1:input-depth=${bitDepth} -metadata:s:v:0 "chroma_location=topleft:color_primaries=bt2020:transfer_characteristics=smpte2084:color_trc=bt2020:colorspace=bt2020nc" -metadata:s:v:0 "master_display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(40000000,50)" -metadata:s:v:0 "max_cll=1600,300" -pix_fmt yuv420p${bitDepth === '8' ? '' : `${bitDepth}le`} -max_muxing_queue_size 9999`;
  response.container = '.mkv';
  response.handBrakeMode = false;
  response.FFmpegMode = true;
  response.reQueueAfter = true;
  response.infoLog += '☒File is not AV1! \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
