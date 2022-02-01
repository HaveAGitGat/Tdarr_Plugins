// List any npm dependencies which the plugin needs, they will be auto installed when the plugin runs:
module.exports.dependencies = [
  'import-fresh',
];

const getStreamBitRate = (streamDuration, streamSize) => {
  const duration = streamDuration * 0.0166667;
  // eslint-disable-next-line no-bitwise
  return ~~(streamSize / (duration * 0.0075));
};

// eslint-disable-next-line consistent-return
const createBitRateFromString = (rate) => {
  // eslint-disable-next-line default-case
  switch (true) {
    case rate.includes('k'):
      return parseInt(rate.replace('k', ''), 10) * 1000;
    case rate.includes('M'):
      return parseInt(rate.replace('M'), 10) * 1000000;
  }
};

// eslint-disable-next-line max-len
const createBitRateStringFromBitRate = (rate) => (rate > 1000000
  ? `${Math.round((rate / 1000000) * 10) / 10}M`
  : `${Math.round((rate / 1000) * 10) / 10}k`);

const CODEC_TYPE = {
  VIDEO: 'video',
  AUDIO: 'audio',
  SUBTITLE: 'subtitle',
};

const CUSTOM_TAG = 'DAVE_THE_ONLY_JOB_DONE';

const AAC_AUDIO_STREAM = 'aac';

// const HDR_COLOR_SPACE = 'bt2020nc';
// const HDR_COLOR_TRANSFER = 'smpte2084';
const HDR_COLOR_PRIMARIES = 'bt2020';

const HWACCEL_OPTIONS = {
  NVENC: 'nvenc',
  INTEL_AMD: 'intel-amd',
  TOOLBOX: 'mac-toolbox',
};

const hwaccelModeMap = {
  [HWACCEL_OPTIONS.NVENC]: 'cuvid',
  [HWACCEL_OPTIONS.INTEL_AMD]: 'vaapi',
};

const hwaccelEncoderMap = {
  [HWACCEL_OPTIONS.NVENC]: {
    hevc: 'hevc_nvenc',
    h264: 'h264_nvenc',
  },
  [HWACCEL_OPTIONS.INTEL_AMD]: {
    hevc: 'hevc_vaapi',
    h264: 'h264_vaapi',
  },
  [HWACCEL_OPTIONS.TOOLBOX]: {
    hevc: 'hevc_videotoolbox',
    h264: 'h264_videotoolbox',
  },
};

const DDP_ATMOS_CODEC_TYPE = 'eac3';
const TRUEHD_ATMOS_CODEC_TYPE = 'truehd';
const ATMOS_CODECS = [DDP_ATMOS_CODEC_TYPE, TRUEHD_ATMOS_CODEC_TYPE];

const details = () => ({
  id: 'Tdarr_Plugin_DaveThe0nly_bullet',
  Stage: 'Pre-processing',
  Name: 'Bullet All in one Transcode',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Me',
  Version: '1.0',
  Tags: 'ffmpeg',
  Inputs: [
    {
      name: 'targetBitrate',
      type: 'text',
      description: 'In ffmpeg compatible format (8M, or 800k)',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'hwAccelerate',
      type: 'text',
      description: 'Keep blank if none',
      defaultValue: '',
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
        type: 'text',
      },
    },
    {
      name: 'createOptimizedAudioTrack',
      type: 'text',
      tooltip: 'Creates an optimized audio track for clients that do not support atmos, keep empty to not optimize',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'keepAudioTracks',
      type: 'text',
      tooltip: 'Keeps an audio track of selected language eng',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
    },
    {
      name: 'outputContainer',
      type: 'string',
      defaultValue: '.mp4',
      inputUI: {
        type: 'dropdown',
        options: ['.mp4', '.mkv'],
      },
    },
  ],
});

