const supportedResolutions = ['320p', '480p', '576p', '720p', '1080p', '4KUHD', '8KUHD'];

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
      defaultValue: 5,
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
  } = lib.loadDefaultValues(inputs, details);

  const resolution = file.video_resolution === 'DCI4K' ? '4KUHD' : file.video_resolution;

  // If target bitrate is set, try and get it from the setting otherwise set to Infinity to ignore the resolution
  const targetBitrate = _targetBitrate
    ? createBitRateFromString(_targetBitrate.split(','))[resolution] || Infinity
    : Infinity;
  const keepAudioTracks = _keepAudioTracks.split(',');
  const extractSubtitles = _extractSubtitles.split(',');

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

  // video setup
  const videoStreamUsesCodec = videoStream.codec_name;
  const videoStreamUsesHEVC = videoStreamUsesCodec === 'hevc' || videoStreamUsesCodec === 'x265';
  // const pixelFormat = videoStream.pix_fmt;
  // const is10BitEncoded = (pixelFormat || '').includes('10le') || !!fileName.match(/10bit/gi);
  // eslint-disable-next-line max-len
  const videoStreamBitRate = file.bit_rate;
  const isHDRStream = videoStream.color_transfer === 'smpte2084' && videoStream.color_primaries === 'bt2020';

  response.infoLog += `Current Bitrate: ${videoStreamBitRate}\n`;
  response.infoLog += `Target Bitrate: ${targetBitrate}\n`;

  // If the resolution is supposed to not be change "targetBitrate" is going to be Infinity - therefore ignored
  // Can be 15% over target bitrate to get ignored
  const isOverBitrate = videoStreamBitRate > (targetBitrate * 1.15);

  // audio setup
  const audioStreamsToCreate = _createOptimizedAudioTrack.split(',')
    .map((track) => track.split(':'))
    .map(([codec, channels]) => ([codec, parseInt(channels, 10)]));
  const unsortedAudioStreamInfo = [];

  // subtitles
  const totalSubtitles = file.ffProbeData.streams.filter((row) => row.codec_type === 'subtitle');
  const hasSubtitles = totalSubtitles.length > 0;

  audioStreams.forEach((stream, index) => {
    const lang = (stream.tags.lang || stream.tags.language).toLowerCase();
    if (keepAudioTracks.length === 0 || keepAudioTracks.includes(lang)) {
      const channels = parseInt(stream.channels, 10);

      // eslint-disable-next-line max-len
      const exists = audioStreamsToCreate.findIndex(([stream_codec, stream_channel]) => stream_codec === stream.codec_name && stream_channel === channels);

      //  Removes stream if already exists
      if (exists > 0) audioStreamsToCreate.splice(exists, 1);

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

  ffmpegVideoEncoderSettings.push('-map 0:V');
  ffmpegVideoEncoderSettings.push(`-c:V:${videoStream.index} ${codec}`);

  if (isOverBitrate) {
    if (videoStreamUsesHEVC || forceHevc) {
      ffmpegVideoEncoderSettings.push(`-compression_level ${hevcCompressionLevel}`);
    } else if (!videoStreamUsesHEVC && !forceHevc) {
      const [preset, crf] = _x264quality.split(':');
      ffmpegVideoEncoderSettings.push(`-preset ${preset}`);
      ffmpegVideoEncoderSettings.push(`-crf ${crf}`);
    }

    ffmpegVideoEncoderSettings.push(`-bufsize ${createBitRateStringFromBitRate(targetBitrate * 2)}`);

    if (isHDRStream) ffmpegVideoEncoderSettings.push('-sei hdr');

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
    ffmpegVideoEncoderSettings = ['-map 0:V', '-c:V copy'];
  }

  ffmpegVideoEncoderSettings.push('-map_metadata 0');
  ffmpegVideoEncoderSettings.push('-map_chapters 0');

  audioStreamsInfo
    .forEach(({ index }, newIndex) => ffmpegVideoEncoderSettings.push(`-map 0:a:${index} -c:a:${newIndex} copy`));

  // This takes the first stream as the best stream
  const [{ index: bestStreamOriginalIndex, channels, codec: bestAudioStreamCodec }] = audioStreamsInfo;
  let usedAudioMappingIndex = audioStreamsInfo.length;

  if (audioStreamsToCreate) {
    response.infoLog += 'Adding new audio stream\n';
    audioStreamsToCreate.forEach(([audioCodec, audioChannels]) => {
      if (channels >= audioChannels) {
        ffmpegVideoEncoderSettings.push(`-map 0:a:${bestStreamOriginalIndex}`);
        ffmpegVideoEncoderSettings.push(`-c:a:${usedAudioMappingIndex} ${audioCodec}`);
        // eslint-disable-next-line no-plusplus
        ffmpegVideoEncoderSettings.push(`-ac:${usedAudioMappingIndex++} ${audioChannels}`);
      } else {
        response.infoLog += 'Best stream does not have enough channels\n';
      }
    });

    // Means no stream was created because we are lacking channels
    // Create the stream with the best stream count
    if (usedAudioMappingIndex === audioStreamsInfo.length) {
      response.infoLog += 'Creating optimized stream with channels from best stream\n';
      const newCodecsToCreate = audioStreamsToCreate
        .map(([audiCodec]) => audiCodec)
        .filter((val, index, self) => self.indexOf(val) === index);

      newCodecsToCreate.forEach((audioCodec) => {
        const alreadyHasStream = audioStreamsInfo.findIndex(({
          codec: existingStreamCodec,
          channels: existingStreamChannels,
        }) => existingStreamCodec === audioCodec && existingStreamChannels === channels);

        if (alreadyHasStream > -1) {
          response.infoLog += `Already existing ${audioCodec} with ${channels} channels\n`;
          // eslint-disable-next-line max-len
          let existing = audioStreamsToCreate.findIndex(([audioCodecToCreate, channelsToCreate]) => audioCodecToCreate === audioCodec && channelsToCreate > channels);
          while (existing > -1) {
            audioStreamsToCreate.splice(existing, 1);
            // eslint-disable-next-line max-len
            existing = audioStreamsToCreate.findIndex(([audioCodecToCreate, channelsToCreate]) => audioCodecToCreate === audioCodec && channelsToCreate > channels);
          }
        }

        if (alreadyHasStream === -1 && bestAudioStreamCodec !== audioCodec) {
          response.infoLog += `Creating ${audioCodec} with ${channels} channels\n`;
          ffmpegVideoEncoderSettings.push(`-map 0:a:${bestStreamOriginalIndex}`);
          ffmpegVideoEncoderSettings.push(`-c:a:${usedAudioMappingIndex} ${audioCodec}`);
          // eslint-disable-next-line no-plusplus
          ffmpegVideoEncoderSettings.push(`-ac:${usedAudioMappingIndex++} ${channels}`);
        }
      });
    }
  }

  if (extractSubtitles.length && _extractSubtitles !== 'none') {
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
      subsFile.splice(subsFile.length - 1, 0, lang);
      subsFile[subsFile.length - 1] = 'srt';
      const subsFileName = subsFile.join('.');

      ffmpegVideoEncoderSettings.push(`-map 0:s:${index} "${subsFileName}"`);
      ffmpegVideoEncoderSettings.push(`-map 0:s:${index} "${subsFileName.replace('srt', 'ass')}"`);
    }
    ffmpegVideoEncoderSettings.push('-sn');
  } else {
    ffmpegVideoEncoderSettings.push('-map 0:s? -c:s copy');
  }

  response.processFile = true;
  response.preset = [
    ffmpegHWAccelSettings.join(' '),
    '<io>',
    ffmpegVideoEncoderSettings.join(' '),
  ].join(' ');

  // eslint-disable-next-line max-len
  if ((_extractSubtitles === 'none' || !hasSubtitles) && !isOverBitrate && audioStreamsToCreate.length === 0) response.processFile = false;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
