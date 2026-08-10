import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Normalize Audio Per Channel Layout',
  description:
    'Normalize audio with different LRA settings per channel layout. '
    + 'Surround tracks (5.1/7.1) get a wider LRA to preserve dynamics, '
    + 'while stereo/mono tracks get a tighter LRA for consistent volume. '
    + 'Uses per-track 2-pass loudnorm with individual measurement and normalization.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Target Integrated Loudness (LUFS)',
      name: 'i',
      type: 'string',
      defaultValue: '-24.0',
      inputUI: { type: 'text' },
      tooltip: `Target integrated loudness in LUFS (Loudness Units relative to Full Scale). \n
              Common values: \n
              -14.0 = Spotify / YouTube streaming standard \n
              -16.0 = Apple Music / AES streaming recommendation \n
              -23.0 = EBU R128 broadcast standard \n
              -24.0 = EBU R128 home cinema standard (default) \n`,
    },
    {
      label: 'LRA for Surround (5.1/7.1) tracks (LU)',
      name: 'lraSurround',
      type: 'string',
      defaultValue: '15.0',
      inputUI: { type: 'text' },
      tooltip: `Loudness Range for surround tracks (channels > 2). \n
              Higher values preserve more of the original dynamic range. \n
              15.0 = cinematic feel, explosions remain impactful (default) \n
              11.0 = moderate compression \n
              7.0 = heavy compression, less dynamic \n`,
    },
    {
      label: 'LRA for Stereo/Mono tracks (LU)',
      name: 'lraStereo',
      type: 'string',
      defaultValue: '7.0',
      inputUI: { type: 'text' },
      tooltip: `Loudness Range for stereo and mono tracks (channels <= 2). \n
              Lower values produce more consistent volume between quiet and loud sections. \n
              7.0 = dialogue and action close in volume, good for TV/headphones (default) \n
              5.0 = very compressed, ideal for nighttime viewing \n
              11.0 = moderate dynamics \n`,
    },
    {
      label: 'Target True Peak (dBTP)',
      name: 'tp',
      type: 'string',
      defaultValue: '-2.0',
      inputUI: { type: 'text' },
      tooltip: `Maximum true peak level in dBTP (decibels True Peak). \n
              Should be kept below 0 dBTP to prevent clipping. \n
              -1.0 = EBU R128 / streaming recommended ceiling \n
              -2.0 = Conservative headroom for lossy codec safety (default) \n`,
    },
    {
      label: 'Audio Bitrate Stereo (kbps)',
      name: 'bitrateStereo',
      type: 'string',
      defaultValue: '192',
      inputUI: { type: 'text' },
      tooltip: 'Output bitrate for stereo/mono tracks in kbps. Defaults to 192.',
    },
    {
      label: 'Audio Bitrate Surround (kbps)',
      name: 'bitrateSurround',
      type: 'string',
      defaultValue: '384',
      inputUI: { type: 'text' },
      tooltip: 'Output bitrate for surround tracks in kbps. Defaults to 384.',
    },
    {
      label: 'Max Gain (LU)',
      name: 'maxGain',
      type: 'string',
      defaultValue: '15',
      inputUI: { type: 'text' },
      tooltip: `Maximum gain in Loudness Units that will be applied per track. \n
              If the required gain exceeds this value, the track is copied without \n
              normalization to avoid amplifying noise in mostly-quiet files. \n
              Defaults to 15`,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

interface IAudioTrackInfo {
  audioIndex: number;
  channels: number;
  lra: string;
  bitrate: string;
  measuredI: string;
  measuredLra: string;
  measuredTp: string;
  measuredThresh: string;
  targetOffset: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const targetI = String(args.inputs.i);
  const lraSurround = String(args.inputs.lraSurround);
  const lraStereo = String(args.inputs.lraStereo);
  const targetTp = String(args.inputs.tp);
  const sanitizeBitrate = (val: string): string => val.replace(/[^0-9]/g, '');
  const bitrateStereo = sanitizeBitrate(String(args.inputs.bitrateStereo));
  const bitrateSurround = sanitizeBitrate(String(args.inputs.bitrateSurround));
  const maxGain = parseFloat(String(args.inputs.maxGain));

  const container = getContainer(args.inputFileObj._id);
  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${container}`;

  const audioTracks: IAudioTrackInfo[] = [];
  let audioIdx = 0;

  if (args.inputFileObj.ffProbeData?.streams) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i++) {
      const stream = args.inputFileObj.ffProbeData.streams[i];
      if (stream.codec_type === 'audio') {
        const channels = stream.channels || 2;
        const isSurround = channels > 2;
        audioTracks.push({
          audioIndex: audioIdx,
          channels,
          lra: isSurround ? lraSurround : lraStereo,
          bitrate: isSurround ? bitrateSurround : bitrateStereo,
          measuredI: '',
          measuredLra: '',
          measuredTp: '',
          measuredThresh: '',
          targetOffset: '',
        });
        audioIdx++;
      }
    }
  }

  if (audioTracks.length === 0) {
    args.jobLog('No audio tracks found, skipping normalization');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog(`Found ${audioTracks.length} audio track(s):`);
  audioTracks.forEach((t) => {
    args.jobLog(
      `  Audio #${t.audioIndex}: ${t.channels}ch -> LRA ${t.lra}, bitrate ${t.bitrate}k`,
    );
  });

  // Pass 1: Measure each audio track individually
  for (let t = 0; t < audioTracks.length; t++) {
    const track = audioTracks[t];
    args.jobLog(
      `\n--- Pass 1: Measuring audio track #${track.audioIndex} (${track.channels}ch) ---`,
    );

    const measureArgs: string[] = [
      '-i',
      args.inputFileObj._id,
      '-map',
      `0:a:${track.audioIndex}`,
      '-af',
      `loudnorm=I=${targetI}:LRA=${track.lra}:TP=${targetTp}:print_format=json`,
      '-f',
      'null',
      (args.platform === 'win32' ? 'NUL' : '/dev/null'),
    ];

    const cli = new CLI({
      cli: args.ffmpegPath,
      spawnArgs: measureArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath: '',
      inputFileObj: args.inputFileObj,
      logFullCliOutput: args.logFullCliOutput,
      updateWorker: args.updateWorker,
      args,
    });

    const res = await cli.runCli();

    if (res.cliExitCode !== 0) {
      args.jobLog(`FFmpeg measurement failed for audio track #${track.audioIndex}`);
      throw new Error(`FFmpeg measurement failed for audio track #${track.audioIndex}`);
    }

    const lines = res.errorLogFull;
    let idx = -1;

    lines.forEach((line: string, lineIdx: number) => {
      if (line.includes('Parsed_loudnorm')) {
        idx = lineIdx;
      }
    });

    if (idx === -1) {
      throw new Error(
        `Failed to find loudnorm data for track #${track.audioIndex}, please rerun`,
      );
    }

    const fullTail = lines.slice(idx).join('');

    const targetOffsetIdx = fullTail.lastIndexOf('target_offset');
    if (targetOffsetIdx === -1) {
      throw new Error(
        `Failed to find target_offset for track #${track.audioIndex}, please rerun`,
      );
    }

    const closingBraceIdx = fullTail.indexOf('}', targetOffsetIdx);
    if (closingBraceIdx === -1) {
      throw new Error(
        `Failed to find closing brace for track #${track.audioIndex}, please rerun`,
      );
    }

    const openingBraceIdx = fullTail.lastIndexOf('{', targetOffsetIdx);
    if (openingBraceIdx === -1) {
      throw new Error(
        `Failed to find opening brace for track #${track.audioIndex}, please rerun`,
      );
    }

    let measured;
    try {
      measured = JSON.parse(fullTail.slice(openingBraceIdx, closingBraceIdx + 1));
    } catch (e) {
      throw new Error(
        `Failed to parse loudnorm JSON for track #${track.audioIndex}: ${(e as Error).message}`,
      );
    }

    args.jobLog(`Track #${track.audioIndex} measured: ${JSON.stringify(measured)}`);

    const gainNeeded = parseFloat(targetI) - parseFloat(measured.input_i);
    args.jobLog(
      `Track #${track.audioIndex} gain required: ${gainNeeded.toFixed(2)} LU`
      + ` (max allowed: ${maxGain} LU)`,
    );

    if (gainNeeded > maxGain) {
      args.jobLog(
        `Skipping normalization for track #${track.audioIndex}: `
        + `required gain of ${gainNeeded.toFixed(2)} LU exceeds `
        + `max allowed gain of ${maxGain} LU.`,
      );
      track.measuredI = '';
    } else {
      track.measuredI = measured.input_i;
      track.measuredLra = measured.input_lra;
      track.measuredTp = measured.input_tp;
      track.measuredThresh = measured.input_thresh;
      track.targetOffset = measured.target_offset;
    }
  }

  // Check if any tracks need normalization
  const tracksToNormalize = audioTracks.filter((t) => t.measuredI !== '');

  if (tracksToNormalize.length === 0) {
    args.jobLog('No tracks require normalization (all exceeded max gain), skipping pass 2');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Pass 2: Apply normalization with per-track filters
  args.jobLog('\n--- Pass 2: Applying normalization ---');

  const pass2Args: string[] = [
    '-i',
    args.inputFileObj._id,
    '-map',
    '0',
    '-c',
    'copy',
  ];

  for (let t = 0; t < audioTracks.length; t++) {
    const track = audioTracks[t];

    if (track.measuredI === '') {
      args.jobLog(
        `Track #${track.audioIndex}: copying without normalization (gain too high)`,
      );
      pass2Args.push(`-c:a:${track.audioIndex}`, 'copy');
    } else {
      pass2Args.push(
        `-c:a:${track.audioIndex}`,
        'aac',
        `-b:a:${track.audioIndex}`,
        `${track.bitrate}k`,
        `-filter:a:${track.audioIndex}`,
        'loudnorm=print_format=summary:linear=true'
        + `:I=${targetI}:LRA=${track.lra}:TP=${targetTp}`
        + `:measured_i=${track.measuredI}`
        + `:measured_lra=${track.measuredLra}`
        + `:measured_tp=${track.measuredTp}`
        + `:measured_thresh=${track.measuredThresh}`
        + `:offset=${track.targetOffset}`,
      );
      args.jobLog(
        `Track #${track.audioIndex} (${track.channels}ch): `
        + `LRA=${track.lra}, bitrate=${track.bitrate}k`,
      );
    }
  }

  pass2Args.push(outputFilePath);

  const cli2 = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: pass2Args,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res2 = await cli2.runCli();

  if (res2.cliExitCode !== 0) {
    args.jobLog('Running FFmpeg normalization failed');
    throw new Error('FFmpeg normalization failed');
  }

  args.jobLog('Per-channel normalization complete!');

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};