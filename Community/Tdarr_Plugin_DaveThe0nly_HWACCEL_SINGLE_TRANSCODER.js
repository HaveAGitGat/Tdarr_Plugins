const supportedResolutions = ['320p', '480p', '576p', '720p', '1080p', '4KUHD', '8KUHD'];

const subtitleDispositionMap = {
  forced: 'forced',
  hearing_impaired: 'sdh',
};

const image_subtitle_codec = ['dvbsub', 'dvdsub', 'dvd_subtitle', 'pgssub', 'xsub', 'hdmv_pgs_subtitle'];

const CODEC_TYPE = {
  VIDEO: 'video',
  AUDIO: 'audio',
  SUBTITLE: 'subtitle',
};

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
  const [resolution, rate] = resolutionWithRate.split(':');

  // eslint-disable-next-line max-len
  if (!supportedResolutions.includes(resolution)) throw new Error(`Unsupported Resolution: ${resolution}, supported are only ${supportedResolutions.join(', ')}`);

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
      name: 'hevcCompressionLevel',
      type: 'number',
      tooltip: 'Sets the compression level for HEVC transcoding (1-7)',
      defaultValue: 7,
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'x264quality',
      type: 'string',
      tooltip: 'Sets quality of x264 being preset:crf (veryfast:27) being default',
      defaultValue: 'veryfast:27',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'createOptimizedAudioTrack',
      type: 'text',
      tooltip: 'Creates an optimized audio track/s codec:channels (aac:2,ac3:6)',
      defaultValue: 'ac3:6,aac:6,aac:3',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'keepAudioTracks',
      type: 'string',
      tooltip: 'Keeps an audio track of selected language/s, separated by ",", if empty all are kept',
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
        options: ['.mp4', '.mkv', 'keep'],
      },
    },
    {
      name: 'extractSubtitles',
      type: 'string',
      tooltip: 'Extracts subtitles by language from the file',
      defaultValue: 'none',
      inputUI: {
        type: 'string',
      },
    },
    {
      name: 'subtitleFormat',
      type: 'string',
      tooltip: 'Comma separated list of subtitle formats to create',
      defaultValue: 'srt,ass', // most compatible with plex
      inputUI: {
        type: 'string',
      },
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();

  const {
    targetResolutionBitrate: _targetBitrate,
    extractSubtitles: _extractSubtitles,
    outputContainer,
    hwAccelerate,
    forceHevc,
    createOptimizedAudioTrack: _createOptimizedAudioTrack,
    keepAudioTracks: _keepAudioTracks,
    hevcCompressionLevel,
    x264quality: _x264quality,
    subtitleFormat: _subtitleFormat,
  } = lib.loadDefaultValues(inputs, details);

  const resolution = file.video_resolution === 'DCI4K' ? '4KUHD' : file.video_resolution;

  // If target bitrate is set, try and get it from the setting otherwise set to Infinity to ignore the resolution
  const targetBitrate = _targetBitrate
    ? createBitRateFromString(_targetBitrate.split(','))[resolution] || Infinity
    : Infinity;
  const keepAudioTracks = _keepAudioTracks.split(',');
  const extractSubtitles = _extractSubtitles.split(',');
  const subtitleFormat = _subtitleFormat.split(',');

  const response = {
    processFile: false,
    preset: '',
    container: outputContainer === 'keep' ? `.${file.container}` : outputContainer,
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
  const subtitleStreams = file.ffProbeData.streams.filter((stream) => stream.codec_type === CODEC_TYPE.SUBTITLE);

  // video setup
  const videoStreamUsesCodec = videoStream.codec_name;
  const videoStreamUsesHEVC = videoStreamUsesCodec === 'hevc' || videoStreamUsesCodec === 'x265';
  const pixelFormat = videoStream.pix_fmt;
  const is10BitEncoded = (pixelFormat || '').includes('10le') || !!fileName.match(/10bit/gi);
  // eslint-disable-next-line max-len
  const videoStreamBitRate = file.bit_rate;
  const isHDRStream = videoStream.color_transfer === 'smpte2084' && videoStream.color_primaries === 'bt2020';

  // subtitles
  const hasSubtitles = subtitleStreams.length > 0;

  response.infoLog += '_________Checking Bitrate___________\n';

  const originalBitrate = originalLibraryFile.bit_rate;

  response.infoLog += `Original File: ${originalBitrate}\n`;
  response.infoLog += `Current Bitrate: ${videoStreamBitRate}\n`;
  response.infoLog += `Target Bitrate: ${targetBitrate}\n`;

  // If the resolution is supposed to not be change "targetBitrate" is going to be Infinity - therefore ignored
  // Can be 15% over target bitrate to get ignored
  // If the original bitrate is over the current bitrate it was already processed QVBR
  // sometimes gives higher bitrate than set
  const bufferedTargetBitrate = targetBitrate * 1.25;
  let isOverBitrate = false;

  if (originalBitrate === videoStreamBitRate) isOverBitrate = videoStreamBitRate > bufferedTargetBitrate;

  response.infoLog += '_________Figuring HW Accel___________\n';

  const ffmpegHWAccelSettings = [];
  let ffmpegVideoEncoderSettings = ['-max_muxing_queue_size 9999'];
  let codec;
  const format = [];

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

        format.push('scale_vaapi=');

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

  response.infoLog += '_________Figuring out video settings___________\n';

  ffmpegVideoEncoderSettings.push(`-map 0:${videoStream.index}`);
  ffmpegVideoEncoderSettings.push(`-c:V:0 ${codec}`);

  if (isOverBitrate) {
    response.infoLog += 'Video stream is over bitrate transcoding\n';

    if (videoStreamUsesHEVC || forceHevc) {
      response.infoLog += 'Video is HEVC\n';
      ffmpegVideoEncoderSettings.push(`-rc_mode QVBR -compression_level ${hevcCompressionLevel}`);
    } else if (!videoStreamUsesHEVC && !forceHevc) {
      response.infoLog += `Video is x264 using preset: ${_x264quality}`;
      const [preset, crf] = _x264quality.split(':');
      ffmpegVideoEncoderSettings.push(`-preset:V:0 ${preset}`);
      ffmpegVideoEncoderSettings.push(`-crf:V:0 ${crf}`);
    }

    ffmpegVideoEncoderSettings.push(`-bufsize ${createBitRateStringFromBitRate(targetBitrate * 5)}`);

    if (is10BitEncoded) {
      format.push('format=p010');
    } else {
      format.push('format=nv12');
    }

    ffmpegVideoEncoderSettings.push(`-vf ${format.join('')}`);

    // eslint-disable-next-line max-len
    ffmpegVideoEncoderSettings.push(`-b:V:0 ${createBitRateStringFromBitRate(targetBitrate * 0.8)} -maxrate:V:0 ${createBitRateStringFromBitRate(targetBitrate)}`);

    if (isHDRStream) {
      ffmpegVideoEncoderSettings.push('-sei hdr');
    }

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
  } else {
    response.infoLog += 'Is below bitrate copying video (re-muxing/copying video source)!\n';

    // if we already are using HEVEC and forcing it replace everything with this to just remux
    ffmpegVideoEncoderSettings = ['-map 0:V:0', '-c:V:0 copy'];
  }

  ffmpegVideoEncoderSettings.push('-map_metadata 0');
  ffmpegVideoEncoderSettings.push('-map_chapters 0');

  response.infoLog += '_________Figuring out audio streams___________\n';

  // audio setup
  // eslint-disable-next-line no-underscore-dangle
  const _audioStreamsToCreate = _createOptimizedAudioTrack.split(',')
    .map((track) => track.split(':'))
    .map(([audioCodec, channels]) => ([audioCodec, parseInt(channels, 10)]));
  const unsortedAudioStreamInfo = [];

  response.infoLog += `User wants these streams created: ${JSON.stringify(_audioStreamsToCreate)}\n`;
  response.infoLog += `User wants to keep these streams: ${_keepAudioTracks}\n`;

  audioStreams.forEach((stream) => {
    // Probably english but I would not bet on it
    const lang = (stream.tags.lang || stream.tags.language || '').toLowerCase();
    if (keepAudioTracks.length === 0 || keepAudioTracks.includes(lang || 'eng')) {
      const channels = parseInt(stream.channels, 10);

      // eslint-disable-next-line max-len
      response.infoLog += `Keeping audio track:
      - codec: ${stream.codec_name}
      - lang: ${lang}
      - channels: ${channels}
      - atmos: ${ATMOS_CODECS.includes(stream.codec_name)}\n`;

      unsortedAudioStreamInfo.push({
        index: stream.index,
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

  audioStreamsInfo
    .forEach(({ index, language }, newIndex) => {
      ffmpegVideoEncoderSettings.push(`-map 0:${index} -c:a:${newIndex} copy`);
      if (!language) ffmpegVideoEncoderSettings.push(`-metadata:s:a:${newIndex} language=eng`);
    });

  // This takes the first stream as the best stream to derive new ones from
  const [
    {
      index: bestStreamOriginalIndex, channels: bestStreamChannels, codec: bestAudioStreamCodec, ...bestAudioStream
    },
  ] = audioStreamsInfo;

  response.infoLog += `Best stream selected as:
  - codec: ${bestAudioStreamCodec}
  - channels: ${bestStreamChannels}\n`;

  // eslint-disable-next-line max-len
  const audioStreamsToCreate = (_createOptimizedAudioTrack !== 'none'
    ? _audioStreamsToCreate
    : []).reduce((acc, [toCreateCodec, toCreateChannels]) => {
    response.infoLog += `${toCreateCodec} ${toCreateChannels}\n`;

    let finalToCreateChannels = toCreateChannels;

    // If the best stream does not have enough channels, use only best stream channels
    if (toCreateChannels > bestStreamChannels) {
      response.infoLog += `Not enough channels to create ${toCreateChannels}, falling back to ${bestStreamChannels}\n`;
      finalToCreateChannels = bestStreamChannels;
    }

    // First check if the stream already exists
    // eslint-disable-next-line max-len
    const exists = audioStreamsInfo.findIndex(({
      codec: existingCodec,
      channels: existingChannels,
    }) => existingCodec === toCreateCodec && finalToCreateChannels === existingChannels);
    // check if we don't have the same stream
    const alreadyHasStream = acc.findIndex((inacc) => inacc[0] === toCreateCodec && inacc[1] === finalToCreateChannels);

    if (alreadyHasStream === -1 && exists === -1) {
      acc.push([toCreateCodec, finalToCreateChannels]);
    } else {
      // eslint-disable-next-line max-len
      response.infoLog += `Stream with codec: ${toCreateCodec} and channels ${finalToCreateChannels} already exists, not creating\n`;
    }

    return acc;
  }, []);

  if (audioStreamsToCreate.length > 0) {
    audioStreamsToCreate.forEach(([audioCodec, audioChannels], index) => {
      const audioIndex = index + audioStreamsInfo.length;
      response.infoLog += `Adding new audio stream - codec: ${audioCodec}, channels: ${audioChannels}\n`;
      // eslint-disable-next-line max-len
      ffmpegVideoEncoderSettings.push(`-map 0:a:0 -c:a:${audioIndex} ${audioCodec} -ac:a:${audioIndex} ${audioChannels} -metadata:s:a:${audioIndex} language=${bestAudioStream.language || 'eng'}`);
    });
  }

  if (extractSubtitles.length && _extractSubtitles !== 'none' && hasSubtitles) {
    response.infoLog += '_________Figuring out subtitles___________\n';
    const subtitlesToExtract = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < subtitleStreams.length; i++) {
      const subStream = subtitleStreams[i];
      let lang = '';

      if (subStream.tags) {
        lang = subStream.tags.language;
      }

      const { index } = subStream;

      if (image_subtitle_codec.includes(subStream.codec_name)) {
        response.infoLog += 'Image based subtitltes! Skipping\n';
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!lang) {
        response.infoLog += `language not set: ${lang}\n`;
        // eslint-disable-next-line no-continue
        if (subtitleStreams.length !== 1) continue;
        // assume if we have only one sub stream that it is eng
        lang = 'eng';
      }

      if (!extractSubtitles.includes(lang)) {
        response.infoLog += `${lang} is not wanted\n`;
        // eslint-disable-next-line no-continue
        continue;
      }

      const { forced, hearing_impaired } = subStream.disposition;

      const isForced = !!forced || (subStream.tags.title || subStream.tags.handler_name || '').includes('forced');
      // eslint-disable-next-line max-len
      const isSDH = !!hearing_impaired || !!(subStream.tags.title || subStream.tags.handler_name || '').match(/(SDH|CC)/gi);

      response.infoLog += `Extracting sub: ${lang}\n`;

      // removes file name
      const fileWithoutExtension = fileName.replace(/\.[a-z0-9]+$/gi, '');

      subtitleFormat.forEach((subtitleExtension) => {
        const subsFile = [fileWithoutExtension, lang];
        if (isSDH) subsFile.push(subtitleDispositionMap.hearing_impaired);
        if (isForced) subsFile.push(subtitleDispositionMap.forced);

        subsFile.push(subtitleExtension);
        subtitlesToExtract.push(`-map 0:${index} '${subsFile.join('.')}'`);
      });
    }

    if (hasSubtitles) {
      // Needs to go first to make it easy for output mapping
      ffmpegVideoEncoderSettings.unshift(`${subtitlesToExtract.join(' ')} -sn`);
    }
  } else {
    ffmpegVideoEncoderSettings.push('-map 0:s? -c:s copy');
  }

  response.processFile = true;
  response.preset = [
    '-y',
    (isOverBitrate ? ffmpegHWAccelSettings : []).join(' '),
    '<io>',
    ffmpegVideoEncoderSettings.join(' '),
  ].join(' ');

  response.infoLog += `_____Filter Flags:____
    _extractSubtitles: ${_extractSubtitles}
    hasSubtitles: ${hasSubtitles}
    isOverBitrate: ${isOverBitrate}
    audioStreamsToCreate: ${audioStreamsToCreate.length}
  `;

  // eslint-disable-next-line max-len
  if ((_extractSubtitles === 'none' || !hasSubtitles) && !isOverBitrate && audioStreamsToCreate.length === 0) {
    response.infoLog = 'Video already processed! Skipping!';
    response.processFile = false;
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
