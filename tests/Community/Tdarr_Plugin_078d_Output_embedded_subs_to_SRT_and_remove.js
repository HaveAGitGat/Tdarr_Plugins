/* eslint max-len: 0 */
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: {
        file: '/test/video.mp4',
        container: 'mp4',
        ffProbeData: {
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
            },
            {
              index: 2,
              codec_name: 'subrip',
              codec_type: 'subtitle',
              tags: {
                language: 'eng',
              },
            },
          ],
        },
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: '/usr/bin/ffmpeg',
        originalLibraryFile: {
          file: '/test/video.mp4',
        },
      },
    },
    output: {
      processFile: true,
      preset: ', -map 0 -map -0:2 -c copy',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Found sub to extract!',
    },
  },
  {
    input: {
      file: {
        file: '/test/video.mp4',
        container: 'mp4',
        ffProbeData: {
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
            },
            {
              index: 2,
              codec_name: 'mov_text',
              codec_type: 'subtitle',
              tags: {
                language: 'eng',
              },
            },
          ],
        },
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: '/usr/bin/ffmpeg',
        originalLibraryFile: {
          file: '/test/video.mp4',
        },
      },
    },
    output: {
      processFile: false,
      preset: '',
      container: '',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'No subs in file to extract!',
    },
  },
  {
    input: {
      file: {
        file: '/test/video.mp4',
        container: 'mp4',
        ffProbeData: {
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
            },
          ],
        },
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {
        ffmpegPath: '/usr/bin/ffmpeg',
        originalLibraryFile: {
          file: '/test/video.mp4',
        },
      },
    },
    output: {
      processFile: false,
      preset: '',
      container: '',
      handBrakeMode: false,
      FFmpegMode: false,
      reQueueAfter: true,
      infoLog: 'No subs in file to extract!',
    },
  },
];

void run(require('path').join(__dirname, '../..', 'Community', 'Tdarr_Plugin_078d_Output_embedded_subs_to_SRT_and_remove.js'), tests);
