/* eslint-disable */
'use strict';

// Purpan RTX4090 Unified v1.4
// - HEVC NVENC with adaptive VBR for <=1440p and UHD CQ mode for 4K
// - Uses p6 for any 4K transcode; lower resolutions use the normal p4 default
// - Preserves Dolby Vision/HDR10+ by copying their video streams without re-encoding
// - Can copy all HDR or transcode static HDR10 according to hdr_policy
// - Remuxes HEVC TS/M2TS to the selected container without re-encoding
// - Copies audio, attachments and cover art
// - Converts text subtitles to SRT in MKV; bitmap subtitles are copied
// - Detects cover art even if attached_pic was lost after remux
// - Robust bitrate fallback using MediaInfo or file size/duration
// - Dynamic decode selection: auto / cuda / cpu

const numberInput = (name, value, tooltip) => ({
  name,
  type: 'number',
  defaultValue: value,
  inputUI: { type: 'text' },
  tooltip,
});

const choiceInput = (name, value, options, tooltip) => ({
  name,
  type: 'string',
  defaultValue: value,
  inputUI: { type: 'dropdown', options },
  tooltip,
});

const details = () => ({
  id: 'Tdarr_Plugin_purpan_combined_RTX4090',
  Stage: 'Pre-processing',
  Type: 'Video',
  Operation: 'Transcode',
  Name: 'Purpan RTX4090 Unified - HEVC NVENC, UHD CQ, DV/HDR10+ safe',
  Version: '1.4',
  Tags: 'pre-processing,ffmpeg,nvenc,h265,hevc,hdr,hdr10plus,dolbyvision,uhd,subtitles,mkv,ts,m2ts',
  Description: [
    'Encodes the main video to HEVC with NVENC and adaptive VBR targets.',
    'Copies audio and cover art. Text subtitles become SRT in MKV; PGS/VobSub/DVB are copied.',
    'Includes cover-art detection, bitrate fallbacks and auto/cuda/cpu decode modes.',
    'Any 4K transcode uses the UHD preset and CQ controls; lower resolutions use the normal preset and adaptive VBR.',
    'Dolby Vision and HDR10+ video is copied by default so dynamic metadata is not destroyed.',
    'HEVC in TS/M2TS is remuxed to the selected container without re-encoding; incompatible data streams are skipped.',
    'The Tdarr library/Flow controls source paths, cache and replacement of the original file.',
  ].join(' '),
  
  flow: true,
  
  Inputs: [
    numberInput('target_bitrate_480p576p', 1500, 'SD/576p maximum target, kbit/s.'),
    numberInput('target_bitrate_720p', 3000, '720p maximum target, kbit/s.'),
    numberInput('target_bitrate_1080p', 6000, '1080p maximum target, kbit/s.'),
    numberInput('target_bitrate_1440p', 10000, '1440p maximum target, kbit/s.'),
    numberInput('target_bitrate_4KUHD', 45000, 'Legacy/fallback 4K VBR cap, kbit/s. UHD CQ mode normally uses its own maxrate.'),
    numberInput('maxrate_multiplier', 1.5, 'Maximum rate = target multiplied by this value; must be at least 1.'),
    numberInput('source_bitrate_ratio', 0.70, 'Target = estimated source video bitrate multiplied by this ratio, limited by the resolution cap.'),
    choiceInput('nvenc_preset', 'p4', ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'], 'Preset for resolutions below 4K. Default p4.'),
    choiceInput('uhd_nvenc_preset', 'p6', ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'], 'Preset for every 4K transcode, SDR or static HDR10. Dynamic HDR is copied and uses no preset.'),
    choiceInput('uhd_rate_control', 'cq', ['cq', 'vbr'], 'Rate control for 4K transcodes. CQ is recommended for quality; VBR uses the adaptive 4K bitrate cap.'),
    numberInput('uhd_cq', 20, 'NVENC constant-quality value for 4K. Lower means higher quality/larger output. Typical range: 18-22.'),
    numberInput('uhd_maxrate', 60000, 'Maximum 4K bitrate in CQ mode, kbit/s.'),
    numberInput('uhd_bufsize', 120000, '4K VBV buffer size in CQ mode, kbit/s.'),
    choiceInput('hdr_policy', 'copy_dynamic', ['copy_dynamic', 'copy_all'], 'copy_dynamic preserves Dolby Vision/HDR10+ by stream copy and permits static HDR10 transcode. copy_all copies every HDR video stream.'),
    choiceInput('decode_mode', 'auto', ['auto', 'cuda', 'cpu'], 'auto uses CUDA only for compatible input. cuda forces NVDEC and fails safely if unsupported. cpu disables hardware decoding; encoding still uses NVENC.'),
    choiceInput('deinterlace', 'auto', ['auto', 'off'], 'auto deinterlaces video flagged as interlaced.'),
    choiceInput('container_default', 'mkv', ['mkv', 'mp4'], 'Output container. MKV is recommended for mixed subtitle formats and attachments.'),
    choiceInput('subtitle_format', 'srt', ['copy', 'srt'], 'srt converts text subtitles only. Bitmap PGS/VobSub/DVB subtitles are always copied in MKV.'),
    choiceInput('hdr_preserve', 'true', ['true', 'false'], 'Preserve HDR colour signalling when available. Dynamic HDR cannot be recreated by NVENC.'),
  ],
});

function parseBoolean(value) {
  return value === true || String(value).trim().toLowerCase() === 'true';
}

function settings(raw) {
  const result = {};
  details().Inputs.forEach((input) => {
    result[input.name] = input.defaultValue;
  });

  Object.entries(raw || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') result[key] = value;
  });

  const numericInputs = [
    'target_bitrate_480p576p',
    'target_bitrate_720p',
    'target_bitrate_1080p',
    'target_bitrate_1440p',
    'target_bitrate_4KUHD',
    'maxrate_multiplier',
    'uhd_cq',
    'uhd_maxrate',
    'uhd_bufsize',
  ];

  numericInputs.forEach((key) => {
    result[key] = Number(result[key]);
    if (!Number.isFinite(result[key]) || result[key] <= 0) {
      throw new Error(`Invalid input: ${key}`);
    }
  });

  if (result.maxrate_multiplier < 1) {
    throw new Error('maxrate_multiplier must be >= 1');
  }

  result.source_bitrate_ratio = Number(result.source_bitrate_ratio);
  if (!Number.isFinite(result.source_bitrate_ratio)
      || result.source_bitrate_ratio <= 0
      || result.source_bitrate_ratio > 1) {
    throw new Error('source_bitrate_ratio must be > 0 and <= 1');
  }

  if (!/^p[1-7]$/.test(String(result.nvenc_preset))) {
    throw new Error('Invalid nvenc_preset');
  }
  if (!/^p[1-7]$/.test(String(result.uhd_nvenc_preset))) {
    throw new Error('Invalid uhd_nvenc_preset');
  }
  if (!['cq', 'vbr'].includes(result.uhd_rate_control)) {
    throw new Error('Invalid uhd_rate_control');
  }
  if (result.uhd_cq < 1 || result.uhd_cq > 51) {
    throw new Error('uhd_cq must be between 1 and 51');
  }
  if (!['copy_dynamic', 'copy_all'].includes(result.hdr_policy)) {
    throw new Error('Invalid hdr_policy');
  }
  if (!['auto', 'cuda', 'cpu'].includes(result.decode_mode)) {
    throw new Error('Invalid decode_mode');
  }
  if (!['auto', 'off'].includes(result.deinterlace)) {
    throw new Error('Invalid deinterlace');
  }
  if (!['mkv', 'mp4'].includes(result.container_default)) {
    throw new Error('Invalid container_default');
  }
  if (!['copy', 'srt'].includes(result.subtitle_format)) {
    throw new Error('Invalid subtitle_format');
  }

  result.hdr_preserve = parseBoolean(result.hdr_preserve);
  return result;
}

function checkStreams(streams) {
  const allowedTypes = new Set(['video', 'audio', 'subtitle', 'attachment', 'data']);

  streams.forEach((stream) => {
    const type = String(stream.codec_type || '').toLowerCase();
    if (!allowedTypes.has(type)) {
      throw new Error(
        `Manual review: unsupported stream type ${type || 'unknown'} at index ${stream.index}`,
      );
    }
  });
}

function isAttachedPicture(stream) {
  if (Number(stream?.disposition?.attached_pic) === 1) return true;
  if (String(stream?.codec_type || '').toLowerCase() !== 'video') return false;

  const codec = String(stream.codec_name || '').toLowerCase();
  const title = String(stream.tags?.title || stream.tags?.TITLE || '').toLowerCase();
  const filename = String(
    stream.tags?.filename || stream.tags?.FILENAME || '',
  ).toLowerCase();
  const mimetype = String(
    stream.tags?.mimetype || stream.tags?.MIMETYPE || '',
  ).toLowerCase();

  const imageCodecs = new Set(['mjpeg', 'jpeg', 'png', 'bmp', 'webp', 'tiff', 'gif']);
  const looksLikeCover = /cover|poster|folder|front|album/.test(title)
    || /\.(jpe?g|png|webp|bmp|gif|tiff?)$/.test(filename)
    || /^image\//.test(mimetype);

  const duration = Number(stream.duration);
  const zeroOrMissingDuration = !Number.isFinite(duration) || duration <= 0;
  const avgFrameRate = String(stream.avg_frame_rate || '');
  const noNormalFrameRate = avgFrameRate === '0/0' || avgFrameRate === '';

  return imageCodecs.has(codec)
    && (looksLikeCover || (zeroOrMissingDuration && noNormalFrameRate));
}

function isHDR(stream) {
  const sideData = JSON.stringify(stream.side_data_list || []);
  return ['smpte2084', 'arib-std-b67'].includes(stream.color_transfer)
    || stream.color_primaries === 'bt2020'
    || /bt2020/i.test(stream.color_space || '')
    || /mastering display|content light|dovi|dolby vision|hdr10|smpte.?2094/i.test(sideData);
}

function getHDRType(stream, file) {
  const mediaInfoVideo = getMediaInfoTracks(file || {}).filter((track) => (
    String(track['@type'] || '').toLowerCase() === 'video'
  ));
  const allData = JSON.stringify({
    sideData: stream.side_data_list || [],
    profile: stream.profile || '',
    codecTag: stream.codec_tag_string || '',
    tags: stream.tags || {},
    mediaInfoVideo,
    exif: file?.meta || {},
  });

  // Prefer Dolby Vision when a hybrid stream advertises both DV and HDR10/HDR10+.
  if (/dovi|dolby[ _-]?vision|dvhe|dvh1|dovi configuration record/i.test(allData)) {
    return 'dolby_vision';
  }
  if (/hdr10\+|smpte.?2094|hdr dynamic metadata.*2094/i.test(allData)) {
    return 'hdr10plus';
  }
  if (stream.color_transfer === 'arib-std-b67' || /hybrid log.?gamma|\bhlg\b/i.test(allData)) {
    return 'hlg';
  }
  if (stream.color_transfer === 'smpte2084'
      || stream.color_primaries === 'bt2020'
      || /bt2020/i.test(stream.color_space || '')
      || /mastering display|content light|hdr10|smpte.?2084|\bpq\b/i.test(allData)) {
    return 'hdr10';
  }
  return 'sdr';
}

function parseBitrateKbps(value) {
  if (value === undefined || value === null || value === '') return 0;

  const text = String(value).trim().toLowerCase().replace(/,/g, '.');
  const match = text.match(/[0-9]+(?:\.[0-9]+)?/);
  if (!match) return 0;

  let number = Number(match[0]);
  if (!Number.isFinite(number) || number <= 0) return 0;

  if (/g(?:bit|b)?\/?s|gbps/.test(text)) number *= 1000000;
  else if (/m(?:bit|b)?\/?s|mbps/.test(text)) number *= 1000;
  else if (/k(?:bit|b)?\/?s|kbps/.test(text)) return Math.round(number);
  else if (number > 100000) number /= 1000; // ffprobe and MediaInfo normally report bit/s

  return Math.round(number);
}

function parseDurationSeconds(value) {
  if (value === undefined || value === null || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  const text = String(value).trim();
  const direct = Number(text);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const match = text.match(/^(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (!match) return 0;

  return (Number(match[1]) * 3600) + (Number(match[2]) * 60) + Number(match[3]);
}

function getDurationSeconds(file) {
  const candidates = [
    file.duration,
    file.ffProbeData?.format?.duration,
    file.meta?.Duration,
    file.mediaInfo?.track?.find?.((track) => track['@type'] === 'General')?.Duration,
  ];

  for (const value of candidates) {
    const duration = parseDurationSeconds(value);
    if (duration > 0) return duration;
  }

  return 0;
}

function estimateOverallBitrateFromSizeKbps(file) {
  const duration = getDurationSeconds(file);
  if (!(duration > 0)) return 0;

  const byteCandidates = [
    file.statSync?.size,
    file.ffProbeData?.format?.size,
  ];

  let bytes = 0;
  for (const value of byteCandidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      bytes = parsed;
      break;
    }
  }

  // Tdarr file_size is normally MiB, so use it only as the final size fallback.
  if (!(bytes > 0)) {
    const sizeMiB = Number(file.file_size);
    if (Number.isFinite(sizeMiB) && sizeMiB > 0) {
      bytes = sizeMiB * 1024 * 1024;
    }
  }

  if (!(bytes > 0)) return 0;
  return Math.round((bytes * 8) / duration / 1000);
}

function getMediaInfoTracks(file) {
  const tracks = file.mediaInfo?.track;
  return Array.isArray(tracks) ? tracks : [];
}

function getMediaInfoVideoBitrateKbps(file) {
  const track = getMediaInfoTracks(file).find((item) => {
    if (String(item['@type'] || '').toLowerCase() !== 'video') return false;
    const codec = String(item.Format || item.CodecID || '').toLowerCase();
    const title = String(item.Title || '').toLowerCase();
    return !/mjpeg|jpeg|png|cover/.test(`${codec} ${title}`);
  });

  if (!track) return 0;
  return parseBitrateKbps(
    track.BitRate || track.BitRate_Nominal || track.BitRate_Maximum,
  );
}

function getAudioBitrateKbps(file) {
  const ffprobeAudio = (file.ffProbeData?.streams || [])
    .filter((stream) => stream.codec_type === 'audio')
    .reduce((total, stream) => total + parseBitrateKbps(
      stream.bit_rate
      || stream.tags?.BPS
      || stream.tags?.BPS_eng
      || stream.tags?.BPS_ru,
    ), 0);

  if (ffprobeAudio > 0) return ffprobeAudio;

  return getMediaInfoTracks(file)
    .filter((track) => String(track['@type'] || '').toLowerCase() === 'audio')
    .reduce((total, track) => total + parseBitrateKbps(
      track.BitRate || track.BitRate_Nominal || track.BitRate_Maximum,
    ), 0);
}

function getSourceVideoBitrateKbps(stream, file) {
  const directCandidates = [
    stream.bit_rate,
    stream.tags?.BPS,
    stream.tags?.BPS_eng,
    stream.tags?.BPS_ru,
  ];

  for (const value of directCandidates) {
    const bitrate = parseBitrateKbps(value);
    if (bitrate > 0) return { kbps: bitrate, source: 'video stream metadata' };
  }

  const mediaInfoBitrate = getMediaInfoVideoBitrateKbps(file);
  if (mediaInfoBitrate > 0) {
    return { kbps: mediaInfoBitrate, source: 'MediaInfo video track' };
  }

  const audioKbps = getAudioBitrateKbps(file);
  const containerKbps = parseBitrateKbps(
    file.bit_rate || file.ffProbeData?.format?.bit_rate,
  );

  if (containerKbps > 0) {
    return {
      kbps: Math.max(100, containerKbps - audioKbps),
      source: audioKbps > 0 ? 'container bitrate minus audio' : 'container bitrate',
    };
  }

  const estimatedOverallKbps = estimateOverallBitrateFromSizeKbps(file);
  if (estimatedOverallKbps > 0) {
    return {
      kbps: Math.max(100, estimatedOverallKbps - audioKbps),
      source: audioKbps > 0 ? 'file size/duration minus audio' : 'file size/duration',
    };
  }

  return { kbps: 0, source: 'resolution fallback' };
}

function adaptiveTargetKbps(sourceKbps, capKbps, ratio) {
  const safeCap = Math.max(100, Math.round(Number(capKbps) || 1000));
  const safeRatio = Math.min(0.95, Math.max(0.30, Number(ratio) || 0.70));

  if (!(sourceKbps > 0)) {
    // Avoid blindly using the full tier cap when all bitrate metadata is absent.
    return Math.max(100, Math.round(safeCap * safeRatio));
  }

  return Math.max(100, Math.min(safeCap, Math.round(sourceKbps * safeRatio)));
}

function getResolutionTier(width, height) {
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);

  if (longSide <= 1024 && shortSide <= 576) return 'target_bitrate_480p576p';
  if (longSide <= 1280 && shortSide <= 720) return 'target_bitrate_720p';
  if (longSide <= 1920 && shortSide <= 1080) return 'target_bitrate_1080p';
  if (longSide <= 2560 && shortSide <= 1440) return 'target_bitrate_1440p';
  if (longSide <= 4096 && shortSide <= 2160) return 'target_bitrate_4KUHD';

  throw new Error('Manual review: dimensions exceed configured 4K tiers.');
}

const TEXT_SUBTITLE_CODECS = new Set([
  'subrip', 'srt', 'mov_text', 'webvtt', 'ass', 'ssa', 'text',
]);

const BITMAP_SUBTITLE_CODECS = new Set([
  'hdmv_pgs_subtitle', 'dvd_subtitle', 'dvb_subtitle', 'xsub',
]);

function normalizeContainer(value) {
  const container = String(value || '').replace(/^\./, '').toLowerCase();
  if (container === 'matroska' || container === 'matroska,webm') return 'mkv';
  if (container === 'mpegts' || container === 'mpeg-ts') return 'ts';
  return container;
}

function subtitleNeedsConversion(stream, targetContainer, subtitleFormat) {
  if (subtitleFormat !== 'srt') return false;

  const codec = String(stream.codec_name || '').toLowerCase();
  if (!TEXT_SUBTITLE_CODECS.has(codec)) return false;

  if (targetContainer === 'mp4') return codec !== 'mov_text';
  return !['subrip', 'srt'].includes(codec);
}

const plugin = (file, librarySettings, rawInputs, otherArguments) => {
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    FFmpegMode: true,
    handBrakeMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const inputs = settings(rawInputs);
  const streams = file.ffProbeData?.streams;
  if (!Array.isArray(streams) || streams.length === 0) {
    throw new Error('No ffprobe streams; rescan the file.');
  }

  checkStreams(streams);

  const allVideoStreams = streams.filter((stream) => stream.codec_type === 'video');
  const coverStreams = allVideoStreams.filter(isAttachedPicture);
  const mainVideos = allVideoStreams.filter((stream) => !isAttachedPicture(stream));

  if (mainVideos.length !== 1) {
    throw new Error(
      `Manual review: expected exactly one main video stream; found ${mainVideos.length}.`,
    );
  }

  const video = mainVideos[0];
  const mainVideoOrdinal = allVideoStreams.indexOf(video);
  const width = Number(video.width);
  const height = Number(video.height);

  if (!(width > 0 && height > 0) || width % 2 !== 0 || height % 2 !== 0) {
    throw new Error('Manual review: missing or odd video dimensions. No automatic resize is performed.');
  }

  const tierKey = getResolutionTier(width, height);
  const capKbps = Math.round(inputs[tierKey]);
  const sourceBitrate = getSourceVideoBitrateKbps(video, file);
  const targetKbps = adaptiveTargetKbps(
    sourceBitrate.kbps,
    capKbps,
    inputs.source_bitrate_ratio,
  );
  const maxrateKbps = Math.max(
    targetKbps,
    Math.round(targetKbps * inputs.maxrate_multiplier),
  );

  const pixelFormat = String(video.pix_fmt || '').toLowerCase();
  const depthMatch = pixelFormat.match(/(?:p|gray)(9|10|12|14|16)(?:le|be)?$/);
  const bitDepth = Number(video.bits_per_raw_sample)
    || (depthMatch ? Number(depthMatch[1]) : (/p010/.test(pixelFormat) ? 10 : 8));

  if (bitDepth > 10) {
    throw new Error('Manual review: input bit depth exceeds 10 bits.');
  }

  const tenBit = bitDepth > 8;
  const profile = tenBit ? 'main10' : 'main';
  const softwarePixelFormat = tenBit ? 'p010le' : 'nv12';

  const fieldOrder = String(video.field_order || '').toLowerCase();
  const interlaced = ['tt', 'bb', 'tb', 'bt'].includes(fieldOrder);
  const doDeinterlace = inputs.deinterlace === 'auto' && interlaced;

  const codec = String(video.codec_name || '').toLowerCase();
  const cudaCompatibleCodecs = new Set([
    'h264', 'hevc', 'mpeg1video', 'mpeg2video', 'vc1', 'vp8', 'vp9', 'av1',
  ]);
  const cudaCompatiblePixelFormats = new Set([
    'yuv420p', 'yuv420p10le', 'nv12', 'p010le',
  ]);
  const cudaCompatibleInput = cudaCompatibleCodecs.has(codec)
    && cudaCompatiblePixelFormats.has(pixelFormat);

  const isUHD = tierKey === 'target_bitrate_4KUHD';
  const hdrType = getHDRType(video, file);
  const hdr = hdrType !== 'sdr';
  const dynamicHdr = ['dolby_vision', 'hdr10plus'].includes(hdrType);
  const processedMarker = String(
    video.tags?.PURPAN_PROCESSED || video.tags?.purpan_processed || '',
  ).toUpperCase();
  const alreadyProcessedByV14 = processedMarker.startsWith('V1.4');

  // Dolby Vision and HDR10+ are always copied: NVENC cannot regenerate their dynamic
  // metadata. copy_all additionally copies static HDR10/HLG. With copy_dynamic, an
  // unprocessed 4K static HDR10/HLG HEVC stream is encoded once, then marked V1.4.
  const forceHdrCopy = dynamicHdr || (hdr && inputs.hdr_policy === 'copy_all');
  const staticUhdHdrEncode = isUHD
    && hdr
    && !dynamicHdr
    && inputs.hdr_policy === 'copy_dynamic'
    && !alreadyProcessedByV14;
  const transcodeVideo = !forceHdrCopy
    && (codec !== 'hevc' || doDeinterlace || staticUhdHdrEncode);

  if (transcodeVideo && hdr && bitDepth < 10) {
    throw new Error(
      `Manual review: ${hdrType} was detected but the source pixel format is only ${bitDepth}-bit (${pixelFormat}).`,
    );
  }

  let useCudaDecode = false;
  if (inputs.decode_mode === 'cuda') {
    if (transcodeVideo && !cudaCompatibleInput) {
      throw new Error(
        `Forced CUDA decoding is not supported safely for ${codec || 'unknown'}/${pixelFormat || 'unknown'}.`,
      );
    }
    useCudaDecode = transcodeVideo && cudaCompatibleInput;
  } else if (inputs.decode_mode === 'auto') {
    useCudaDecode = transcodeVideo && cudaCompatibleInput;
  }

  const inputContainer = normalizeContainer(
    file.container || file.ffProbeData?.format?.format_name,
  );
  const targetContainer = normalizeContainer(inputs.container_default || 'mkv');
  if (dynamicHdr && targetContainer !== 'mkv') {
    throw new Error(
      `Manual review: ${hdrType} requires MKV output in this plugin to avoid unsafe metadata/container conversion.`,
    );
  }
  const subtitleStreams = streams.filter((stream) => stream.codec_type === 'subtitle');
  const subtitleConversionNeeded = subtitleStreams.some((stream) => (
    subtitleNeedsConversion(stream, targetContainer, inputs.subtitle_format)
  ));
  const containerChangeNeeded = inputContainer !== targetContainer;

  // Skip when no video encode, container remux or subtitle conversion is needed.
  // HEVC in TS/M2TS is still remuxed because containerChangeNeeded is true.
  const noProcessingRequired = !transcodeVideo
    && !containerChangeNeeded
    && !subtitleConversionNeeded;

  if (noProcessingRequired) {
    response.processFile = false;
    response.container = `.${targetContainer}`;
    response.infoLog = [
      'Already compliant: no processing required.',
      `Video=${codec}; HDR=${hdrType}; policy=${inputs.hdr_policy}; container=${inputContainer}.`,
      dynamicHdr ? 'Dynamic HDR protected by video stream-copy policy.' : 'Subtitles already compatible.',
      `Covers detected=${coverStreams.length}; marker=${processedMarker || 'none'}.`,
    ].join('\n');
    return response;
  }

  const inputArgs = transcodeVideo && useCudaDecode
    ? '-hwaccel cuda -hwaccel_output_format cuda'
    : '';

  // Map only media and attachment streams. TS/M2TS data streams are intentionally
  // omitted because many of them cannot be muxed into Matroska or MP4.
  const mapParts = [
    '-map 0:v?',
    '-map 0:a?',
    '-map 0:s?',
    '-map 0:t?',
    '-map_metadata 0',
    '-map_chapters 0',
    '-c copy',
  ];
  const outputArgs = [];

  const filters = [];
  if (transcodeVideo && doDeinterlace) {
    filters.push(
      useCudaDecode
        ? 'yadif_cuda=mode=send_frame:parity=auto:deint=all'
        : 'bwdif=mode=send_frame:parity=auto:deint=all',
    );
  }
  if (transcodeVideo && !useCudaDecode) {
    filters.push(`format=${softwarePixelFormat}`);
  }
  if (filters.length > 0) {
    outputArgs.push(`-filter:v:${mainVideoOrdinal} "${filters.join(',')}"`);
  }

  const selectedPreset = isUHD ? inputs.uhd_nvenc_preset : inputs.nvenc_preset;
  const useUhdCq = isUHD && inputs.uhd_rate_control === 'cq';

  if (transcodeVideo) {
    outputArgs.push(`-c:v:${mainVideoOrdinal} hevc_nvenc`);
    outputArgs.push(`-profile:v:${mainVideoOrdinal} ${hdr ? 'main10' : profile}`);
    outputArgs.push(`-preset:v:${mainVideoOrdinal} ${selectedPreset}`);
    outputArgs.push(`-tune:v:${mainVideoOrdinal} hq`);
    outputArgs.push(`-rc:v:${mainVideoOrdinal} vbr`);

    if (useUhdCq) {
      outputArgs.push(`-cq:v:${mainVideoOrdinal} ${Math.round(inputs.uhd_cq)}`);
      outputArgs.push(`-b:v:${mainVideoOrdinal} 0`);
      outputArgs.push(`-maxrate:v:${mainVideoOrdinal} ${Math.round(inputs.uhd_maxrate)}k`);
      outputArgs.push(`-bufsize:v:${mainVideoOrdinal} ${Math.round(inputs.uhd_bufsize)}k`);
    } else {
      outputArgs.push(`-b:v:${mainVideoOrdinal} ${targetKbps}k`);
      outputArgs.push(`-maxrate:v:${mainVideoOrdinal} ${maxrateKbps}k`);
      outputArgs.push(`-bufsize:v:${mainVideoOrdinal} ${targetKbps * 2}k`);
    }

    outputArgs.push(`-multipass:v:${mainVideoOrdinal} ${isUHD ? 'fullres' : 'disabled'}`);
    outputArgs.push(`-spatial_aq:v:${mainVideoOrdinal} 1`);
    outputArgs.push(`-temporal_aq:v:${mainVideoOrdinal} 1`);
    outputArgs.push(`-bf:v:${mainVideoOrdinal} 2`);
    outputArgs.push(`-b_ref_mode:v:${mainVideoOrdinal} middle`);
    outputArgs.push(`-fps_mode:v:${mainVideoOrdinal} passthrough`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} PURPAN_PROCESSED=V1.4_${isUHD ? 'UHD' : 'STANDARD'}_${useUhdCq ? 'CQ' : 'VBR'}`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} BPS-eng=`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} DURATION-eng=`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} NUMBER_OF_FRAMES-eng=`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} NUMBER_OF_BYTES-eng=`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} _STATISTICS_WRITING_APP-eng=`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} _STATISTICS_WRITING_DATE_UTC-eng=`);
    outputArgs.push(`-metadata:s:v:${mainVideoOrdinal} _STATISTICS_TAGS-eng=`);
  } else {
    outputArgs.push(`-c:v:${mainVideoOrdinal} copy`);
  }

  outputArgs.push('-max_muxing_queue_size 4096');

  // Try to retain cover semantics. The fallback detector above still recognises the
  // image by codec/title/filename if a Matroska remuxer does not preserve attached_pic.
  coverStreams.forEach((cover) => {
    const ordinal = allVideoStreams.indexOf(cover);
    outputArgs.push(`-c:v:${ordinal} copy`);
    outputArgs.push(`-disposition:v:${ordinal} attached_pic`);
  });

  const subtitleActions = [];

  subtitleStreams.forEach((subtitle, ordinal) => {
    const subtitleCodec = String(subtitle.codec_name || '').toLowerCase();

    if (targetContainer === 'mp4' && BITMAP_SUBTITLE_CODECS.has(subtitleCodec)) {
      throw new Error(
        `Manual review: MP4 cannot safely contain bitmap subtitle ${subtitleCodec}. Select MKV or remove/convert the subtitle externally.`,
      );
    }

    if (inputs.subtitle_format === 'srt' && TEXT_SUBTITLE_CODECS.has(subtitleCodec)) {
      const outputCodec = targetContainer === 'mp4' ? 'mov_text' : 'srt';
      outputArgs.push(`-c:s:${ordinal} ${outputCodec}`);
      subtitleActions.push(`s:${ordinal} ${subtitleCodec}->${outputCodec}`);
      return;
    }

    // PGS, VobSub/DVD, DVB and unknown subtitle codecs are preserved in MKV.
    outputArgs.push(`-c:s:${ordinal} copy`);
    if (BITMAP_SUBTITLE_CODECS.has(subtitleCodec)) {
      subtitleActions.push(`s:${ordinal} ${subtitleCodec}->copy (bitmap)`);
    } else {
      subtitleActions.push(`s:${ordinal} ${subtitleCodec || 'unknown'}->copy`);
    }
  });

  if (inputs.hdr_preserve && hdr) {
    if (video.color_primaries) {
      outputArgs.push(`-color_primaries:v:${mainVideoOrdinal} ${video.color_primaries}`);
    }
    if (video.color_transfer) {
      outputArgs.push(`-color_trc:v:${mainVideoOrdinal} ${video.color_transfer}`);
    }
    if (video.color_space) {
      outputArgs.push(`-colorspace:v:${mainVideoOrdinal} ${video.color_space}`);
    }
    if (video.color_range) {
      outputArgs.push(`-color_range:v:${mainVideoOrdinal} ${video.color_range}`);
    }
  }

  response.processFile = true;

  // Run Classic Transcode Plugin expects exactly two sections separated by one comma:
  // input arguments,output arguments
  response.preset = `${inputArgs},${[
    ...mapParts,
    ...outputArgs,
  ].filter(Boolean).join(' ')}`;

  const fallbackNote = sourceBitrate.kbps > 0
    ? `${sourceBitrate.kbps}k (${sourceBitrate.source})`
    : `unavailable; used ${Math.round(inputs.source_bitrate_ratio * 100)}% of resolution cap`;

  const rateDescription = transcodeVideo
    ? (useUhdCq
      ? `CQ=${Math.round(inputs.uhd_cq)}, maxrate=${Math.round(inputs.uhd_maxrate)}k, bufsize=${Math.round(inputs.uhd_bufsize)}k`
      : `target=${targetKbps}k, maxrate=${maxrateKbps}k`)
    : 'video stream copy';

  response.infoLog = [
    `Purpan Unified v1.4: ${codec || 'unknown'}->${transcodeVideo ? 'hevc_nvenc' : 'copy'}`,
    `Video v:${mainVideoOrdinal}; ${width}x${height}; ${bitDepth}-bit; UHD=${isUHD}; HDR=${hdrType}; policy=${inputs.hdr_policy}`,
    `Decode=${transcodeVideo ? (useCudaDecode ? 'cuda' : 'cpu') : 'not needed'} (${inputs.decode_mode}); preset=${transcodeVideo ? selectedPreset : 'not used'}; ${rateDescription}`,
    `Source bitrate=${fallbackNote}; marker=${processedMarker || 'none'}`,
    `Container=${inputContainer}->${targetContainer}; remux=${containerChangeNeeded && !transcodeVideo}; skipped data streams=${streams.filter((stream) => stream.codec_type === 'data').length}`,
    `Covers=${coverStreams.length}; dynamic HDR protected=${dynamicHdr && !transcodeVideo}`,
    `Subtitles=${subtitleActions.length > 0 ? subtitleActions.join(', ') : 'none'}`,
  ].join('\n');

  response.container = `.${inputs.container_default || 'mkv'}`;
  return response;
};

module.exports = { details, plugin };
