/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Very Fast 720p30" -e x265 --all-subtitles',
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
        container: 'mkv',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Fast 720p30" -e nvenc_h265 --all-subtitles --all-audio --aencoder copy --audio-copy-mask aac,ac3,truehd,dts,dtshd,mp2,mp3,flac --audio-fallback ac3',
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
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Fast 720p30" -e nvenc_h265 --all-subtitles --all-audio',
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
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Fast 720p30" -e nvenc_h265',
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
