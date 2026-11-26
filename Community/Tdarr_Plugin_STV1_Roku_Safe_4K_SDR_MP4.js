/* eslint max-len: 0 */

const details = () => ({
  id: 'Tdarr_Plugin_STV1_Roku_Safe_4K_SDR_MP4',
  Stage: 'Pre-processing',
  Name: 'Roku Safe 4K SDR MP4',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Conservatively standardize 4K SDR media to the locally validated Roku/Jellyfin-safe shape: MP4/HVC1, HEVC Main 8-bit SDR, AAC stereo fallback, optional AC3 5.1 when the source supports it. HDR/Main10/Dolby Vision/HLG files are skipped.',
  Version: '1.0.0',
  Tags: 'pre-processing,ffmpeg,video,4k,roku,mp4,hevc,sdr',
  Inputs: [
    {
      name: 'video_encoder',
      type: 'string',
      defaultValue: 'hevc_qsv',
      inputUI: {
        type: 'dropdown',
        options: [
          'hevc_qsv',
          'libx265',
        ],
      },
      tooltip: 'FFmpeg HEVC encoder to use when video re-encode is needed. Supported values: hevc_qsv or libx265.',
    },
    {
      name: 'target_video_bitrate_kbps',
      type: 'string',
      defaultValue: '20000',
      inputUI: { type: 'text' },
      tooltip: 'Target video bitrate in kbps when video re-encode is needed. Video is copied when already HEVC Main 8-bit SDR at or below max_video_bitrate_kbps.',
    },
    {
      name: 'max_video_bitrate_kbps',
      type: 'string',
      defaultValue: '25000',
      inputUI: { type: 'text' },
      tooltip: 'Above this bitrate, eligible 4K SDR video is re-encoded instead of copied.',
    },
    {
      name: 'allow_unknown_bitrate',
      type: 'string',
      defaultValue: 'no',
      inputUI: {
        type: 'dropdown',
        options: [
          'no',
          'yes',
        ],
      },
      tooltip: 'Set to yes to allow copying already-compatible HEVC SDR video when bitrate is unknown. Default no is safer for Roku direct play.',
    },
    {
      name: 'aac_bitrate_kbps',
      type: 'string',
      defaultValue: '192',
      inputUI: { type: 'text' },
      tooltip: 'AAC stereo fallback bitrate.',
    },
    {
      name: 'ac3_bitrate_kbps',
      type: 'string',
      defaultValue: '640',
      inputUI: { type: 'text' },
      tooltip: 'AC3 5.1 bitrate when the source has a 6+ channel audio stream.',
    },
  ],
});

const get = (obj, path, fallback = undefined) => path
  .split('.')
  .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;

const lower = (value) => String(value || '').toLowerCase();

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const yes = (value) => ['1', 'true', 'yes', 'y'].includes(lower(value));

const streamLang = (stream) => lower(get(stream, 'tags.language', 'und'));

const isPreferredLanguage = (stream) => {
  const lang = streamLang(stream);
  return lang === 'eng' || lang === 'und' || lang === '';
};

const is4k = (video) => (video.width || 0) >= 3840 || (video.height || 0) >= 2160;

const isHdrOrTenBit = (video) => {
  const profile = lower(video.profile);
  const pixFmt = lower(video.pix_fmt);
  const colorTransfer = lower(video.color_transfer);
  const colorPrimaries = lower(video.color_primaries);
  const colorSpace = lower(video.color_space);

  const sideData = JSON.stringify(video.side_data_list || '').toLowerCase();

  return profile.includes('main 10')
    || profile.includes('main10')
    || pixFmt.includes('10')
    || pixFmt.includes('p010')
    || colorTransfer === 'smpte2084'
    || colorTransfer === 'arib-std-b67'
    || colorPrimaries === 'bt2020'
    || colorSpace === 'bt2020nc'
    || sideData.includes('dovi')
    || sideData.includes('dolby vision');
};

