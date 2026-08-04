import { getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { IpluginInputArgs } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import {
  ILoudnormValues,
  INormalizeAudioSettings,
  IworkingStream,
} from './renderTypes';
import {
  clone,
  getAudioCodecName,
  getStringInput,
  hasCodecOutputArg,
  parseNumberInput,
  shouldAddCopyCodec,
} from './renderUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

export const applyEnsureAudioStream = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const audioEncoder = String(inputs.audioEncoder);
  const langTag = String(inputs.language).toLowerCase();
  const wantedChannelCount = Number(inputs.channels);
  const enableBitrate = inputs.enableBitrate === true;
  const bitrate = String(inputs.bitrate);
  const enableSamplerate = inputs.enableSamplerate === true;
  const samplerate = String(inputs.samplerate);
  const audioCodec = getAudioCodecName(audioEncoder);

  const getHighest = (first: IworkingStream, second: IworkingStream) => {
    if ((first?.channels || 0) > (second?.channels || 0)) {
      return first;
    }
    return second;
  };

  const langMatch = (stream: IworkingStream, targetLangTag: string) => (
    (targetLangTag === 'und'
      && (stream.tags === undefined || stream.tags.language === undefined))
      || (stream?.tags?.language && stream.tags.language.toLowerCase().includes(targetLangTag))
  );

  const attemptMakeStream = (targetLangTag: string): { handled: boolean, changed: boolean } => {
    const streamsWithLangTag = streams.filter((stream) => (
      stream.codec_type === 'audio'
      && langMatch(stream, targetLangTag)
    ));

    if (streamsWithLangTag.length === 0) {
      args.jobLog(`No streams with language tag ${targetLangTag} found. Skipping \n`);
      return {
        handled: false,
        changed: false,
      };
    }

    const streamWithHighestChannel = streamsWithLangTag.reduce(getHighest);
    const highestChannelCount = Number(streamWithHighestChannel.channels);

    let targetChannels = 0;
    if (wantedChannelCount <= highestChannelCount) {
      targetChannels = wantedChannelCount;
      args.jobLog(`The wanted channel count ${wantedChannelCount} is <= than the`
        + ` highest available channel count (${streamWithHighestChannel.channels}). \n`);
    } else {
      targetChannels = highestChannelCount;
      args.jobLog(`The wanted channel count ${wantedChannelCount} is higher than the`
        + ` highest available channel count (${streamWithHighestChannel.channels}). \n`);
    }

    const hasStreamAlready = streams.filter((stream) => (
      !stream.removed
      && stream.codec_type === 'audio'
      && langMatch(stream, targetLangTag)
      && stream.codec_name === audioCodec
      && stream.channels === targetChannels
    ));

    if (hasStreamAlready.length > 0) {
      args.jobLog(`File already has ${targetLangTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);
      return {
        handled: true,
        changed: false,
      };
    }

    args.jobLog(`Adding ${targetLangTag} stream in ${audioEncoder}, ${targetChannels} channels \n`);

    const streamCopy: IworkingStream = {
      ...clone(streamWithHighestChannel),
      removed: false,
      index: streams.length,
      sourceIndex: streamWithHighestChannel.sourceIndex,
      codec_name: audioCodec,
      channels: targetChannels,
      outputArgs: [
        '-c:{outputIndex}',
        audioEncoder,
        '-ac:a:{outputTypeIndex}',
        `${targetChannels}`,
      ],
    };

    if (enableBitrate) {
      const ffType = getFfType(streamCopy.codec_type);
      streamCopy.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}`);
    }

    if (enableSamplerate) {
      streamCopy.outputArgs.push('-ar:a:{outputTypeIndex}', `${samplerate}`);
    }

    streams.push(streamCopy);

    return {
      handled: true,
      changed: true,
    };
  };

  const addedOrExists = attemptMakeStream(langTag);

  if (!addedOrExists.handled) {
    return attemptMakeStream('und').changed;
  }

  return addedOrExists.changed;
};

const getNormalizeAudioSettings = (inputs: Record<string, unknown>): INormalizeAudioSettings => ({
  i: getStringInput(inputs.i, '-23.0'),
  lra: getStringInput(inputs.lra, '7.0'),
  tp: getStringInput(inputs.tp, '-2.0'),
  maxGain: parseNumberInput(inputs.maxGain, 15),
});

const getNullOutputPath = (args: IpluginInputArgs): string => (
  String(args.platform || process.platform) === 'win32' ? 'NUL' : '/dev/null'
);

const getLoudnormFirstPassFilter = (settings: INormalizeAudioSettings): string => (
  `loudnorm=I=${settings.i}:LRA=${settings.lra}:TP=${settings.tp}:print_format=json`
);

