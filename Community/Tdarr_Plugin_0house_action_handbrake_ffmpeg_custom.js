const details = () => ({
  id: 'Tdarr_Plugin_0house_action_handbrake_ffmpeg_custom',
  Stage: 'Pre-processing',
  Name: 'HandBrake or FFmpeg custom arguments',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  Set HandBrake or FFmpeg arguments. This action has no built-in filter so be sure to set a codec filter
  to prevent a transcoding loop.
  `,
  Version: '1.00',
  Tags: 'action',
  Inputs: [
    {
      name: 'cli',
      type: 'string',
      defaultValue: 'ffmpeg',
      inputUI: {
        type: 'dropdown',
        options: [
          'ffmpeg',
          'handbrake',
        ],
      },
      tooltip:
        'Enter the desired video encoder',
    },
    {
      name: 'arguments',
      type: 'string',
      defaultValue: '<io> -map 0 -c copy',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
When using FFmpeg, you need to separate the input and output args with <io>. FFmpeg Examples:

-r 1<io>-r 24
<io>-sn -c:v copy -c:a copy
<io>-c:v libx265 -crf 23 -ac 6 -c:a aac -preset veryfast
<io>-map 0 -c copy -c:v libx265 -c:a aac
-c:v h264_cuvid<io>-c:v hevc_nvenc -preset slow -c:a copy


HandBrake examples:

-e x264 -q 20 -B
-Z "Very Fast 1080p30"
-Z "Fast 1080p30" -e nvenc_h265
-Z "Very Fast 1080p30" --all-subtitles --all-audio
-Z "Very Fast 480p30"

--preset-import-file "C:/Users/HaveAGitGat/Desktop/testpreset.json" -Z "My Preset"
`,
    },
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter the desired container',
    },
  ],
});

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  // eslint-disable-next-line global-require
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: '',
    handBrakeMode: false,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  response.preset = inputs.arguments;
  response.container = `.${inputs.container}`;
  response.handbrakeMode = inputs.cli === 'handbrake';
  response.ffmpegMode = inputs.cli === 'ffmpeg';
  response.reQueueAfter = true;
  response.processFile = true;
  response.infoLog += 'File is being transcoded using custom arguments \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
