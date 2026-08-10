/* eslint max-len: 0 */
const run = require('../helpers/run');

const baseFile = {
  fileMedium: 'video',
  container: 'mkv',
  file: '/media/movie-4k-sdr.mkv',
  bit_rate: 12000000,
  ffProbeData: {
    streams: [
      {
        codec_type: 'video',
        codec_name: 'hevc',
        profile: 'Main',
        width: 3840,
        height: 2160,
        bit_rate: '11000000',
      },
      {
        codec_type: 'audio',
        codec_name: 'eac3',
        channels: 6,
        tags: { language: 'eng' },
      },
    ],
    format: {},
  },
};

const tests = [
  {
    input: {
      file: baseFile,
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
      infoLog: 'Applying Roku-safe 4K SDR MP4 rule. Copying HEVC Main SDR video at 11000 kbps. Creating AAC stereo fallback and AC3 5.1 tracks. Subtitles omitted in first validated Roku-safe rule. ',
    },
  },
  {
    input: {
      file: {
        ...baseFile,
        file: '/media/movie-4k-hdr10.mkv',
        ffProbeData: {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'hevc',
              profile: 'Main 10',
              width: 3840,
              height: 2160,
              pix_fmt: 'yuv420p10le',
              color_transfer: 'smpte2084',
              color_primaries: 'bt2020',
            },
          ],
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
      infoLog: '4K file is HDR, Main10, HLG, Dolby Vision, or BT.2020. Skipping for Roku-safe SDR rule. \n',
    },
  },
  {
    input: {
      file: {
        ...baseFile,
        bit_rate: 0,
        ffProbeData: {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'hevc',
              profile: 'Main',
              width: 3840,
              height: 2160,
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
      infoLog: 'Video bitrate is unknown. Skipping copy-only SDR path by default. \n',
    },
  },
  {
    input: {
      file: {
        ...baseFile,
        file: '/media/movie-4k-sdr-h264.mkv',
        ffProbeData: {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              profile: 'High',
              width: 3840,
              height: 2160,
              bit_rate: '30000000',
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
              tags: { language: 'eng' },
            },
          ],
          format: {},
        },
      },
      librarySettings: {},
      inputs: {
        video_encoder: 'libx265',
      },
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: true,
      preset: ', -map_metadata -1 -map_chapters -1 -map 0:v:0 -c:v libx265 -preset medium -pix_fmt yuv420p -profile:v main -b:v 20000k -maxrate 25000k -bufsize 50000k -tag:v hvc1 -map 0:1 -sn -dn -c:a:0 aac -ac:a:0 2 -b:a:0 192k -movflags +faststart -avoid_negative_ts make_zero ',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: 'Applying Roku-safe 4K SDR MP4 rule. Encoding video to HEVC Main SDR with libx265 at 20000 kbps. Creating AAC stereo fallback only; no 6+ channel source audio found. Subtitles omitted in first validated Roku-safe rule. ',
    },
  },
  {
    input: {
      file: baseFile,
      librarySettings: {},
      inputs: {
        video_encoder: 'vp9',
      },
      otherArguments: {},
    },
    output: {
      container: '.mp4',
      processFile: false,
      preset: '',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: "Unsupported video_encoder 'vp9'. Use hevc_qsv or libx265. Skipping. \n",
    },
  },
  {
    input: {
      file: {
        ...baseFile,
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
      infoLog: '4K file is HDR, Main10, HLG, Dolby Vision, or BT.2020. Skipping for Roku-safe SDR rule. \n',
    },
  },
];

void run(tests);