const getLoudnormSecondPassFilter = (
  settings: INormalizeAudioSettings,
  values: ILoudnormValues,
): string => (
  `loudnorm=print_format=summary:linear=true:I=${settings.i}:LRA=${settings.lra}:TP=${settings.tp}:`
  + `measured_i=${values.input_i}:`
  + `measured_lra=${values.input_lra}:`
  + `measured_tp=${values.input_tp}:`
  + `measured_thresh=${values.input_thresh}:offset=${values.target_offset}`
);

type LoudnormRange = {
  min: number,
  max: number,
};

const loudnormSecondPassRanges: Record<keyof ILoudnormValues, LoudnormRange> = {
  input_i: { min: -99, max: 0 },
  input_tp: { min: -99, max: 99 },
  input_lra: { min: 0, max: 99 },
  input_thresh: { min: -99, max: 0 },
  target_offset: { min: -99, max: 99 },
};

const parseFiniteLoudnormNumber = (value: string): number | null => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const clamp = (value: number, range: LoudnormRange): number => Math.max(range.min, Math.min(range.max, value));

const normalizeClampedValue = (value: number): string => {
  if (Object.is(value, -0)) {
    return '0';
  }

  return String(value);
};

const sanitizeLoudnormValuesForSecondPass = (
  args: IpluginInputArgs,
  stream: IworkingStream,
  values: ILoudnormValues,
): ILoudnormValues | null => {
  const sanitizedValues: ILoudnormValues = { ...values };
  const adjustments: string[] = [];
  const rangeEntries = Object.entries(loudnormSecondPassRanges) as Array<[keyof ILoudnormValues, LoudnormRange]>;

  for (let i = 0; i < rangeEntries.length; i += 1) {
    const [key, range] = rangeEntries[i];
    const parsedValue = parseFiniteLoudnormNumber(values[key]);

    if (parsedValue === null) {
      args.jobLog(
        `Skipping normalization for stream ${stream.sourceIndex}: loudnorm returned non-finite ${key} value `
        + `${values[key]}.`,
      );
      return null;
    }

    const clampedValue = clamp(parsedValue, range);

    if (clampedValue !== parsedValue) {
      sanitizedValues[key] = normalizeClampedValue(clampedValue);
      adjustments.push(`${key} ${values[key]} -> ${sanitizedValues[key]}`);
    }
  }

  if (adjustments.length > 0) {
    args.jobLog(
      `Adjusted loudnorm values for stream ${stream.sourceIndex} to FFmpeg second-pass ranges: `
      + `${adjustments.join(', ')}.`,
    );
  }

  return sanitizedValues;
};

const parseLoudnormValues = (output: string): ILoudnormValues => {
  const loudnormIdx = output.lastIndexOf('Parsed_loudnorm');
  if (loudnormIdx === -1) {
    throw new Error('Failed to find loudnorm in report, please rerun');
  }

  const fullTail = output.slice(loudnormIdx);
  const targetOffsetIdx = fullTail.lastIndexOf('target_offset');
  if (targetOffsetIdx === -1) {
    throw new Error('Failed to find target_offset in loudnorm output, please rerun');
  }

  const closingBraceIdx = fullTail.indexOf('}', targetOffsetIdx);
  if (closingBraceIdx === -1) {
    throw new Error('Failed to find closing brace in loudnorm output, please rerun');
  }

  const openingBraceIdx = fullTail.lastIndexOf('{', targetOffsetIdx);
  if (openingBraceIdx === -1) {
    throw new Error('Failed to find opening brace in loudnorm output, please rerun');
  }

  const parsedValues = JSON.parse(fullTail.slice(openingBraceIdx, closingBraceIdx + 1)) as Record<string, unknown>;
  const getRequiredValue = (key: keyof ILoudnormValues): string => {
    const value = parsedValues[key];
    if (value === undefined || value === null || String(value).trim() === '') {
      throw new Error(`Failed to find ${key} in loudnorm output, please rerun`);
    }
    return String(value);
  };

  return {
    input_i: getRequiredValue('input_i'),
    input_tp: getRequiredValue('input_tp'),
    input_lra: getRequiredValue('input_lra'),
    input_thresh: getRequiredValue('input_thresh'),
    target_offset: getRequiredValue('target_offset'),
  };
};

const detectLoudnormValues = (
  args: IpluginInputArgs,
  stream: IworkingStream,
  settings: INormalizeAudioSettings,
): ILoudnormValues => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const childProcess = require('child_process');
  const ffmpegArgs = [
    '-i',
    args.inputFileObj._id,
    '-map',
    `0:${stream.sourceIndex}`,
    '-af',
    getLoudnormFirstPassFilter(settings),
    '-f',
    'null',
    getNullOutputPath(args),
  ];

  const result = childProcess.spawnSync(args.ffmpegPath, ffmpegArgs, {
    windowsHide: true,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error) {
    args.jobLog('Running FFmpeg failed');
    throw result.error;
  }

  if (result.status !== 0) {
    args.jobLog('Running FFmpeg failed');
    throw new Error('FFmpeg failed');
  }

  const loudnormValues = parseLoudnormValues(`${result.stdout || ''}${result.stderr || ''}`);
  args.jobLog(
    `Loudnorm first pass values returned for stream ${stream.sourceIndex}:  \n${JSON.stringify(loudnormValues)}`,
  );

  return loudnormValues;
};

