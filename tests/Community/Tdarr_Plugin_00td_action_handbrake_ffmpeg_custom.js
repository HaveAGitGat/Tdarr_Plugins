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
      preset: '<io> -map 0 -c copy',
      container: '.mkv',
      handbrakeMode: false,
      ffmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using custom arguments \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        cli: 'handbrake',
        arguments: '-Z "Very Fast 1080p30" --all-subtitles --all-audio',
        container: 'mp4',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '-Z "Very Fast 1080p30" --all-subtitles --all-audio',
      container: '.mp4',
      handbrakeMode: true,
      ffmpegMode: false,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using custom arguments \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        cli: 'ffmpeg',
        arguments: '<io>-c:v libx265 -crf 23 -ac 6 -c:a aac -preset veryfast',
        container: 'mov',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io>-c:v libx265 -crf 23 -ac 6 -c:a aac -preset veryfast',
      container: '.mov',
      handbrakeMode: false,
      ffmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using custom arguments \n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {
        cli: 'ffmpeg',
        arguments: '<io>-c:v libx265 -crf 23 -ac 6 -c:a aac -preset veryfast',
        container: 'original',
      },
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '<io>-c:v libx265 -crf 23 -ac 6 -c:a aac -preset veryfast',
      container: '.mp4',
      handbrakeMode: false,
      ffmpegMode: true,
      reQueueAfter: true,
      infoLog: 'File is being transcoded using custom arguments \n',
    },
  },
];

void run(tests);