const pathHasHdrMarkers = (file) => {
  const text = lower(`${file.file || ''} ${file.fileNameWithoutExtension || ''} ${file.originalFile || ''}`);
  return /(^|[ ._\-[({])(?:hdr|hdr10|hdr10\+|hdr10plus|hdr10p|dv|dovi|dolby[ ._-]?vision|hlg)(?=$|[ ._\-\])}])/.test(text);
};

const isSdr = (file, video) => !isHdrOrTenBit(video) && !pathHasHdrMarkers(file);

const bitrateKbps = (file, video) => {
  const streamBitrate = parseInt(video.bit_rate || 0, 10);
  if (streamBitrate > 0) {
    return Math.round(streamBitrate / 1000);
  }

  const formatBitrate = parseInt(get(file, 'ffProbeData.format.bit_rate', 0), 10);
  if (formatBitrate > 0) {
    return Math.round(formatBitrate / 1000);
  }

  const tdarrBitrate = parseInt(file.bit_rate || 0, 10);
  if (tdarrBitrate > 0) {
    return Math.round(tdarrBitrate / 1000);
  }

  return 0;
};

const findBestAudio = (streams, requireSixPlus) => {
  const audio = streams
    .map((stream, index) => ({ stream, index }))
    .filter(({ stream }) => lower(stream.codec_type) === 'audio')
    .filter(({ stream }) => isPreferredLanguage(stream));

  const candidates = requireSixPlus
    ? audio.filter(({ stream }) => (stream.channels || 0) >= 6)
    : audio;

  const sorted = candidates.sort((a, b) => (b.stream.channels || 0) - (a.stream.channels || 0));
  return sorted.length > 0 ? sorted[0] : null;
};