const getLoudnormValuesIfGainAllowed = (
  args: IpluginInputArgs,
  stream: IworkingStream,
  settings: INormalizeAudioSettings,
): ILoudnormValues | null => {
  const loudnormValues = detectLoudnormValues(args, stream, settings);
  const measuredInputI = parseFiniteLoudnormNumber(loudnormValues.input_i);

  if (measuredInputI === null) {
    args.jobLog(
      `Skipping normalization for stream ${stream.sourceIndex}: loudnorm returned non-finite input_i value `
      + `${loudnormValues.input_i}.`,
    );
    return null;
  }

  const targetI = parseFiniteLoudnormNumber(settings.i);

  if (targetI === null) {
    args.jobLog(
      `Skipping normalization for stream ${stream.sourceIndex}: target loudness ${settings.i} is not finite.`,
    );
    return null;
  }

  const gainNeeded = targetI - measuredInputI;

  args.jobLog(
    `Gain required for stream ${stream.sourceIndex}: `
    + `${gainNeeded.toFixed(2)} LU (max allowed: ${settings.maxGain} LU)`,
  );

  if (gainNeeded > settings.maxGain) {
    args.jobLog(
      `Skipping normalization for stream ${stream.sourceIndex}: required gain of `
      + `${gainNeeded.toFixed(2)} LU exceeds max allowed gain of ${settings.maxGain} LU.`
      + ' File may be mostly quiet or noise.',
    );
    return null;
  }

  return sanitizeLoudnormValuesForSecondPass(args, stream, loudnormValues);
};

const appendNormalizeAudioOutputArgs = (
  stream: IworkingStream,
  settings: INormalizeAudioSettings,
  loudnormValues: ILoudnormValues,
): void => {
  stream.outputArgs.push('-filter:a:{outputTypeIndex}', getLoudnormSecondPassFilter(settings, loudnormValues));
};

export const applyNormalizeAudio = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const settings = getNormalizeAudioSettings(inputs);
  const audioStreams = streams.filter((stream) => !stream.removed && stream.codec_type === 'audio');
  const valuesBySourceIndex = new Map<number, ILoudnormValues | null>();
  let shouldProcess = false;

  if (audioStreams.length === 0) {
    args.jobLog('No audio streams found for Normalize Audio; skipping.');
    return false;
  }

  for (let i = 0; i < audioStreams.length; i += 1) {
    const stream = audioStreams[i];
    const sourceIndex = Number(stream.sourceIndex);
    let loudnormValues = valuesBySourceIndex.get(sourceIndex);

    if (!valuesBySourceIndex.has(sourceIndex)) {
      loudnormValues = getLoudnormValuesIfGainAllowed(args, stream, settings);
      valuesBySourceIndex.set(sourceIndex, loudnormValues);
    }

    if (loudnormValues) {
      appendNormalizeAudioOutputArgs(stream, settings, loudnormValues);
      shouldProcess = true;
    }
  }

  return shouldProcess;
};

export const applyAudioEncoder = (
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const audioEncoder = getStringInput(inputs.audioEncoder, '');
  if (audioEncoder === '') {
    return false;
  }

  const audioCodec = getAudioCodecName(audioEncoder);
  const forceEncoding = inputs.forceEncoding === true;
  const enableBitrate = inputs.enableBitrate === true;
  const bitrate = String(inputs.bitrate);
  const enableSamplerate = inputs.enableSamplerate === true;
  const samplerate = String(inputs.samplerate);
  let shouldProcess = false;

  streams.forEach((stream) => {
    if (stream.removed || stream.codec_type !== 'audio' || hasCodecOutputArg(stream.outputArgs)) {
      return;
    }

    const streamRequiresExplicitEncoder = !shouldAddCopyCodec(stream.outputArgs);

    if (
      forceEncoding
      || stream.codec_name !== audioCodec
      || streamRequiresExplicitEncoder
      || enableBitrate
      || enableSamplerate
    ) {
      const outputArgs = [
        '-c:{outputIndex}',
        audioEncoder,
      ];

      if (enableBitrate) {
        outputArgs.push('-b:a:{outputTypeIndex}', `${bitrate}`);
      }

      if (enableSamplerate) {
        outputArgs.push('-ar:a:{outputTypeIndex}', `${samplerate}`);
      }

      stream.outputArgs.unshift(...outputArgs);
      shouldProcess = true;
    }
  });

  return shouldProcess;
};
