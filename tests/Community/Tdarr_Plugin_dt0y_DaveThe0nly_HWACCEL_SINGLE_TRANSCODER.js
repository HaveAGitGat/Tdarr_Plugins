/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      },
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '_________Checking Bitrate___________\n'
        + 'Original File: 1591143\n'
        + 'Current Bitrate: 1591143\n'
        + 'Target Bitrate: Infinity\n'
        + '_________Figuring HW Accel___________\n'
        + '_________Figuring out video settings___________\n'
        + 'Is below bitrate copying video (re-muxing/copying video source)!\n'
        + '_________Figuring out audio streams___________\n'
        + 'User wants these streams created: [["ac3",6],["aac",6],["aac",3]]\n'
        + 'User wants to keep these streams: eng\n'
        + 'No allowed audio stream available\n',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      },
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mp4',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '_________Checking Bitrate___________\n'
        + 'Original File: 3207441\n'
        + 'Current Bitrate: 1591143\n'
        + 'Target Bitrate: Infinity\n'
        + '_________Figuring HW Accel___________\n'
        + '_________Figuring out video settings___________\n'
        + 'Is below bitrate copying video (re-muxing/copying video source)!\n'
        + '_________Figuring out audio streams___________\n'
        + 'User wants these streams created: [["ac3",6],["aac",6],["aac",3]]\n'
        + 'User wants to keep these streams: eng\n'
        + 'No allowed audio stream available\n',
      reQueueAfter: false,
    },
  },

  // check encoders
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        targetResolutionBitrate: '1080p:6M',
        outputContainer: '.mkv',
        hwAccelerate: 'nVidia (NVENC)',
      },
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      },
    },
    output: {
      processFile: true,
      preset: '-y -hwaccel cuvid <io> -max_muxing_queue_size 9999 -map 0:0 -c:V:0 h264_nvenc -preset:V:0 veryfast -crf:V:0 27 -bufsize 30M -vf format=nv12 -b:V:0 4.8M -maxrate:V:0 6M -chroma_sample_location left -colorspace bt709 -color_range tv -map_metadata 0 -map_chapters 0 -map 0:3 -c:a:0 copy -map 0:1 -c:a:1 copy -map 0:2 -c:a:2 copy -map 0:5 -c:a:3 copy -map 0:s? -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '_________Checking Bitrate___________\n'
        + 'Original File: 8248746\n'
        + 'Current Bitrate: 8248746\n'
        + 'Target Bitrate: 6000000\n'
        + '_________Figuring HW Accel___________\n'
        + 'Using HW Accel!\n'
        + 'Using HW_ACCEL mode: cuvid\n'
        + '_________Figuring out video settings___________\n'
        + 'Video stream is over bitrate transcoding\n'
        + 'Video is x264 using preset: veryfast:27_________Figuring out audio streams___________\n'
        + 'User wants these streams created: [["ac3",6],["aac",6],["aac",3]]\n'
        + 'User wants to keep these streams: eng\n'
        + 'Keeping audio track:\n'
        + '      - codec: flac\n'
        + '      - lang: eng\n'
        + '      - channels: 2\n'
        + '      - atmos: false\n'
        + 'Keeping audio track:\n'
        + '      - codec: ac3\n'
        + '      - lang: eng\n'
        + '      - channels: 2\n'
        + '      - atmos: false\n'
        + 'Keeping audio track:\n'
        + '      - codec: eac3\n'
        + '      - lang: eng\n'
        + '      - channels: 2\n'
        + '      - atmos: true\n'
        + 'Keeping audio track:\n'
        + '      - codec: aac\n'
        + '      - lang: eng\n'
        + '      - channels: 2\n'
        + '      - atmos: false\n'
        + 'Best stream selected as:\n'
        + '  - codec: eac3\n'
        + '  - channels: 2\n'
        + 'ac3 6\n'
        + 'Not enough channels to create 6, falling back to 2\n'
        + 'Stream with codec: ac3 and channels 2 already exists, not creating\n'
        + 'aac 6\n'
        + 'Not enough channels to create 6, falling back to 2\n'
        + 'Stream with codec: aac and channels 2 already exists, not creating\n'
        + 'aac 3\n'
        + 'Not enough channels to create 3, falling back to 2\n'
        + 'Stream with codec: aac and channels 2 already exists, not creating\n'
        + '_____Filter Flags:____\n'
        + '    _extractSubtitles: none\n'
        + '    hasSubtitles: true\n'
        + '    isOverBitrate: true\n'
        + '    audioStreamsToCreate: 0\n'
        + '  ',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        targetResolutionBitrate: '1080p:6M',
        outputContainer: '.mkv',
        hwAccelerate: 'Intel/AMD (VAAPI)',
      },
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      },
    },
    output: {
      processFile: true,
      preset: '-y -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi <io> -max_muxing_queue_size 9999 -map 0:0 -c:V:0 h264_vaapi -preset:V:0 veryfast -crf:V:0 27 -bufsize 30M -vf scale_vaapi=format=nv12 -b:V:0 4.8M -maxrate:V:0 6M -chroma_sample_location left -colorspace bt709 -color_range tv -map_metadata 0 -map_chapters 0 -map 0:3 -c:a:0 copy -map 0:1 -c:a:1 copy -map 0:2 -c:a:2 copy -map 0:5 -c:a:3 copy -map 0:s? -c:s copy',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      infoLog: '_________Checking Bitrate___________\n'
          + 'Original File: 8248746\n'
          + 'Current Bitrate: 8248746\n'
          + 'Target Bitrate: 6000000\n'
          + '_________Figuring HW Accel___________\n'
          + 'Using HW Accel!\n'
          + 'Using HW_ACCEL mode: vaapi\n'
          + '_________Figuring out video settings___________\n'
          + 'Video stream is over bitrate transcoding\n'
          + 'Video is x264 using preset: veryfast:27_________Figuring out audio streams___________\n'
          + 'User wants these streams created: [["ac3",6],["aac",6],["aac",3]]\n'
          + 'User wants to keep these streams: eng\n'
          + 'Keeping audio track:\n'
          + '      - codec: flac\n'
          + '      - lang: eng\n'
          + '      - channels: 2\n'
          + '      - atmos: false\n'
          + 'Keeping audio track:\n'
          + '      - codec: ac3\n'
          + '      - lang: eng\n'
          + '      - channels: 2\n'
          + '      - atmos: false\n'
          + 'Keeping audio track:\n'
          + '      - codec: eac3\n'
          + '      - lang: eng\n'
          + '      - channels: 2\n'
          + '      - atmos: true\n'
          + 'Keeping audio track:\n'
          + '      - codec: aac\n'
          + '      - lang: eng\n'
          + '      - channels: 2\n'
          + '      - atmos: false\n'
          + 'Best stream selected as:\n'
          + '  - codec: eac3\n'
          + '  - channels: 2\n'
          + 'ac3 6\n'
          + 'Not enough channels to create 6, falling back to 2\n'
          + 'Stream with codec: ac3 and channels 2 already exists, not creating\n'
          + 'aac 6\n'
          + 'Not enough channels to create 6, falling back to 2\n'
          + 'Stream with codec: aac and channels 2 already exists, not creating\n'
          + 'aac 3\n'
          + 'Not enough channels to create 3, falling back to 2\n'
          + 'Stream with codec: aac and channels 2 already exists, not creating\n'
          + '_____Filter Flags:____\n'
          + '    _extractSubtitles: none\n'
          + '    hasSubtitles: true\n'
          + '    isOverBitrate: true\n'
          + '    audioStreamsToCreate: 0\n'
          + '  ',
      reQueueAfter: false,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      librarySettings: {},
      inputs: {
        targetResolutionBitrate: '1080p:6M',
        outputContainer: '.mkv',
        hwAccelerate: 'MacOS (Toolbox)',
      },
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_2.json')),
      },
    },
    output: {
      // TODO: Fix this test
      processFile: true,

    },
  },

  // check commentary:
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.ffProbeData.streams[2] = _.cloneDeep(file.ffProbeData.streams[1]);
        file.ffProbeData.streams[2].tags.title += 'commentary';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        keepCommentaryAudioTracks: false,
        createOptimizedAudioTrack: '',
      },
      otherArguments: {
        originalLibraryFile: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      },
    },
    output: {

      // processing should be true
      processFile: true,
    },
  },
];

run(tests);
