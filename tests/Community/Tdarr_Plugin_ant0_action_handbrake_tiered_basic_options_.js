/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      file: {
        video_resolution: '1080p'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Very Fast 1080p30" -e x265 --all-subtitles',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using HandBrake \n',
      handbrakeMode: true,
      ffmpegMode: false,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        handbrakePreset: 'Fast',
        videoEncoder: 'nvenc_h265',
        keepSubtitles: 'true',
        keepAllAudio: 'true',
        container: 'mp4',
      },
      file: {
        video_resolution: '576p'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Fast 576p25" -e nvenc_h265 --all-subtitles --all-audio',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using HandBrake \n',
      handbrakeMode: true,
      ffmpegMode: false,
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        handbrakePreset: 'Fast',
        videoEncoder: 'nvenc_h265',
        keepSubtitles: 'false',
        keepAllAudio: 'false',
        container: 'mov',
      },
      file: {
        video_resolution: '576p'
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Fast 576p25" -e nvenc_h265',
      container: '.mov',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using HandBrake \n',
      handbrakeMode: true,
      ffmpegMode: false,
    },
  },
];

void run(tests);
