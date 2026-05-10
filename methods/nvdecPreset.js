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

const getNvdecHwaccelPreset = (file, options) => {
  const codec = getPrimaryVideoCodec(file);
  if (!NVDEC_SUPPORTED_CODECS.includes(codec)) {
    return '';
  }
  // softwareFrames: omit `-hwaccel_output_format cuda` so decoded frames land
  // in system memory. Use this for plugins whose filter chain or encoder
  // pix_fmt expects CPU frames (e.g. software crop/scale filters or
  // `-pix_fmt p010le`). Slightly slower than full-GPU but compatible with
  // arbitrary downstream filters.
  if (options && options.softwareFrames === true) {
    return '-hwaccel cuda';
  }
  return '-hwaccel cuda -hwaccel_output_format cuda';
};

// Returns the correct 10-bit output argument for the current decode path.
// When `-hwaccel_output_format cuda` is in use, frames live in GPU memory and
// an encoder-side `-pix_fmt p010le` fails with "Function not implemented"
// because ffmpeg can't apply a CPU pixel format to a hwframe without a
// `scale_cuda` step. When the decode path produces system-memory frames
// (software decode, or `-hwaccel cuda` without the output-format flag),
// `-pix_fmt p010le` works as expected.
//
// Pass the same `options` you pass to `getNvdecHwaccelPreset` so this helper
// stays consistent with the actual decode path being emitted.
const getNvenc10BitFormatArg = (file, options) => {
  if (options && options.softwareFrames === true) {
    return '-pix_fmt p010le ';
  }
  if (getNvdecHwaccelPreset(file) !== '') {
    return '-vf scale_cuda=format=p010le ';
  }
  return '-pix_fmt p010le ';
};

module.exports = {
  getNvdecHwaccelPreset,
  getNvenc10BitFormatArg,
  getPrimaryVideoCodec,
  NVDEC_SUPPORTED_CODECS,
};
