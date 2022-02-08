const supportedResolutions = ['320p', '480p', '576p', '720p', '1080p', '4KUHD', '8KUHD'];

const CODEC_TYPE = {
  VIDEO: 'video',
  AUDIO: 'audio',
  SUBTITLE: 'subtitle',
};

const AAC_AUDIO_STREAM = 'aac';

const HWACCEL_OPTIONS = {
  NONE: 'none',
  NVENC: 'nVidia (NVENC)',
  INTEL_AMD_VAAPI: 'Intel/AMD (VAAPI)',
  INTEL_QUICKSYNC: 'Intel (QuickSync)',
  TOOLBOX: 'MacOS (Toolbox)',
};

const hwaccelModeMap = {
  [HWACCEL_OPTIONS.NVENC]: 'cuvid',
  [HWACCEL_OPTIONS.INTEL_AMD_VAAPI]: 'vaapi',
  [HWACCEL_OPTIONS.INTEL_QUICKSYNC]: 'qsv',
};

const hwaccelEncoderMap = {
  [HWACCEL_OPTIONS.NVENC]: {
    hevc: 'hevc_nvenc',
    h264: 'h264_nvenc',
  },
  [HWACCEL_OPTIONS.INTEL_AMD_VAAPI]: {
    hevc: 'hevc_vaapi',
    h264: 'h264_vaapi',
  },
  [HWACCEL_OPTIONS.INTEL_QUICKSYNC]: {
    hevc: 'hevc_qsv',
    h264: 'h264_qsv',
  },
  [HWACCEL_OPTIONS.TOOLBOX]: {
    hevc: 'hevc_videotoolbox',
    h264: 'h264_videotoolbox',
  },
};

const DDP_ATMOS_CODEC_TYPE = 'eac3';
const TRUEHD_ATMOS_CODEC_TYPE = 'truehd';
const ATMOS_CODECS = [DDP_ATMOS_CODEC_TYPE, TRUEHD_ATMOS_CODEC_TYPE];

const createBitRateFromString = (rates) => rates.reduce((acc, resolutionWithRate) => {
  const [resolution, rate] = resolutionWithRate;

  // eslint-disable-next-line max-len
  if (!supportedResolutions[resolution]) throw new Error(`Unsupported Resolution: ${resolution}, supported are only ${supportedResolutions.join(', ')}`);

  // eslint-disable-next-line default-case
  switch (true) {
    case rate.includes('k'):
      acc[resolution] = parseInt(rate.replace('k', ''), 10) * 1000;
      break;
    case rate.includes('M'):
      acc[resolution] = parseInt(rate.replace('M'), 10) * 1000000;
      break;
  }

  return acc;
}, {});

// eslint-disable-next-line max-len
const createBitRateStringFromBitRate = (rate) => (rate > 1000000
  ? `${Math.round((rate / 1000000) * 10) / 10}M`
  : `${Math.round((rate / 1000) * 10) / 10}k`);