const hasSafeAudio = (streams) => {
  const audio = streams.filter((stream) => lower(stream.codec_type) === 'audio');
  const hasAacStereo = audio.some((stream) => lower(stream.codec_name) === 'aac' && stream.channels === 2);
  const hasSixPlusSource = audio.some((stream) => (stream.channels || 0) >= 6);
  const hasAc3Six = audio.some((stream) => lower(stream.codec_name) === 'ac3' && (stream.channels || 0) >= 6);
  const onlySafeCodecs = audio.every((stream) => ['aac', 'ac3'].includes(lower(stream.codec_name)));

  return hasAacStereo && onlySafeCodecs && (!hasSixPlusSource || hasAc3Six);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  // eslint-disable-next-line no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    container: '.mp4',
    processFile: false,
    preset: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: '',
  };

  if (file.fileMedium !== 'video') {
    response.infoLog += 'Not a video file. Skipping. \n';
    return response;
  }

  const streams = get(file, 'ffProbeData.streams', []);
  const video = streams.find((stream) => lower(stream.codec_type) === 'video'
    && !['mjpeg', 'png'].includes(lower(stream.codec_name)));

  if (!video) {
    response.infoLog += 'No primary video stream found. Skipping. \n';
    return response;
  }

  if (!is4k(video)) {
    response.infoLog += `Not 4K (${video.width || '?'}x${video.height || '?'}). Skipping. \n`;
    return response;
  }

  if (!isSdr(file, video)) {
    response.infoLog += '4K file is HDR, Main10, HLG, Dolby Vision, or BT.2020. Skipping for Roku-safe SDR rule. \n';
    return response;
  }

  const videoEncoder = lower(inputs.video_encoder || 'hevc_qsv');
  const targetVideoBitrate = toInt(inputs.target_video_bitrate_kbps, 20000);
  const maxVideoBitrate = toInt(inputs.max_video_bitrate_kbps, 25000);
  const allowUnknownBitrate = yes(inputs.allow_unknown_bitrate);
  const aacBitrate = toInt(inputs.aac_bitrate_kbps, 192);
  const ac3Bitrate = toInt(inputs.ac3_bitrate_kbps, 640);

  if (!['hevc_qsv', 'libx265'].includes(videoEncoder)) {
    response.infoLog += `Unsupported video_encoder '${inputs.video_encoder}'. Use hevc_qsv or libx265. Skipping. \n`;
    return response;
  }

  const currentVideoBitrate = bitrateKbps(file, video);
  const container = lower(file.container || get(file, 'ffProbeData.format.format_name', ''));
  const videoCodec = lower(video.codec_name);
  const videoProfile = lower(video.profile);

  const mp4Container = container.includes('mp4') || container.includes('mov') || container.includes('m4a');
  const safeVideoCodec = videoCodec === 'hevc' && (videoProfile === '' || videoProfile.includes('main')) && !videoProfile.includes('10');
  const copyVideo = safeVideoCodec
    && ((currentVideoBitrate > 0 && currentVideoBitrate <= maxVideoBitrate) || allowUnknownBitrate);
  const safeAudio = hasSafeAudio(streams);

  if (safeVideoCodec && currentVideoBitrate === 0 && !allowUnknownBitrate) {
    response.infoLog += 'Video bitrate is unknown. Skipping copy-only SDR path by default. \n';
    return response;
  }

  if (mp4Container && copyVideo && safeAudio) {
    response.infoLog += 'Already matches Roku-safe 4K SDR MP4 rule. Skipping. \n';
    return response;
  }

  const bestAudio = findBestAudio(streams, false);
  if (!bestAudio) {
    response.infoLog += 'No preferred-language audio stream found. Skipping. \n';
    return response;
  }

  const bestSixAudio = findBestAudio(streams, true);
  const audioMaps = [`-map 0:${bestAudio.index}`];
  const audioOptions = [
    `-c:a:0 aac -ac:a:0 2 -b:a:0 ${aacBitrate}k`,
  ];

  if (bestSixAudio) {
    audioMaps.push(`-map 0:${bestSixAudio.index}`);
    audioOptions.push(`-c:a:1 ac3 -ac:a:1 6 -b:a:1 ${ac3Bitrate}k`);
  }

  let videoOptions = '-map 0:v:0 -c:v copy -tag:v hvc1';
  if (!copyVideo) {
    const maxrate = Math.max(targetVideoBitrate, maxVideoBitrate);
    const bufsize = Math.max(maxrate * 2, 40000);
    if (videoEncoder === 'hevc_qsv') {
      videoOptions = '-map 0:v:0 -c:v hevc_qsv -load_plugin hevc_hw -profile:v main '
        + `-b:v ${targetVideoBitrate}k -maxrate ${maxrate}k -bufsize ${bufsize}k -tag:v hvc1`;
    } else {
      videoOptions = '-map 0:v:0 -c:v libx265 -preset medium -pix_fmt yuv420p -profile:v main '
        + `-b:v ${targetVideoBitrate}k -maxrate ${maxrate}k -bufsize ${bufsize}k -tag:v hvc1`;
    }
  }

  response.preset = `, -map_metadata -1 -map_chapters -1 ${videoOptions} `
    + `${audioMaps.join(' ')} -sn -dn ${audioOptions.join(' ')} `
    + '-movflags +faststart -avoid_negative_ts make_zero ';

  response.processFile = true;
  response.infoLog += 'Applying Roku-safe 4K SDR MP4 rule. ';
  response.infoLog += copyVideo
    ? `Copying HEVC Main SDR video at ${currentVideoBitrate || 'unknown'} kbps. `
    : `Encoding video to HEVC Main SDR with ${videoEncoder} at ${targetVideoBitrate} kbps. `;
  response.infoLog += bestSixAudio
    ? 'Creating AAC stereo fallback and AC3 5.1 tracks. '
    : 'Creating AAC stereo fallback only; no 6+ channel source audio found. ';
  response.infoLog += 'Subtitles omitted in first validated Roku-safe rule. ';

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
