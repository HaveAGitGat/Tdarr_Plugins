// Codecs whose decoder is supported by NVDEC across the GPU generations Tdarr
// users commonly run (Maxwell-2nd-gen and newer). AV1 is intentionally excluded:
// AV1 NVDEC only exists on Ampere (RTX 30xx) and later, so forcing CUDA hwaccel
// on older GPUs produces empty output instead of falling back to software decode.
const NVDEC_SUPPORTED_CODECS = [
  'h263',
  'h264',
  'hevc',
  'mjpeg',
  'mpeg1video',
  'mpeg2video',
  'mpeg4',
  'vc1',
  'vp8',
  'vp9',
];

// Picks the first non-attached-pic video stream's codec, falling back to
// file.video_codec_name (Tdarr's pre-computed first-video-stream codec) and
// finally ''. Walking the stream list ourselves avoids picking up cover-art
// codecs on files where the attached picture is stream 0.
const getPrimaryVideoCodec = (file) => {
  const streams = (file && file.ffProbeData && file.ffProbeData.streams) || [];
  const videoStream = streams.find((s) => (
    s
    && s.codec_type === 'video'
    && !(s.disposition && s.disposition.attached_pic === 1)
  ));
  if (videoStream && videoStream.codec_name) {
    return videoStream.codec_name;
  }
  return (file && file.video_codec_name) || '';
};

const getNvdecHwaccelPreset = (file) => {
  const codec = getPrimaryVideoCodec(file);
  if (NVDEC_SUPPORTED_CODECS.includes(codec)) {
    return '-hwaccel cuda -hwaccel_output_format cuda';
  }
  return '';
};

module.exports = {
  getNvdecHwaccelPreset,
  getPrimaryVideoCodec,
  NVDEC_SUPPORTED_CODECS,
};