// @TODO: Still requires to work on DTS sound and its counterpart to Atmos
// @TODO: finish other hw acceleration implementations (I only have access to Intel enabled QSV)
// @TODO: Add option to do HDR -> SDR Tone Mapping (That is not something I want, might take a while)
const details = () => ({
  id: 'Tdarr_Plugin_DaveThe0nly_HWACCEL_SINGLE_TRANSCODER',
  Stage: 'Pre-processing',
  Name: 'OnePassMonsterTrasncoder',
  Type: 'Video',
  Operation: 'Transcode',
  // eslint-disable-next-line max-len
  Description: '[Contains built-in filter] Single-pass transcoder to optimize a media file to be used with Plex/Emby etc.',
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,hevc,x264,vaapi,nvenc,configurable,audi,video,subtitles',
  Inputs: [
    {
      name: 'targetResolutionBitrate',
      type: 'string',
      // eslint-disable-next-line max-len
      tooltip: `A mapping of resolution(${supportedResolutions.join(', ')}):bitrate(FFMPEG friendly format 8M or 8000k),
      seperated by a comma eg: "4KUHD:10M,1080p:5M,etc...".
      Keep blank to keep video stream as is (still transcodes to HEVC).`,
      defaultValue: '4KUHD:10M,1080p:5M',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'hwAccelerate',
      type: 'string',
      tooltip: 'Keep blank if none',
      defaultValue: 'none',
      inputUI: {
        type: 'dropdown',
        options: Object.values(HWACCEL_OPTIONS),
      },
    },
    {
      name: 'forceHevc',
      type: 'boolean',
      tooltip: 'Forces HEVC conversion on x264 video',
      defaultValue: 'false',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
    },
    {
      name: 'createOptimizedAudioTrack',
      type: 'boolean',
      tooltip: 'Creates an optimized audio track for clients that do not support atmos, keep empty to not optimize',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
    },
    {
      name: 'createStereoAudioTrack',
      type: 'boolean',
      tooltip: 'Creates a stereo audio track in acc',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'false',
          'true',
        ],
      },
    },
    {
      name: 'keepAudioTracks',
      type: 'string',
      tooltip: 'Keeps an audio track of selected language/s, separated by ","',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'outputContainer',
      type: 'string',
      tooltip: 'Container',
      defaultValue: '.mp4',
      inputUI: {
        type: 'dropdown',
        options: ['.mp4', '.mkv'],
      },
    },
    {
      name: 'extractSubtitles',
      type: 'string',
      tooltip: 'Extracts subtitles by language from the file',
      defaultValue: 'eng,cs,cz',
      inputUI: {
        type: 'string',
      },
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();

  const {
    targetBitrate: _targetBitrate,
    extractSubtitles: _extractSubtitles,
    outputContainer,
    hwAccelerate,
    forceHevc,
    createOptimizedAudioTrack,
    createStereoAudioTrack,
    keepAudioTracks: _keepAudioTracks,
  } = lib.loadDefaultValues(inputs, details);

  const resolution = file.video_resolution === 'DCI4K' ? '4KUHD' : file.video_resolution;
  // If target bitrate is set, try and get it from the setting otherwise set to Infinity to ignore the resolution
  const targetBitrate = _targetBitrate ? createBitRateFromString(_targetBitrate)[resolution] || Infinity : Infinity;
  const keepAudioTracks = _keepAudioTracks.split(',');
  const extractSubtitles = _extractSubtitles.split(',');

  const response = {
    processFile: false,
    preset: '',
    container: outputContainer,
    handBrakeMode: false,
    FFmpegMode: true,
    infoLog: '',
    file,
    removeFromDB: false,
    updateDB: false,
    reQueueAfter: false,
  };

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. Exiting \n';
    return response;
  }

  if (!file.ffProbeData.streams.length) {
    response.processFile = false;
    response.infoLog += 'No streams to process!! \n';
    return response;
  }

  const { originalLibraryFile } = otherArguments;

  const fileName = originalLibraryFile && originalLibraryFile.file ? originalLibraryFile.file : file.file;

  // get all the info from video stream
  const [videoStream] = file.ffProbeData.streams.filter((stream) => stream.codec_type === CODEC_TYPE.VIDEO);
  const audioStreams = file.ffProbeData.streams.filter((stream) => stream.codec_type === CODEC_TYPE.AUDIO);

  // video setup
  const videoStreamUsesCodec = videoStream.codec_name;
  const videoStreamUsesHEVC = videoStreamUsesCodec === 'hevc' || videoStreamUsesCodec === 'x265';
  const pixelFormat = videoStream.pix_fmt;
  const is10BitEncoded = (pixelFormat || '').includes('10le') || !!fileName.match(/10bit/gi);
  // eslint-disable-next-line max-len
  const videoStreamBitRate = file.bit_rate;

  response.infoLog += `Current Bitrate: ${videoStreamBitRate}\n`;
  response.infoLog += `Target Bitrate: ${targetBitrate}\n`;

  // If the resolution is supposed to not be change "targetBitrate" is going to be Infinity - therefore ignored
  const isOverBitrate = videoStreamBitRate > targetBitrate;

  // audio setup
  const unsortedAudioStreamInfo = [];
  let hasOptimizedStream = false;
  let hasStereoStream = false;
  let hasOptimizedStereoStream = false;

  // subtitles
  const totalSubtitles = file.ffProbeData.streams.filter((row) => row.codec_type === 'subtitle');
  const hasSubtitles = totalSubtitles.length > 0;

  audioStreams.forEach((stream, index) => {
    const lang = (stream.tags.lang || stream.tags.language).toLowerCase();
    if (keepAudioTracks.includes(lang)) {
      const isStreamOptimized = stream.codec_name === AAC_AUDIO_STREAM;

      if (isStreamOptimized) {
        response.infoLog += 'Found optimized audio stream\n';
        hasOptimizedStream = true;
      }

      const channels = parseInt(stream.channels, 10);

      // either 2.1 or 2.0
      if ((channels === 3 || channels === 2) && isStreamOptimized) {
        hasStereoStream = true;
        hasOptimizedStereoStream = true;
      }

      unsortedAudioStreamInfo.push({
        index,
        language: lang,
        isAtmos: ATMOS_CODECS.includes(stream.codec_name),
        isLossless: TRUEHD_ATMOS_CODEC_TYPE === stream.codec_name,
        codec: stream.codec_name,
        channels,
      });
    }
  });

  if (!unsortedAudioStreamInfo.length) {
    response.processFile = false;
    response.infoLog += 'No allowed audio stream available\n';
    return response;
  }

  // This puts the best audio stream as the first one, favoring Atmos Streams over higher count surround stream
  const audioStreamsInfo = unsortedAudioStreamInfo.sort((a, b) => {
    if (a.isAtmos || a.isLossless) return -Infinity - 1;
    if (a.isAtmos && a.isLossless) return -Infinity;
    if (a.isAtmos && a.isLossless && (a.channels - b.channels) !== 0) return -Infinity - (a.channels - b.channels);
    if (b.isAtmos || b.isLossless) return Infinity;
    if (b.isAtmos && b.isLossless) return Infinity + 1;
    if (b.isAtmos && b.isLossless && (a.channels - b.channels) !== 0) return Infinity + (a.channels - b.channels);
    return b.channels - a.channels;
  });

  const ffmpegHWAccelSettings = [];
  const format = [];
  let ffmpegVideoEncoderSettings = [];
  let codec;

  // Setup HW Accel Settings
  if (hwAccelerate !== HWACCEL_OPTIONS.NONE) {
    response.infoLog += 'Using HW Accel!\n';
    const mode = hwaccelModeMap[hwAccelerate];
    codec = hwaccelEncoderMap[hwAccelerate][forceHevc ? 'hevc' : videoStreamUsesCodec];

    response.infoLog += `Using HW_ACCEL mode: ${mode}\n`;

    switch (hwAccelerate) {
      case HWACCEL_OPTIONS.INTEL_AMD_VAAPI:
      case HWACCEL_OPTIONS.INTEL_QUICKSYNC: // Maybe works :D
        ffmpegHWAccelSettings.push(`-hwaccel ${mode}`);
        ffmpegHWAccelSettings.push('-hwaccel_device /dev/dri/renderD128');
        ffmpegHWAccelSettings.push(`-hwaccel_output_format ${mode}`);

        if (is10BitEncoded) format.push('scale_vaapi=');

        break;
      // I do not have a nvidia GPU to try and set it up correctly
      case HWACCEL_OPTIONS.NVENC:
        ffmpegHWAccelSettings.push(`-hwaccel ${mode}`);
        break;
      default:
        response.infoLog += `Incorrect HW_ACCEL mode selected: ${mode}\n`;
        response.processFile = false;
        response.reQueueAfter = true;
        throw new Error(JSON.stringify(response));
    }
  } else {
    codec = forceHevc ? 'hevc' : videoStreamUsesCodec;
  }

  if (is10BitEncoded) format.push('format=p010');

  ffmpegVideoEncoderSettings.push(`-c:v:${videoStream.index} ${codec}`);

  if (isOverBitrate) {
    // only apply "-vf if over bitrate"
    if (!format.length) ffmpegVideoEncoderSettings.push(`-vf "${format.join('')}"`);

    ffmpegVideoEncoderSettings.push(`-preset slow -bufsize ${createBitRateStringFromBitRate(targetBitrate * 2)}`);

    // keep picture settings (also keeps HDR!)
    // eslint-disable-next-line no-unused-expressions
    videoStream.color_transfer && ffmpegVideoEncoderSettings.push(`-color_trc ${videoStream.color_transfer}`);
    // eslint-disable-next-line no-unused-expressions,max-len
    videoStream.chroma_location && ffmpegVideoEncoderSettings.push(`-chroma_sample_location ${videoStream.chroma_location}`);
    // eslint-disable-next-line no-unused-expressions
    videoStream.color_primaries && ffmpegVideoEncoderSettings.push(`-color_primaries ${videoStream.color_primaries}`);
    // eslint-disable-next-line no-unused-expressions
    videoStream.color_space && ffmpegVideoEncoderSettings.push(`-colorspace ${videoStream.color_space}`);
    // eslint-disable-next-line no-unused-expressions
    videoStream.color_range && ffmpegVideoEncoderSettings.push(`-color_range ${videoStream.color_range}`);

    response.infoLog += 'Is over target bitrate transcoding video!\n';
    // eslint-disable-next-line max-len
    ffmpegVideoEncoderSettings.push(`-b:v ${createBitRateStringFromBitRate(targetBitrate * 0.8)} -maxrate ${createBitRateStringFromBitRate(targetBitrate)}`);
  } else {
    response.infoLog += 'Is below bitrate copying video (re-muxing)!\n';

    // if we already are using HEVEC and forcing it replace everything with this to just remux
    if (forceHevc && videoStreamUsesHEVC) ffmpegVideoEncoderSettings = ['-c:v:0 copy'];
  }

  if (extractSubtitles.length) {
    const { ffmpegPath } = otherArguments;
    const { exec } = require('child_process');

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < totalSubtitles.length; i++) {
      const subStream = totalSubtitles[i];
      let lang = '';

      if (subStream.tags) {
        lang = subStream.tags.language;
      }

      const { index } = subStream;

      // eslint-disable-next-line no-continue
      if (!lang) continue;
      // eslint-disable-next-line no-continue
      if (!extractSubtitles.includes(lang)) continue;

      response.infoLog += 'Extracting sub\n';
      response.infoLog += `Sub Lang ${lang}\n`;

      const subsFile = fileName.split('.');

      // adds a lang to the filename and changes the extension to srt
      subsFile.splice(subsFile.length - 2, 0, lang);
      subsFile[subsFile.length - 1] = 'srt';
      const subsFileName = subsFile.join('.');

      // eslint-disable-next-line max-len
      const command = `${ffmpegPath} -i "${file.file}" -map 0:s:${index} "${subsFileName}" -map 0:s:${index} -c:s webvtt "${subsFileName.replace('srt', 'vtt')}"`;

      exec(command);
    }
  }

  if ((createOptimizedAudioTrack || createStereoAudioTrack) && (!hasOptimizedStream || !hasStereoStream)) {
    response.infoLog += 'Optimizing audio!\n';

    ffmpegVideoEncoderSettings.push('-map 0:v');

    // add all the wanted audio streams after the video
    // eslint-disable-next-line max-len
    audioStreamsInfo.forEach(({ index }, newIndex) => ffmpegVideoEncoderSettings.push(`-map 0:a:${index} -c:a:${newIndex} copy`));
  }

  // This takes the first stream as the best stream
  const [{ channels, isLossless, index: bestStreamOriginalIndex }] = audioStreamsInfo;

  let usedAudiMappingIndex = audioStreamsInfo.length;

  if (createOptimizedAudioTrack && !hasOptimizedStream) {
    const totalChannelCount = isLossless ? channels - 1 : channels;

    // length is index + 1
    ffmpegVideoEncoderSettings.push(`-map 0:a:${bestStreamOriginalIndex}`);
    // eslint-disable-next-line no-plusplus
    ffmpegVideoEncoderSettings.push(`-c:a:${usedAudiMappingIndex++} aac`);
    ffmpegVideoEncoderSettings.push(`-ac ${totalChannelCount}`);
  }

  // Todo do some ffmpeg dark magic with the stereo stream to properly downmix the center channel
  if (createStereoAudioTrack && !hasStereoStream && !hasOptimizedStereoStream) {
    ffmpegVideoEncoderSettings.push(`-map 0:a:${bestStreamOriginalIndex}`);
    // eslint-disable-next-line no-plusplus
    ffmpegVideoEncoderSettings.push(`-c:a:${usedAudiMappingIndex++} aac`); // Or OPUS? Plex loves opus though
    ffmpegVideoEncoderSettings.push('-ac 3'); // 3 or 2 for 2.1?
  }

  response.processFile = true;
  response.preset = [
    ffmpegHWAccelSettings.join(' '),
    '<io>',
    ffmpegVideoEncoderSettings.join(' '),
  ].join(' ');

  if (!hasSubtitles && !isOverBitrate && hasOptimizedStream && hasStereoStream) response.processFile = false;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
