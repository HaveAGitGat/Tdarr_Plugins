/* eslint max-len: 0 */

const details = () => ({
  id: 'Tdarr_Plugin_STV2_Roku_Safe_4K_HDR10_MP4',
  Stage: 'Pre-processing',
  Name: 'Roku Safe 4K HDR10 MP4',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Conservatively standardize validated 4K HDR10 media for Roku/Jellyfin direct play: MP4/HVC1, copied HEVC Main10 HDR10 video, AAC stereo fallback, optional AC3 5.1 when the source supports it. Dolby Vision, HDR10+, HLG, non-HEVC video, and high/unknown bitrate sources are skipped by default.',
  Version: '1.0.0',
  Tags: 'pre-processing,ffmpeg,video,4k,roku,mp4,hevc,hdr,hdr10',
  Inputs: [
    {
      name: 'max_video_bitrate_kbps',
      type: 'string',
      defaultValue: '25000',
      inputUI: { type: 'text' },
      tooltip: 'Maximum video bitrate in kbps for copy-only HDR10 processing. Higher bitrate or unknown bitrate files are skipped in v1.',
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
      tooltip: 'Set to yes to allow copy-only processing when ffprobe/Tdarr does not expose a video or format bitrate. Default no is safer for Roku direct play.',
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

const textForPathRules = (file) => lower(`${file.file || ''} ${file.fileNameWithoutExtension || ''} ${file.originalFile || ''}`);

const pathHasUnsupportedHdrMarkers = (file) => {
  const text = textForPathRules(file);
  return /(^|[ ._\-[({])(?:dv|dovi|dolby[ ._-]?vision|hdr10\+|hdr10plus|hdr10p|hlg)(?=$|[ ._\-\])}])/.test(text);
};

const pathHasHdr10Marker = (file) => {
  const text = textForPathRules(file);
  return /(^|[ ._\-[({])hdr10(?=$|[ ._\-\])}])/.test(text)
    || /(^|[ ._\-[({])hdr(?=$|[ ._\-\])}])/.test(text);
};

const pathHasTenBitMarker = (file) => {
  const text = textForPathRules(file);
  return /(^|[ ._\-[({])(?:10bit|10-bit|main10|main[ ._-]?10)(?=$|[ ._\-\])}])/.test(text);
};

const sideDataText = (video) => JSON.stringify(video.side_data_list || '').toLowerCase();

const hasUnsupportedHdrSideData = (video) => {
  const sideData = sideDataText(video);
  return sideData.includes('dovi')
    || sideData.includes('dolby vision')
    || sideData.includes('hdr10+')
    || sideData.includes('smpte 2094')
    || sideData.includes('dynamic hdr');
};

const hasUnsupportedHdrMetadata = (video) => lower(video.color_transfer) === 'arib-std-b67'
  || hasUnsupportedHdrSideData(video);

const isHdr10 = (file, video) => {
  const profile = lower(video.profile);
  const pixFmt = lower(video.pix_fmt);
  const colorTransfer = lower(video.color_transfer);
  const colorPrimaries = lower(video.color_primaries);
  const colorSpace = lower(video.color_space);

  const main10 = profile.includes('main 10')
    || profile.includes('main10')
    || pixFmt.includes('10')
    || pixFmt.includes('p010');

  const pq = colorTransfer === 'smpte2084';
  const bt2020 = colorPrimaries === 'bt2020' || colorSpace === 'bt2020nc';
  const streamMetadataComplete = colorTransfer !== '' || colorPrimaries !== '' || colorSpace !== '' || pixFmt !== '';
  const explicitPathFallback = !streamMetadataComplete && pathHasHdr10Marker(file) && pathHasTenBitMarker(file);

  return (main10 || explicitPathFallback)
    && ((pq && bt2020) || explicitPathFallback)
    && !pathHasUnsupportedHdrMarkers(file)
    && !hasUnsupportedHdrMetadata(video);
};

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

  if (lower(video.codec_name) !== 'hevc') {
    response.infoLog += '4K HDR10 rule is copy-only for HEVC video in v1. Skipping non-HEVC source. \n';
    return response;
  }

  if (pathHasUnsupportedHdrMarkers(file) || hasUnsupportedHdrMetadata(video)) {
    response.infoLog += 'Dolby Vision, HDR10+, HLG, or dynamic HDR marker detected. Skipping conservative HDR10-only rule. \n';
    return response;
  }

  if (!isHdr10(file, video)) {
    response.infoLog += pathHasHdr10Marker(file)
      ? 'Path suggests HDR10, but stream metadata is incomplete for BT.2020/PQ Main10. Skipping rather than guessing. \n'
      : 'Not a validated HDR10 Main10 BT.2020/PQ source. Skipping. \n';
    return response;
  }

  const maxVideoBitrate = toInt(inputs.max_video_bitrate_kbps, 25000);
  const allowUnknownBitrate = yes(inputs.allow_unknown_bitrate);
  const aacBitrate = toInt(inputs.aac_bitrate_kbps, 192);
  const ac3Bitrate = toInt(inputs.ac3_bitrate_kbps, 640);

  const currentVideoBitrate = bitrateKbps(file, video);
  if (currentVideoBitrate === 0 && !allowUnknownBitrate) {
    response.infoLog += 'Video bitrate is unknown. Skipping by default for Roku-safe HDR10 rule. \n';
    return response;
  }

  if (currentVideoBitrate > maxVideoBitrate) {
    response.infoLog += `HDR10 video bitrate ${currentVideoBitrate} kbps exceeds max ${maxVideoBitrate} kbps. Skipping copy-only v1 rule. \n`;
    return response;
  }

  const container = lower(file.container || get(file, 'ffProbeData.format.format_name', ''));
  const mp4Container = container.includes('mp4') || container.includes('mov') || container.includes('m4a');
  const safeAudio = hasSafeAudio(streams);

  if (mp4Container && safeAudio) {
    response.infoLog += 'Already matches Roku-safe 4K HDR10 MP4 rule. Skipping. \n';
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

  response.preset = ', -map_metadata -1 -map_chapters -1 '
    + '-map 0:v:0 -c:v copy -tag:v hvc1 '
    + `${audioMaps.join(' ')} -sn -dn ${audioOptions.join(' ')} `
    + '-movflags +faststart -avoid_negative_ts make_zero ';

  response.processFile = true;
  response.infoLog += 'Applying Roku-safe 4K HDR10 MP4 rule. ';
  response.infoLog += `Copying HEVC Main10 HDR10 video at ${currentVideoBitrate || 'unknown'} kbps. `;
  response.infoLog += bestSixAudio
    ? 'Creating AAC stereo fallback and AC3 5.1 tracks. '
    : 'Creating AAC stereo fallback only; no 6+ channel source audio found. ';
  response.infoLog += 'Subtitles omitted in first validated Roku-safe HDR10 rule. ';

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
