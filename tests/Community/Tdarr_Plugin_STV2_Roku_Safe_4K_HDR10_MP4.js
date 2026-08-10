/* eslint max-len: 0 */
const run = require('../helpers/run');

const hdr10File = {
  fileMedium: 'video',
  container: 'mkv',
  file: '/media/The.Matrix.1999.2160p.Bluray.HDR10.10bit.x265.HEVC.mkv',
  bit_rate: 9526301,
  ffProbeData: {
    streams: [
      {
        codec_type: 'video',
        codec_name: 'hevc',
        profile: '',
        width: 3840,
        height: 1600,
      },
      {
        codec_type: 'audio',
        codec_name: 'truehd',
        channels: 8,
        tags: { language: 'eng' },
      },
    ],
    format: {},
  },
};

const tests = [
  {
    input: {
      file: hdr10File,
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: true,
      preset: ', -map_metadata -1 -map_chapters -1 -map 0:v:0 -c:v copy -tag:v hvc1 -map 0:1 -map 0:1 -sn -dn -c:a:0 aac -ac:a:0 2 -b:a:0 192k -c:a:1 ac3 -ac:a:1 6 -b:a:1 640k -movflags +faststart -avoid_negative_ts make_zero ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Applying Roku-safe 4K HDR10 MP4 rule. Copying HEVC Main10 HDR10 video at 9526 kbps. Creating AAC stereo fallback and AC3 5.1 tracks. Subtitles omitted in first validated Roku-safe HDR10 rule. ',
    },
  },
  {
    input: {
      file: {
        ...hdr10File,
        file: '/media/movie.2160p.HDR10+.10bit.HEVC.mkv',
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Dolby Vision, HDR10+, HLG, or dynamic HDR marker detected. Skipping conservative HDR10-only rule. \n',
    },
  },
  {
    input: {
      file: {
        ...hdr10File,
        file: '/media/movie.2160p.HDR.HEVC.mkv',
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Path suggests HDR10, but stream metadata is incomplete for BT.2020/PQ Main10. Skipping rather than guessing. \n',
    },
  },
  {
    input: {
      file: {
        ...hdr10File,
        ffProbeData: {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'hevc',
              profile: 'Main 10',
              width: 3840,
              height: 1600,
              pix_fmt: 'yuv420p10le',
              color_transfer: 'smpte2084',
              color_primaries: 'bt2020',
              side_data_list: [
                { side_data_type: 'DOVI configuration record' },
              ],
            },
          ],
          format: {},
        },
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Dolby Vision, HDR10+, HLG, or dynamic HDR marker detected. Skipping conservative HDR10-only rule. \n',
    },
  },
  {
    input: {
      file: {
        ...hdr10File,
        ffProbeData: {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'hevc',
              profile: 'Main 10',
              width: 3840,
              height: 1600,
              pix_fmt: 'yuv420p10le',
              color_transfer: 'smpte2084',
              color_primaries: 'bt2020',
              side_data_list: [
                { side_data_type: 'HDR10+ metadata' },
              ],
            },
          ],
          format: {},
        },
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Dolby Vision, HDR10+, HLG, or dynamic HDR marker detected. Skipping conservative HDR10-only rule. \n',
    },
  },
  {
    input: {
      file: {
        ...hdr10File,
        ffProbeData: {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'hevc',
              profile: 'Main 10',
              width: 3840,
              height: 1600,
              pix_fmt: 'yuv420p10le',
              color_transfer: 'arib-std-b67',
              color_primaries: 'bt2020',
            },
          ],
          format: {},
        },
      },
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Dolby Vision, HDR10+, HLG, or dynamic HDR marker detected. Skipping conservative HDR10-only rule. \n',
    },
  },
];

void run(tests);