const plugin = (file, librarySettings, inputs) => {
  const lib = require('../methods/lib')();

  const {
    targetBitrate: _targetBitrate,
    outputContainer,
    hwAccelerate,
    forceHevc,
    createOptimizedAudioTrack,
    keepAudioTracks: _keepAudioTracks,
  } = lib.loadDefaultValues(inputs, details);

  const targetBitrate = createBitRateFromString(_targetBitrate);
  const keepAudioTracks = _keepAudioTracks.split(',');

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

  const isAlreadyProcessed = file.ffProbeData.tags[CUSTOM_TAG] === 'YES';

  if (isAlreadyProcessed) {
    response.processFile = false;
    response.infoLog += 'File already Processed! \n';
    return response;
  }

  if (file.fileMedium !== 'video') {
    response.processFile = false;
    response.infoLog += 'File is not a video. Exiting \n';
    return response;
  }

  // get all the info from video stream
  const [videoStream] = file.ffProbeData.streams.filter((stream) => stream.codec_type === CODEC_TYPE.VIDEO);
  const audioStreams = file.ffProbeData.streams.filter((stream) => stream.codec_type === CODEC_TYPE.AUDIO);

  // video setup
  const isHDRStream = videoStream.color_primaries === HDR_COLOR_PRIMARIES;
  const videoStreamUsesCodec = videoStream.codec_name;
  const videoStreamUsesHEVC = videoStreamUsesCodec === 'hevc' || videoStreamUsesCodec === 'x265';
  const pixelFormat = videoStream.pix_fmt;
  const is10BitEncoded = pixelFormat.includes('10le');
  // eslint-disable-next-line max-len
  const videoStreamBitRate = getStreamBitRate((file.meta.Duration !== 'undefined'
    ? file.meta.Duration
    : videoStream.duration), file.size);
  const isOverBitrate = videoStreamBitRate > targetBitrate;

  // audio setup
  const audioStreamInfo = [];
  let hasOptimizedStream = false;

  audioStreams.forEach((stream, index) => {
    const lang = (stream.tags.lang || stream.tags.language).toLowerCase();
    if (keepAudioTracks.includes(lang)) {
      if (stream.codec_name === AAC_AUDIO_STREAM) {
        response.infoLog += 'Found optimized audio stream\n';
        hasOptimizedStream = true;
      }
      audioStreamInfo.push({
        index,
        language: lang,
        isAtmos: ATMOS_CODECS.includes(stream.codec_name),
        isTrueHd: TRUEHD_ATMOS_CODEC_TYPE === stream.codec_name,
        codec: stream.codec_name,
        channels: parseInt(stream.channels),
      });
    }
  });

  if (!audioStreamInfo.length) {
    response.processFile = false;
    response.infoLog += 'No allowed audio stream available\n';
    return response;
  }

  const ffmpegHWAccelSettings = [];
  let ffmpegVideoEncoderSettings = [];

  // Setup HW Accel Settings
  if (inputs.hwAccelerate.length) {
    response.infoLog += 'Using HW Accel!\n';
    const mode = hwaccelModeMap[hwAccelerate];
    const codec = hwaccelEncoderMap[hwAccelerate][forceHevc ? 'hevc' : videoStreamUsesCodec];
    const format = [];

    // eslint-disable-next-line default-case
    switch (mode) {
      case HWACCEL_OPTIONS.INTEL_AMD:
        response.infoLog += 'Using VAAPI\n';
        ffmpegHWAccelSettings.push(`-hwaccel ${mode}`);
        ffmpegHWAccelSettings.push('-hwaccel_device /dev/dri/renderD128');
        ffmpegHWAccelSettings.push(`-hwaccel_output_format ${mode}`);
        format.push('scale_vappi=');

        if (is10BitEncoded) {
          format.push('format=p010');
        } else {
          format.push('format=p008');
        }

        break;
      case HWACCEL_OPTIONS.NVENC:
        response.infoLog += 'Using NVENC\n';
        ffmpegHWAccelSettings.push(`-hwaccel ${mode}`);
        break;
    }

    ffmpegVideoEncoderSettings.push(`-c:v:${videoStream.index} ${codec}`);
    ffmpegVideoEncoderSettings.push(format.join(''));
  }

  if (isHDRStream && videoStreamUsesHEVC) {
    response.infoLog += 'Keeping HDR stream\n';
    const HDRKeep = [];

    HDRKeep.push(`-color_primaries ${videoStream.color_primaries}`);
    HDRKeep.push(`-colorspace ${videoStream.color_space}`);
    HDRKeep.push(`-color_trc ${videoStream.color_transfer}`);
    HDRKeep.push(`-color_range ${videoStream.color_range}`);
    HDRKeep.push(`-chroma_location ${videoStream.chroma_location}`);

    ffmpegVideoEncoderSettings.push(HDRKeep.join(' '));
  }

  if (isOverBitrate) {
    response.infoLog += 'Is over target bitrate encoding!\n';
    // eslint-disable-next-line max-len
    ffmpegVideoEncoderSettings.push(`-b:v ${createBitRateStringFromBitRate(targetBitrate * 0.8)} -maxrate ${createBitRateStringFromBitRate(targetBitrate)}`);
  } else {
    response.infoLog += 'Is below bitrate copying codec and video (re-muxing)!\n';
    ffmpegVideoEncoderSettings = ['-c:v:0 copy'];
  }

  if (createOptimizedAudioTrack && !hasOptimizedStream) {
    response.infoLog += 'Optimizing audio!\n';
    const [bestAudioStream] = audioStreamInfo.sort((a, b) => {
      if (a.channels > b.channels && a) return a;
      return b;
    });

    const isTrueHDStream = bestAudioStream.isTrueHd;
    const totalStreamCount = isTrueHDStream ? bestAudioStream.channels - 1 : bestAudioStream.channels;

    ffmpegVideoEncoderSettings.push('-map 0:v');
    // add all the wanted audio streams after the video
    audioStreamInfo.forEach(({ index }) => ffmpegVideoEncoderSettings.push(`-map 0:${index}`));

    // add the new track after
    ffmpegVideoEncoderSettings.push(`-map 0:a:${bestAudioStream.index}`);
    // length is index + 1
    ffmpegVideoEncoderSettings.push(`-c:a:${audioStreamInfo.length} libfdk_aac`);
    ffmpegVideoEncoderSettings.push(`-ac ${totalStreamCount}`);

    ffmpegVideoEncoderSettings.push('-map 0:s?');
    ffmpegVideoEncoderSettings.push('-map 0:d?');
  }

  // Allows custom tags/metadata in mp4
  if (outputContainer.includes('mp4')) ffmpegVideoEncoderSettings.push('-movflags use_metadata_tags');

  ffmpegVideoEncoderSettings.push(`-map_metadata:g -1 -metadata ${CUSTOM_TAG}=YES `);

  response.processFile = true;
  response.preset = [
    [
      ffmpegHWAccelSettings.join(' '),
    ].filter(Boolean).join(' '),
    ffmpegVideoEncoderSettings.join(' '),
  ].join(` <io> -max_muxing_queue_size 8000 -map 0:${videoStream.index} `);

  return response;
};
