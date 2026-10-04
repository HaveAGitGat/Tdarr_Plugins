/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const noStreamDataLog = '☒ No stream data from FFprobe, file may be corrupt or unreadable. Skipping subtitle extraction.\n';

const sampleWith = (sampleFile, modify) => {
  const sample = _.cloneDeep(sampleFile);
  modify(sample);
  return sample;
};

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_2.json').file,
        },
      },
    },
    output: {
      processFile: true,
      preset: '-y <io> -map 0:6 "C:/Transcode/Source Folder/h264.fre.srt" -map 0 -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'Found subs to extract!\nExtracting fre.srt\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        remove_subs: 'yes',
      },
      otherArguments: {
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_2.json').file,
        },
      },
    },
    output: {
      processFile: true,
      preset: '-y <io> -map 0:6 "C:/Transcode/Source Folder/h264.fre.srt" -map 0 -map -0:s -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'Found subs to extract!\nExtracting fre.srt\n',
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_3.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: {
          file: require('../sampleData/media/sampleH264_3.json').file,
        },
      },
    },
    output: {
      processFile: true,
      preset: '-y <io> -map 0:6 "C:/Transcode/Source Folder/h264.en.srt" -map 0:7 "C:/Transcode/Source Folder/h264.fre.srt" -map 0 -c copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'Found subs to extract!\nExtracting en.srt\nExtracting fre.srt\n',
    },
  },
  {
    // File has video and audio streams but no subtitles
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: 'No subs in file to extract!\n',
    },
  },
  {
    // FFprobe failed and returned no data
    input: {
      file: sampleWith(require('../sampleData/media/sampleH264_2.json'), (sample) => {
        // eslint-disable-next-line no-param-reassign
        sample.ffProbeData = {};
      }),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: noStreamDataLog,
    },
  },
  {
    input: {
      file: sampleWith(require('../sampleData/media/sampleH264_2.json'), (sample) => {
        // eslint-disable-next-line no-param-reassign
        delete sample.ffProbeData;
      }),
      librarySettings: {},
      inputs: {
        remove_subs: 'yes',
      },
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: noStreamDataLog,
    },
  },
  {
    input: {
      file: sampleWith(require('../sampleData/media/sampleH264_2.json'), (sample) => {
        // eslint-disable-next-line no-param-reassign
        sample.ffProbeData.streams = null;
      }),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: false,
      infoLog: noStreamDataLog,
    },
  },
];

void run(tests);
