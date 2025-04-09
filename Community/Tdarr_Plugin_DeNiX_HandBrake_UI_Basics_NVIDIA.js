const details = () => ({
  id: 'Tdarr_Plugin_DeNiX_HandBrake_UI_Basics_NVENC',
  Stage: 'Pre-processing',
  Name: 'DeNiX HandBrake UI Basic Options NVENC',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `
  This plugin provides basic HandBrake transcode options through a user-friendly UI. 
  It allows you to set various video and audio encoding parameters using HandBrake, 
  including video encoder, frame rate mode, and audio settings.
  
  Key Features:
  - Choose from a variety of NVIDIA NVENC video encoders such as nvenc_h264, nvenc_h265, nvenc_av1, nvenc_h265_10bit, nvenc_av1_10bit.
  - Select hardware decoder options or disable them.
  - Configure encoder presets, profiles, and levels for NVENC.
  - Set frame rate modes, including constant (CFR), variable (VFR), peak-limited (PFR), and bitrate (VB).
  - Specify video quality or bitrate values.
  - Select audio and subtitle languages, with options to keep or delete original tracks.
  - Enable or disable two-pass encoding for bitrate mode.
  
  This plugin is ideal for users who want to leverage HandBrake's powerful encoding capabilities 
  through a simplified and intuitive interface.

  ### Instructions for the User
  - **Frame Rate Mode:**
  - **Additional Parameters:**
    - If \`--cfr\` is selected, enter the quality value (e.g., \`-q 25\`).
    - If \`--vb\` is selected, enter the bitrate value (e.g., \`4000kb\`).
    - If \`--vfr\` or \`--pfr\` is selected, enter the quality value (e.g., \`-q 25\`).
  - **Two-Pass Encoding:** Only enable when using \`--vb\` mode. Two-pass encoding provides better quality by analyzing the video in the first pass and encoding it in the second pass.
  `,
  Version: '1.01',
  Tags: 'action',
  Inputs: [
    {
      name: 'container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'mkv',
          'mp4',
        ],
      },
      tooltip: 'Select the output container format. MKV supports more features and codecs than MP4, making it a versatile choice for high-quality videos.',
    },
    {
      name: 'videoEncoder',
      type: 'string',
      defaultValue: 'nvenc_h264',
      inputUI: {
        type: 'dropdown',
        options: [
          'nvenc_h264',
          'nvenc_h265',
          'nvenc_av1',
          'nvenc_h265_10bit',
          'nvenc_av1_10bit',
        ],
      },
      tooltip: 'Select the video encoder. Options include:\n' +
               'nvenc_h264: H.264 encoder using NVIDIA NVENC.\n' +
               'nvenc_h265: H.265 encoder using NVIDIA NVENC.\n' +
               'nvenc_av1: AV1 encoder using NVIDIA NVENC.\n' +
               'nvenc_h265_10bit: H.265 10-bit encoder using NVIDIA NVENC.\n' +
               'nvenc_av1_10bit: AV1 10-bit encoder using NVIDIA NVENC.',
    },
    {
      name: 'videoDecoder',
      type: 'string',
      defaultValue: 'nvdec',
      inputUI: {
        type: 'dropdown',
        options: [
          'nvdec',
          'disable',
        ],
      },
      tooltip: 'Select the video decoder. Options include:\n' +
               'nvdec: Use NVIDIA NVDEC for hardware-accelerated decoding.\n' +
               'disable: Do not use hardware acceleration for decoding.',
    },
    {
      name: 'nvencEncoderPreset',
      type: 'string',
      defaultValue: 'p7',
      inputUI: {
        type: 'dropdown',
        options: [
          'p1',
          'p2',
          'p3',
          'p4',
          'p5',
          'p6',
          'p7',
        ],
      },
      tooltip: 'Select the encoder preset for NVIDIA encoders. Options include:\n' +
               'p1: Slowest speed, highest quality.\n' +
               'p2: Slower speed, higher quality.\n' +
               'p3: Slow speed, high quality.\n' +
               'p4: Medium speed, medium quality.\n' +
               'p5: Fast speed, medium quality.\n' +
               'p6: Faster speed, lower quality.\n' +
               'p7: Fastest speed, lowest quality.',
    },
    {
      name: 'nvencEncoderProfile',
      type: 'string',
      defaultValue: 'auto',
      inputUI: {
        type: 'dropdown',
        options: [
          'main',
          'main10',
          'auto',
        ],
      },
      tooltip: 'Select the encoder profile for NVIDIA encoders. Options include:\n' +
               'main: Suitable for most use cases with good compatibility.\n' +
               'main10: Supports 10-bit video encoding for higher color depth.\n' +
               'auto: Automatically choose the best profile based on input and output settings.',
    },
    {
      name: 'encoderLevel',
      type: 'string',
      defaultValue: 'auto',
      inputUI: {
        type: 'dropdown',
        options: [
          'auto',
          '1.0',
          '1.1',
          '1.2',
          '1.3',
          '2.0',
          '2.1',
          '2.2',
          '3.0',
          '3.1',
          '3.2',
          '4.0',
          '4.1',
          '4.2',
          '5.0',
          '5.1',
          '5.2',
          '6.0',
          '6.1',
          '6.2',
        ],
      },
      tooltip: 'Select the encoder level for NVENC encoders. The level defines the maximum bitrate and resolution allowed. "auto" lets the encoder select the appropriate level based on the input video.',
    },
    {
      name: 'frameMode',
      type: 'string',
      defaultValue: '--cfr',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the frame rate mode. Options include:\n' +
               '--cfr: Constant Frame Rate.\nEnsures the output video has a constant frame rate.\nUseful for compatibility with some devices.\n' +
               '--vfr: Variable Frame Rate.\nAllows the frame rate to vary.\nUseful for reducing file size.\n' +
               '--pfr: Peak-Limited Variable Frame Rate.\nEnsures the frame rate does not exceed a certain peak.\n' +
               '--vb: Bitrate Variable Frame Rate.\nAdjusts the frame rate based on bitrate settings.\n' +
               'For --cfr, --vfr, or --pfr: Enter the quality value (e.g., "-q 25").',
    },
    {
      name: 'frameModeExtra',
      type: 'string',
      defaultValue: '-q 25',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter additional parameters for the selected frame rate mode. Examples:\n' +
               'For --cfr: Enter the quality value, e.g., "-q 25".\n' +
               'For --vb: Enter the bitrate value, e.g., "4000kb".\n' +
               'For --vfr or --pfr: Enter the quality value, e.g., "-q 25".',
    },
    {
      name: 'twoPass',
      type: 'boolean',
      defaultValue: false,
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'Enable or disable two-pass encoding for bitrate mode. Two-pass encoding provides better quality by analyzing the video in the first pass and encoding it in the second pass. Useful for achieving a consistent bitrate. Note: Only enable when using --vb mode.',
    },
    {
      name: 'audioLanguage',
      type: 'string',
      defaultValue: 'eng,tur,nld,und',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the desired audio languages as comma-separated ISO 639-2 codes (e.g., eng,tur,nld,und). The plugin will include all audio tracks that match the specified languages.',
    },
    {
      name: 'subtitleLanguage',
      type: 'string',
      defaultValue: 'eng,tur,nld,und',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the desired subtitle languages as comma-separated ISO 639-2 codes (e.g., eng,tur,nld,und). The plugin will include all subtitle tracks that match the specified languages.',
    },
    {
      name: 'keepSubtitles',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'Toggle to decide whether to keep all subtitles or only those matching the specified languages. "true" will keep only the specified languages. "false" will keep all subtitles.',
    },
    {
      name: 'audioLanguageOnly',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'Toggle to decide whether to keep all audio in the given language or keep all audio from the input. "true" will keep all audio in the given language. "false" will keep all audio from the input.',
    },
    {
      name: 'customAudioOptions',
      type: 'string',
      defaultValue: '--audio-copy-mask aac,ac3,eac3,truehd,dts,dtshd,mp3,flac --audio-fallback copy',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter any custom audio options. Default is to copy all common audio formats.\n\n' +
               '### Possible Commands:\n' +
               '- **--audio-lang-list**: Specify audio languages to keep (e.g., "eng,spa").\n' +
               '- **--audio-copy-mask**: Preserve specified audio codecs (e.g., "aac,ac3").\n' +
               '- **--audio-fallback**: Fallback audio codec if none match the mask (e.g., "copy").\n' +
               '- **--all-audio**: Keep all audio tracks.\n' +
               '- **--no-audio**: Remove all audio tracks.\n' +
               '- **--audio-bitrate**: Set the audio bitrate (e.g., "128k").\n' +
               '- **--audio-quality**: Set the audio quality (e.g., "5").\n\n' +
               '### Example Use Cases:\n' +
               '- Keep all audio tracks: `--all-audio`\n' +
               '- Keep only English and Spanish audio tracks: `--audio-lang-list eng,spa`\n' +
               '- Preserve AAC and AC3 codecs, fallback to copy: `--audio-copy-mask aac,ac3 --audio-fallback copy`\n' +
               '- Set audio bitrate to 128kbps: `--audio-bitrate 128k`\n' +
               '- Set audio quality to 5: `--audio-quality 5`',
    },
    {
      name: 'customArguments',
      type: 'string',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter any additional custom arguments to be passed to HandBrake. These arguments will be added to the command line for more advanced customization.\n\n' +
               '### Possible Commands:\n' +
               '- **--crop**: Set the crop values (e.g., "--crop 0:0:0:0").\n' +
               '- **--scale**: Set the output resolution (e.g., "--width 1920 --height 1080").\n' +
               '- **--rate**: Set the frame rate (e.g., "--rate 30").\n' +
               '- **--rotate**: Rotate the video (e.g., "--rotate=4").\n' +
               '- **--deinterlace**: Deinterlace the video (e.g., "--deinterlace").\n' +
               '- **--denoise**: Apply denoise filter (e.g., "--denoise=weak").\n' +
               '- **--deblock**: Apply deblock filter (e.g., "--deblock").\n' +
               '- **--custom-anamorphic**: Set custom anamorphic settings.\n\n' +
               '### Example Use Cases:\n' +
               '- Crop the video: `--crop 0:0:0:0`\n' +
               '- Scale to 1080p: `--width 1920 --height 1080`\n' +
               '- Set frame rate to 30fps: `--rate 30`\n' +
               '- Rotate video: `--rotate=4`\n' +
               '- Apply deinterlace filter: `--deinterlace`\n' +
               '- Apply denoise filter: `--denoise=weak`\n' +
               '- Apply deblock filter: `--deblock`\n' +
               '- Set custom anamorphic settings: `--custom-anamorphic`',
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  const response = {
    processFile: false,
    preset: '',
    container: '',
    handBrakeMode: true,
    FFmpegMode: false,
    reQueueAfter: false,
    infoLog: '',
  };

  const decoder = inputs.videoDecoder === 'disable' ? '--disable-hw-decoding' : `--enable-hw-decoding ${inputs.videoDecoder}`;

  const frameRateOptions = inputs.frameModeExtra || '';

  const audioLanguage = inputs.audioLanguage || 'eng,tur,nld,und';
  const subtitleLanguage = inputs.subtitleLanguage || 'eng,tur,nld,und';

  let keepSubs = '';
  if (inputs.keepSubtitles) {
    keepSubs = `--subtitle-lang-list ${subtitleLanguage}`;
  } else {
    keepSubs = '--all-subtitles';
  }

  let audioOptions = '';
  if (inputs.audioLanguageOnly) {
    audioOptions = `--audio-lang-list ${audioLanguage}`;
  } else {
    audioOptions = '--all-audio';
  }

  const customAudioOptions = inputs.customAudioOptions || '';

  const twoPass = inputs.twoPass ? '--two-pass' : '';

  const videoEncoder = inputs.videoEncoder || 'nvenc_h264';
  const nvencEncoderPreset = inputs.nvencEncoderPreset || 'p7';
  const nvencEncoderProfile = inputs.nvencEncoderProfile || 'auto';
  const encoderLevel = inputs.encoderLevel || 'auto';
  const container = inputs.container || 'mkv';

  const customArguments = inputs.customArguments || '';

  response.preset = `${decoder} -e ${videoEncoder} --encoder-preset ${nvencEncoderPreset} --encoder-profile ${nvencEncoderProfile} --encoder-level ${encoderLevel} ${inputs.frameMode} ${frameRateOptions} ${audioOptions} ${customAudioOptions} ${keepSubs} ${twoPass} ${customArguments}`;
  response.container = `.${container}`;
  response.handBrakeMode = true;
  response.FFmpegMode = false;
  response.reQueueAfter = true;
  response.processFile = true;
  response.infoLog += 'File is being transcoded using HandBrake \n';

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
