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

// Returns the decode-side hwaccel preset for the input file. We only set
// `-hwaccel cuda` (without `-hwaccel_output_format cuda`) so decoded frames
// land in system memory rather than as CUDA hwframes. That keeps NVDEC
// acceleration but avoids "Function not implemented" failures when the
// encoder side specifies a pix_fmt incompatible with the GPU's hwframe
// format (e.g. `-pix_fmt p010le` for 10-bit output on an 8-bit yuv420p
// source). Returns '' for AV1 and unknown codecs so ffmpeg falls back to
// software decode on GPUs without the matching NVDEC unit.
const getNvdecHwaccelPreset = (file) => {
  const codec = getPrimaryVideoCodec(file);
  if (NVDEC_SUPPORTED_CODECS.includes(codec)) {
    return '-hwaccel cuda';
  }
  return '';
};

module.exports = {
  getNvdecHwaccelPreset,
  getPrimaryVideoCodec,
  NVDEC_SUPPORTED_CODECS,
};
