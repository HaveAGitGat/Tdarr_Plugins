/* eslint max-len: 0 */
const _ = require('lodash');
const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 27 -threads 64 -speed 2 \n'
        + '      -quality good -static-thresh 0 -tile-columns 2 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH265_1.json')),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 26 -threads 64 -speed 2 \n'
        + '      -quality good -static-thresh 0 -tile-columns 2 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.container = 'webm';
        file.ffProbeData.streams[0].codec_name = 'vp9';
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☑ File is in proper video format\n'
        + '☑ No video processing necessary\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -c:v copy \n  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.container = 'webm';
        file.ffProbeData.streams[0].codec_name = 'vp9';
        file.ffProbeData.streams[1].codec_name = 'opus';
        return file;
      })(),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☑ No audio processing necessary\n'
        + '☑ File is in proper video format\n'
        + '☑ No video processing necessary\n'
        + '☑ No subtitle processing necessary\n'
        + '☑ No need to process file',
      processFile: false,
      preset: ',-map 0 -map -0:d -c:v copy \n  -c:a copy -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: _.cloneDeep(require('../sampleData/media/sampleH264_1.json')),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '16',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 28 -threads 64 -speed 2 \n'
        + '      -quality good -static-thresh 0 -tile-columns 2 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '240p';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '16',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 33 -threads 64 -speed 1 \n'
        + '      -quality good -static-thresh 0 -tile-columns 0 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '360p';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '16',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 32 -threads 64 -speed 1 \n'
        + '      -quality good -static-thresh 0 -tile-columns 1 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '480p';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '16',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 29 -threads 64 -speed 1 \n'
        + '      -quality good -static-thresh 0 -tile-columns 1 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '1080p';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '16',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 27 -threads 64 -speed 2 \n'
        + '      -quality good -static-thresh 0 -tile-columns 2 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '4KUHD';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '17',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 16 -threads 64 -speed 2 \n'
        + '      -quality good -static-thresh 0 -tile-columns 3 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.video_resolution = '8KUHD';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '17',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Audio is not in proper codec, will format\n'
        + '☒ Transcoding file to VP9\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -pix_fmt yuv420p10le -c:v libvpx-vp9 -b:v 0 -crf 17 -threads 64 -speed 2 \n'
        + '      -quality good -static-thresh 0 -tile-columns 3 -tile-rows 0 -frame-parallel 0 -row-mt 1 \n'
        + '      -aq-mode 0 -g 240 \n'
        + '  -c:a libopus -c:s copy',
      reQueueAfter: true,
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.container = 'webm';
        file.ffProbeData.streams[0].codec_name = 'vp9';
        file.ffProbeData.streams[1].codec_name = 'opus';
        file.ffProbeData.streams[1].tags.language = 'eng';

        file.ffProbeData.streams[2] = _.cloneDeep(file.ffProbeData.streams[1]);
        file.ffProbeData.streams[2].codec_type = 'subtitle';
        file.ffProbeData.streams[2].tags.title = 'commentary';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '17',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng,und',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☑ No audio processing necessary\n'
        + '☑ File is in proper video format\n'
        + '☑ No video processing necessary\n'
        + '☒ Removing Commentary or Description subtitle: commentary',
      processFile: true,
      preset: ',-map 0 -map -0:d -c:v copy \n  -c:a copy -c:s copy -map -0:s:0',
      reQueueAfter: true,
    },
  },

  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.container = 'webm';
        file.ffProbeData.streams[0].codec_name = 'vp9';
        file.ffProbeData.streams[1].codec_name = 'opus';
        file.ffProbeData.streams[1].tags.language = 'eng';

        file.ffProbeData.streams[2] = _.cloneDeep(file.ffProbeData.streams[0]);
        file.ffProbeData.streams[2].codec_name = 'mjpeg';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '17',
        audio_language: 'eng,und,fre',
        audio_commentary: 'true',
        subtitle_language: 'eng,und',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☑ No audio processing necessary\n'
        + '☑ File is in proper video format\n'
        + '☒ Removing mjpeg\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -c:v copy -map -0:v:1 \n  -c:a copy -c:s copy',
      reQueueAfter: true,
    },
  },
  {
    input: {
      file: (() => {
        const file = _.cloneDeep(require('../sampleData/media/sampleH264_1.json'));
        file.container = 'webm';
        file.ffProbeData.streams[0].codec_name = 'vp9';
        file.ffProbeData.streams[1].codec_name = 'opus';
        file.ffProbeData.streams[1].tags.language = 'eng';

        file.ffProbeData.streams[2] = _.cloneDeep(file.ffProbeData.streams[1]);
        file.ffProbeData.streams[2].tags.language = 'fre';
        return file;
      })(),
      librarySettings: {},
      inputs: {
        CQ_240p: '33',
        CQ_360p: '32',
        CQ_480p: '29',
        CQ_720p: '28',
        CQ_1080p: '27',
        CQ_4KUHD: '16',
        CQ_8KUHD: '17',
        audio_language: 'eng,und',
        audio_commentary: 'true',
        subtitle_language: 'eng,und',
        subtitle_commentary: 'true',
        remove_mjpeg: 'true',
      },
      otherArguments: {},
    },
    output: {
      container: '.webm',
      FFmpegMode: true,
      handBrakeMode: false,
      infoLog: '☒ Removing audio track in language fre\n'
        + '☑ File is in proper video format\n'
        + '☑ No video processing necessary\n'
        + '☑ No subtitle processing necessary',
      processFile: true,
      preset: ',-map 0 -map -0:d -c:v copy \n  -c:a copy -map -0:a:1 -c:s copy',
      reQueueAfter: true,
    },
  },
];

void run(tests);
