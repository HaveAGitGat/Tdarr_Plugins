import {
  IffmpegCommandV2Operation,
  IpluginInputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import {
  getContainer,
  getFfType,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import { getEncoder, IgetEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import { checkFfmpegCommandV2Init } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

interface IworkingStream extends Istreams {
  removed: boolean,
  sourceIndex: number,
  outputArgs: string[],
  encoder?: IgetEncoder,
  hardwareDecoding?: boolean,
  cropFilter?: string,
}

export type IffmpegCommandV2WorkingStream = IworkingStream;

interface IresolutionBoundary {
  resolution: string,
  widthMin: number,
  widthMax: number,
  heightMin: number,
  heightMax: number,
}

interface ICropValues {
  w: number,
  h: number,
  x: number,
  y: number,
}

interface ICropDetectionSettings {
  cropMode: string,
  cropThreshold: number,
  sampleCount: number,
  framesPerSample: number,
  minCropPercent: number,
}

interface ICropTargetStream {
  stream: IworkingStream,
  width: number,
  height: number,
}

interface INormalizeAudioSettings {
  i: string,
  lra: string,
  tp: string,
  maxGain: number,
}

interface ILoudnormValues {
  input_i: string,
  input_tp: string,
  input_lra: string,
  input_thresh: string,
  target_offset: string,
}

export interface IffmpegCommandV2RenderResult {
  spawnArgs: string[],
  shouldProcess: boolean,
  container: string,
  streams: IffmpegCommandV2WorkingStream[],
}

const singletonOperationTypes = [
  'setVideoEncoder',
  'setVideoResolution',
  'setVideoFramerate',
  'setVideoBitrate',
  'setContainer',
  'reorderStreams',
  'cropBlackBars',
  'normalizeAudio',
] as const;

type SingletonOperationType = typeof singletonOperationTypes[number];
type ISingletonOperationInputs = Partial<Record<SingletonOperationType, Record<string, unknown>>>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const createInitialWorkingStreams = (args: IpluginInputArgs): IworkingStream[] => {
  try {
    const streams = clone(args.inputFileObj.ffProbeData.streams);
    if (!Array.isArray(streams)) {
      throw new Error('FFprobe streams is not an array');
    }

    return streams.map((stream: Istreams) => {
      const normalizedStream = {
        ...stream,
      };

      if (Number(stream?.disposition?.attached_pic) === 1) {
        normalizedStream.codec_type = 'attachment';
      }

      return {
        ...normalizedStream,
        removed: false,
        sourceIndex: stream.index,
        outputArgs: [],
      };
    });
  } catch (err) {
    const message = `Error parsing FFprobe streams, it seems FFprobe could not scan the file: ${JSON.stringify(err)}`;
    args.jobLog(message);
    throw new Error(message);
  }
};

const splitArgs = (args: IpluginInputArgs, value: unknown): string[] => {
  const rawValue = String(value || '').trim();

  if (rawValue === '') {
    return [];
  }

  const parseArgsStringToArgv = args?.deps?.parseArgsStringToArgv;
  if (typeof parseArgsStringToArgv === 'function') {
    try {
      const parsedArgs = parseArgsStringToArgv(rawValue, '', '');

      if (Array.isArray(parsedArgs)) {
        return parsedArgs.map((row) => String(row).trim()).filter((row) => row !== '');
      }
    } catch (err) {
      // Fall back to v1-compatible splitting if the injected parser is unavailable.
    }
  }

  return rawValue
    .split(' ')
    .map((row) => row.trim())
    .filter((row) => row !== '');
};

const parseNumberInput = (value: unknown, defaultValue: number): number => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue;
  }

  if (typeof value !== 'string') {
    return defaultValue;
  }

  const trimmedValue = value.trim();
  if (trimmedValue === '') {
    return defaultValue;
  }

  const parsed = Number(trimmedValue);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const getStringInput = (value: unknown, defaultValue: string): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue === '' ? defaultValue : trimmedValue;
};

const parseCropValues = (output: string): ICropValues[] => {
  const results: ICropValues[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/crop=(\d+):(\d+):(\d+):(\d+)/);
    if (match) {
      results.push({
        w: parseInt(match[1], 10),
        h: parseInt(match[2], 10),
        x: parseInt(match[3], 10),
        y: parseInt(match[4], 10),
      });
    }
  }

  return results;
};

const selectCrop = (crops: ICropValues[], mode: string): ICropValues | null => {
  if (crops.length === 0) {
    return null;
  }

  if (mode === 'minimum') {
    let result = crops[0];

    for (let i = 1; i < crops.length; i += 1) {
      if ((crops[i].w * crops[i].h) > (result.w * result.h)) {
        result = crops[i];
      }
    }

    return result;
  }

  if (mode === 'maximum') {
    let result = crops[0];

    for (let i = 1; i < crops.length; i += 1) {
      if ((crops[i].w * crops[i].h) < (result.w * result.h)) {
        result = crops[i];
      }
    }

    return result;
  }

  const counts = new Map<string, { count: number, crop: ICropValues }>();

  for (let i = 0; i < crops.length; i += 1) {
    const key = `${crops[i].w}:${crops[i].h}:${crops[i].x}:${crops[i].y}`;
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, crop: crops[i] });
    }
  }

  let bestCount = 0;
  let bestCrop: ICropValues | null = null;

  counts.forEach((entry) => {
    if (entry.count > bestCount) {
      bestCount = entry.count;
      bestCrop = entry.crop;
    }
  });

  return bestCrop;
};

const getOperations = (
  operations: IffmpegCommandV2Operation[],
  operationType: string,
): IffmpegCommandV2Operation[] => operations.filter((operation) => operation.operationType === operationType);

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((row) => stableStringify(row)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }

  const primitiveValue = JSON.stringify(value);
  return primitiveValue === undefined ? String(value) : primitiveValue;
};

const getSingletonOperationInputs = (
  args: IpluginInputArgs,
  operations: IffmpegCommandV2Operation[],
  operationType: SingletonOperationType,
): Record<string, unknown> | undefined => {
  const matches = getOperations(operations, operationType);
  if (matches.length === 0) {
    return undefined;
  }

  const firstInputs = matches[0].inputs || {};
  const firstInputsKey = stableStringify(firstInputs);
  const hasConflict = matches.some((operation) => stableStringify(operation.inputs || {}) !== firstInputsKey);

  if (hasConflict) {
    const message = `Conflicting FFmpeg command v2 ${operationType} operations found.`
      + ` Use one ${operationType} operation.`;
    args.jobLog(message);
    throw new Error(message);
  }

  return firstInputs;
};

const resolveSingletonOperationInputs = (
  args: IpluginInputArgs,
  operations: IffmpegCommandV2Operation[],
): ISingletonOperationInputs => {
  const resolvedInputs: ISingletonOperationInputs = {};

  singletonOperationTypes.forEach((operationType) => {
    const inputs = getSingletonOperationInputs(args, operations, operationType);
    if (inputs) {
      resolvedInputs[operationType] = inputs;
    }
  });

  return resolvedInputs;
};

const hasOperation = (operations: IffmpegCommandV2Operation[], operationType: string): boolean => (
  getOperations(operations, operationType).length > 0
);

const getOutputStreamIndex = (streams: IworkingStream[], stream: IworkingStream): number => {
  for (let idx = 0; idx < streams.length; idx += 1) {
    if (streams[idx] === stream) {
      return idx;
    }
  }

  return -1;
};

const getOutputStreamTypeIndex = (streams: IworkingStream[], stream: IworkingStream): number => {
  let index = -1;

  for (let idx = 0; idx < streams.length; idx += 1) {
    if (streams[idx].codec_type === stream.codec_type) {
      index += 1;
    }

    if (streams[idx] === stream) {
      break;
    }
  }

  return index;
};

const hasCodecOutputArg = (outputArgs: string[]): boolean => outputArgs.some((arg) => (
  /^-(c|codec)(:|$)/.test(arg)
  || /^-[vasd]codec(:|$)/.test(arg)
));

const isCopyCompatibleOutputOption = (arg: string): boolean => (
  arg === '-metadata'
  || arg.startsWith('-metadata:')
  || arg === '-disposition'
  || arg.startsWith('-disposition:')
);

const hasOnlyCopyCompatibleOutputArgs = (outputArgs: string[]): boolean => {
  for (let i = 0; i < outputArgs.length; i += 1) {
    const arg = outputArgs[i];

    if (!isCopyCompatibleOutputOption(arg)) {
      return false;
    }

    i += 1;
  }

  return true;
};

const shouldAddCopyCodec = (outputArgs: string[]): boolean => (
  outputArgs.length === 0
  || (!hasCodecOutputArg(outputArgs) && hasOnlyCopyCompatibleOutputArgs(outputArgs))
);

const appendArgs = (target: string[], argsToAppend: string[]): void => {
  argsToAppend.forEach((arg) => {
    target.push(arg);
  });
};

const appendArgsOnce = (target: string[], argsToAppend: string[]): void => {
  if (argsToAppend.length === 0) {
    return;
  }

  for (let i = 0; i <= target.length - argsToAppend.length; i += 1) {
    const hasSequence = argsToAppend.every((arg, index) => target[i + index] === arg);
    if (hasSequence) {
      return;
    }
  }

  appendArgs(target, argsToAppend);
};

const replaceOutputPlaceholders = (
  outputArgs: string[],
  streams: IworkingStream[],
  stream: IworkingStream,
): string[] => outputArgs.map((arg) => {
  let nextArg = arg;

  if (nextArg.includes('{outputIndex}')) {
    nextArg = nextArg.replace('{outputIndex}', String(getOutputStreamIndex(streams, stream)));
  }

  if (nextArg.includes('{outputTypeIndex}')) {
    nextArg = nextArg.replace('{outputTypeIndex}', String(getOutputStreamTypeIndex(streams, stream)));
  }

  return nextArg;
});

const getVaapiDeviceArgs = (inputArgs: string[]): string[] => {
  const deviceArgIndex = inputArgs.indexOf('-hwaccel_device');
  if (deviceArgIndex === -1 || !inputArgs[deviceArgIndex + 1]) {
    return [];
  }

  return ['-vaapi_device', inputArgs[deviceArgIndex + 1]];
};

const getNestedProperty = (stream: IworkingStream, propertyToCheck: string): unknown => {
  if (propertyToCheck.includes('.')) {
    const parts = propertyToCheck.split('.');
    return stream[parts[0]]?.[parts[1]];
  }

  return stream[propertyToCheck];
};

const markRemoved = (stream: IworkingStream): boolean => {
  if (!stream.removed) {
    // eslint-disable-next-line no-param-reassign
    stream.removed = true;
    return true;
  }

  return false;
};

const getFixedResolutionDimensions = (targetResolution: string): { width: number, height: number } => {
  switch (targetResolution) {
    case '480p':
      return { width: 720, height: 480 };
    case '576p':
      return { width: 720, height: 576 };
    case '720p':
      return { width: 1280, height: 720 };
    case '1080p':
      return { width: 1920, height: 1080 };
    case '1440p':
      return { width: 2560, height: 1440 };
    case '4KUHD':
      return { width: 3840, height: 2160 };
    default:
      return { width: 1920, height: 1080 };
  }
};

// Keep in sync with Tdarr's default scanner resolution boundaries.
const defaultResolutionBoundaries: IresolutionBoundary[] = [
  {
    resolution: '480p', widthMin: 100, widthMax: 792, heightMin: 100, heightMax: 528,
  },
  {
    resolution: '576p', widthMin: 100, widthMax: 792, heightMin: 100, heightMax: 634,
  },
  {
    resolution: '720p', widthMin: 100, widthMax: 1408, heightMin: 100, heightMax: 792,
  },
  {
    resolution: '1080p', widthMin: 100, widthMax: 2112, heightMin: 100, heightMax: 1188,
  },
  {
    resolution: '1440p', widthMin: 100, widthMax: 2816, heightMin: 100, heightMax: 1584,
  },
  {
    resolution: '4KUHD', widthMin: 100, widthMax: 4224, heightMin: 100, heightMax: 2376,
  },
  {
    resolution: 'DCI4K', widthMin: 100, widthMax: 4506, heightMin: 100, heightMax: 2376,
  },
  {
    resolution: '8KUHD', widthMin: 100, widthMax: 8448, heightMin: 100, heightMax: 4752,
  },
];

const getStreamResolution = (stream: IworkingStream): string | undefined => {
  const widthIn = Number(stream.width);
  const heightIn = Number(stream.height);

  if (!widthIn || !heightIn || Number.isNaN(widthIn) || Number.isNaN(heightIn)) {
    return undefined;
  }

  let width = widthIn;
  let height = heightIn;
  if (height > width) {
    width = heightIn;
    height = widthIn;
  }

  const boundary = defaultResolutionBoundaries.find((row) => (
    width >= row.widthMin
    && width <= row.widthMax
    && height >= row.heightMin
    && height <= row.heightMax
  ));

  if (boundary) {
    return boundary.resolution;
  }

  return 'Other';
};

const shouldScaleVideoStream = (
  args: IpluginInputArgs,
  stream: IworkingStream,
  resolutionInputs?: Record<string, unknown>,
): boolean => {
  if (!resolutionInputs) {
    return false;
  }

  const targetResolution = String(resolutionInputs.targetResolution);
  const streamResolution = getStreamResolution(stream);

  if (streamResolution) {
    return streamResolution !== targetResolution;
  }

  return targetResolution !== args.inputFileObj.video_resolution;
};

const getQsvScaleFilter = (targetResolution: string, format?: string): string => {
  const formatSuffix = format ? `:format=${format}` : '';
  const { width, height } = getFixedResolutionDimensions(targetResolution);
  return `vpp_qsv=w=${width}:h=${height}${formatSuffix}`;
};

const getVaapiScaleFilter = (targetResolution?: string, format?: string): string => {
  const scaleArgs: string[] = [];

  if (targetResolution) {
    const { width, height } = getFixedResolutionDimensions(targetResolution);
    scaleArgs.push(`w=${width}`, `h=${height}`);
  }

  if (format) {
    scaleArgs.push(`format=${format}`);
  }

  return scaleArgs.length > 0 ? `scale_vaapi=${scaleArgs.join(':')}` : 'scale_vaapi';
};

const getSoftwareScaleFilter = (targetResolution: string): string => {
  switch (targetResolution) {
    case '480p':
      return 'scale=720:-2';
    case '576p':
      return 'scale=720:-2';
    case '720p':
      return 'scale=1280:-2';
    case '1080p':
      return 'scale=1920:-2';
    case '1440p':
      return 'scale=2560:-2';
    case '4KUHD':
      return 'scale=3840:-2';
    default:
      return 'scale=1920:-2';
  }
};

const getPresetToUse = ({
  encoder,
  ffmpegPreset,
  targetCodec,
}: {
  encoder: IgetEncoder,
  ffmpegPreset: string,
  targetCodec: string,
}): string | null => {
  if (targetCodec === 'av1' || !ffmpegPreset) {
    return null;
  }

  if (!encoder.isGpu) {
    return ffmpegPreset;
  }

  if (encoder.encoder.includes('nvenc')) {
    const nvencPresetMap: Record<string, string> = {
      veryslow: 'p7',
      slower: 'p7',
      slow: 'p6',
      medium: 'p5',
      fast: 'p4',
      faster: 'p3',
      veryfast: 'p2',
      superfast: 'p1',
      ultrafast: 'p1',
    };
    return nvencPresetMap[ffmpegPreset] || 'p5';
  }

  if (encoder.encoder.includes('amf')) {
    const amfPresetMap: Record<string, string> = {
      veryslow: 'quality',
      slower: 'quality',
      slow: 'quality',
      medium: 'balanced',
      fast: 'balanced',
      faster: 'speed',
      veryfast: 'speed',
      superfast: 'speed',
      ultrafast: 'speed',
    };
    return amfPresetMap[ffmpegPreset] || 'balanced';
  }

  if (encoder.encoder.includes('qsv')) {
    return ffmpegPreset;
  }

  return null;
};

const getFrameRateFilter = (args: IpluginInputArgs, stream: IworkingStream, desiredFrameRate: number): string => {
  let frameRate = desiredFrameRate;

  args.jobLog(`Desired framerate: ${desiredFrameRate}`);

  if (stream.avg_frame_rate) {
    const parts = stream.avg_frame_rate.split('/');

    if (parts.length === 2) {
      const numerator = parseInt(parts[0], 10);
      const denominator = parseInt(parts[1], 10);

      if (numerator > 0 && denominator > 0) {
        const fileFramerate = numerator / denominator;

        args.jobLog(`File framerate: ${fileFramerate}`);

        if (fileFramerate < desiredFrameRate) {
          args.jobLog('File framerate is lower than desired framerate. Using file framerate.');
          frameRate = fileFramerate;
        } else {
          args.jobLog('File framerate is greater than desired framerate. Using desired framerate.');
        }
      }
    }
  }

  return `fps=${String(frameRate)}`;
};

const applyRemoveStreamByProperty = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const codecType = String(inputs.codecType).trim();
  const propertyToCheck = String(inputs.propertyToCheck).trim();
  const valuesToRemove = String(inputs.valuesToRemove).trim().split(',').map((item) => item.trim())
    .filter((row) => row.length > 0);
  const condition = String(inputs.condition);
  let changed = false;

  streams
    .filter((stream) => codecType === 'any' || stream.codec_type === codecType)
    .forEach((stream) => {
      const target = getNestedProperty(stream, propertyToCheck);

      if (target === undefined || target === null) {
        return;
      }

      const prop = String(target).toLowerCase();
      const lowerValues = valuesToRemove.map((val) => val.toLowerCase());
      let shouldRemove = false;

      switch (condition) {
        case 'includes':
          shouldRemove = lowerValues.some((val) => prop.includes(val));
          break;
        case 'not_includes':
          shouldRemove = !lowerValues.some((val) => prop.includes(val));
          break;
        case 'equals':
          shouldRemove = lowerValues.some((val) => prop === val);
          break;
        case 'not_equals':
          shouldRemove = !lowerValues.some((val) => prop === val);
          break;
        default:
          shouldRemove = false;
      }

      const valuesStr = valuesToRemove.join(', ');
      const action = shouldRemove ? 'Removing' : 'Keep';
      args.jobLog(
        `${action} stream index ${stream.index} because ${propertyToCheck} of ${prop} ${condition} ${valuesStr}\n`,
      );

      if (shouldRemove) {
        changed = markRemoved(stream) || changed;
      }
    });

  return changed;
};

const applyContainerConform = (
  streams: IworkingStream[],
  container: string,
): boolean => {
  let changed = false;

  for (let i = 0; i < streams.length; i += 1) {
    const stream = streams[i];

    try {
      const codecType = stream.codec_type.toLowerCase();
      const codecName = stream.codec_name.toLowerCase();

      if (
        container === 'mkv'
        && (
          codecType === 'data'
          || [
            'mov_text',
            'eia_608',
            'timed_id3',
          ].includes(codecName)
        )
      ) {
        changed = markRemoved(stream) || changed;
      }

      if (
        container === 'mp4'
        && (
          codecType === 'attachment'
          || [
            'hdmv_pgs_subtitle',
            'eia_608',
            'timed_id3',
            'subrip',
            'ass',
            'ssa',
          ].includes(codecName)
        )
      ) {
        changed = markRemoved(stream) || changed;
      }
    } catch (err) {
      // Ignore incomplete stream metadata.
    }
  }

  return changed;
};

const applyEnsureAudioStream = (
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

  let audioCodec = audioEncoder;

  if (audioEncoder === 'dca') {
    audioCodec = 'dts';
  }

  if (audioEncoder === 'libmp3lame') {
    audioCodec = 'mp3';
  }

  if (audioEncoder === 'libopus') {
    audioCodec = 'opus';
  }

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
      !stream.removed
      && stream.codec_type === 'audio'
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
      outputArgs: [
        '-c:{outputIndex}',
        audioEncoder,
        '-ac',
        `${targetChannels}`,
      ],
    };

    if (enableBitrate) {
      const ffType = getFfType(streamCopy.codec_type);
      streamCopy.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}`);
    }

    if (enableSamplerate) {
      streamCopy.outputArgs.push('-ar', `${samplerate}`);
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
  const gainNeeded = parseFloat(settings.i) - parseFloat(loudnormValues.input_i);

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

  return loudnormValues;
};

const appendNormalizeAudioOutputArgs = (
  stream: IworkingStream,
  settings: INormalizeAudioSettings,
  loudnormValues: ILoudnormValues,
): void => {
  if (!hasCodecOutputArg(stream.outputArgs)) {
    stream.outputArgs.push('-c:{outputIndex}', 'aac', '-b:a:{outputTypeIndex}', '192k');
  }

  stream.outputArgs.push('-filter:a:{outputTypeIndex}', getLoudnormSecondPassFilter(settings, loudnormValues));
};

const applyNormalizeAudio = (
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

const getCropDetectionSettings = (inputs: Record<string, unknown>): ICropDetectionSettings => ({
  cropMode: String(inputs.cropMode || 'mostCommon'),
  cropThreshold: Math.max(0, Math.min(255, parseNumberInput(inputs.cropThreshold, 24))),
  sampleCount: Math.max(1, Math.floor(parseNumberInput(inputs.sampleCount, 5))),
  framesPerSample: Math.max(1, Math.floor(parseNumberInput(inputs.framesPerSample, 30))),
  minCropPercent: Math.max(0, parseNumberInput(inputs.minCropPercent, 2)),
});

const getCropTargetStream = (streams: IworkingStream[]): ICropTargetStream | null => {
  for (let i = 0; i < streams.length; i += 1) {
    const stream = streams[i];
    const width = Number(stream.width);
    const height = Number(stream.height);

    if (!stream.removed && stream.codec_type === 'video' && width > 0 && height > 0) {
      return {
        stream,
        width,
        height,
      };
    }
  }

  return null;
};

const getCropPercent = (target: ICropTargetStream, crop: ICropValues): number => {
  const originalPixels = target.width * target.height;
  const croppedPixels = originalPixels - (crop.w * crop.h);
  return (croppedPixels / originalPixels) * 100;
};

const detectCropValues = (
  args: IpluginInputArgs,
  target: ICropTargetStream,
  settings: ICropDetectionSettings,
  duration: number,
): ICropValues[] => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const childProcess = require('child_process');
  const allCrops: ICropValues[] = [];

  for (let s = 0; s < settings.sampleCount; s += 1) {
    const seekTime = Math.floor(duration * (0.1 + (0.8 * (s + 1)) / (settings.sampleCount + 1)));

    try {
      const ffmpegArgs = [
        '-ss',
        String(seekTime),
        '-i',
        args.inputFileObj._id,
        '-map',
        `0:${target.stream.sourceIndex}`,
        '-frames:v',
        String(settings.framesPerSample),
        '-vf',
        `cropdetect=${settings.cropThreshold}:2:0`,
        '-f',
        'null',
        '-',
      ];

      const result = childProcess.spawnSync(args.ffmpegPath, ffmpegArgs, {
        timeout: 30000,
        windowsHide: true,
        encoding: 'utf8',
        shell: false,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new Error(`ffmpeg exited with status ${result.status}`);
      }

      const output = `${result.stdout || ''}${result.stderr || ''}`;
      const crops = parseCropValues(output);
      allCrops.push(...crops);
      args.jobLog(`Sample ${s + 1}/${settings.sampleCount} at ${seekTime}s: ${crops.length} crop values detected`);
    } catch (err) {
      args.jobLog(`Sample ${s + 1}/${settings.sampleCount} at ${seekTime}s failed: ${err}`);
    }
  }

  return allCrops;
};

const applyCropBlackBars = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const settings = getCropDetectionSettings(inputs);
  const duration = Number(args.inputFileObj.ffProbeData?.format?.duration) || 0;

  if (duration <= 0) {
    args.jobLog('Cannot detect crop: video duration unknown');
    return false;
  }

  const cropTarget = getCropTargetStream(streams);
  if (!cropTarget) {
    args.jobLog('Cannot detect crop: video dimensions unknown');
    return false;
  }

  args.jobLog(
    `Detecting black bars on stream ${cropTarget.stream.sourceIndex} `
    + `(${cropTarget.width}x${cropTarget.height}, duration: ${duration}s)`,
  );

  const allCrops = detectCropValues(args, cropTarget, settings, duration);

  if (allCrops.length === 0) {
    args.jobLog('No crop values detected');
    return false;
  }

  const crop = selectCrop(allCrops, settings.cropMode);

  if (!crop) {
    args.jobLog('Could not determine consistent crop values');
    return false;
  }

  const cropPercent = getCropPercent(cropTarget, crop);

  if (crop.w >= cropTarget.width && crop.h >= cropTarget.height) {
    args.jobLog('No black bars detected, no cropping needed');
    return false;
  }

  if (cropPercent < settings.minCropPercent) {
    args.jobLog(`Crop too small (${cropPercent.toFixed(1)}% < ${settings.minCropPercent}% threshold), skipping`);
    return false;
  }

  args.jobLog(
    `Cropping stream ${cropTarget.stream.sourceIndex} from ${cropTarget.width}x${cropTarget.height}`
    + ` to ${crop.w}x${crop.h}`
    + ` (removing ${cropPercent.toFixed(1)}% of image)`,
  );

  // cropdetect measures the source frame, so this is prepended before scale/HDR/framerate filters later.
  cropTarget.stream.cropFilter = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`;

  return true;
};

const applyReorderStreams = (
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): IworkingStream[] => {
  let reorderedStreams = clone(streams);

  const sortStreams = (sortType: {
    inputs: string,
    getValue: (stream: IworkingStream) => string,
  }) => {
    const items = sortType.inputs.split(',');
    items.reverse();
    for (let i = 0; i < items.length; i += 1) {
      const matchedStreams = [];
      for (let j = 0; j < reorderedStreams.length; j += 1) {
        if (String(sortType.getValue(reorderedStreams[j])) === String(items[i])) {
          if (
            reorderedStreams[j].codec_long_name
            && (
              reorderedStreams[j].codec_long_name.includes('image')
              || reorderedStreams[j].codec_name.includes('png')
            )
          ) {
            // Do not move image streams due to FFmpeg map behavior.
          } else {
            matchedStreams.push(reorderedStreams[j]);
            reorderedStreams.splice(j, 1);
            j -= 1;
          }
        }
      }
      reorderedStreams = matchedStreams.concat(reorderedStreams);
    }
  };

  const sortTypes: {
    [key: string]: {
      getValue: (stream: IworkingStream) => string;
      inputs: string;
    };
  } = {
    languages: {
      getValue: (stream: IworkingStream) => {
        if (stream?.tags?.language) {
          return stream.tags.language;
        }

        return '';
      },
      inputs: String(inputs.languages),
    },
    codecs: {
      getValue: (stream: IworkingStream) => {
        try {
          return stream.codec_name;
        } catch (err) {
          // Ignore incomplete stream metadata.
        }
        return '';
      },
      inputs: String(inputs.codecs),
    },
    channels: {
      getValue: (stream: IworkingStream) => {
        const chanMap: {
          [key: number]: string
        } = {
          8: '7.1',
          6: '5.1',
          2: '2',
          1: '1',
        };

        if (stream?.channels && chanMap[stream.channels]) {
          return chanMap[stream.channels];
        }

        return '';
      },
      inputs: String(inputs.channels),
    },
    streamTypes: {
      getValue: (stream: IworkingStream) => {
        if (stream.codec_type) {
          return stream.codec_type;
        }
        return '';
      },
      inputs: String(inputs.streamTypes),
    },
  };

  const processOrderArr = String(inputs.processOrder).split(',');

  for (let k = 0; k < processOrderArr.length; k += 1) {
    if (sortTypes[processOrderArr[k]] && sortTypes[processOrderArr[k]].inputs) {
      sortStreams(sortTypes[processOrderArr[k]]);
    }
  }

  return reorderedStreams;
};

const applyVideoEncoder = async ({
  args,
  streams,
  operations,
  inputs,
  singletonInputs,
  overallInputArguments,
}: {
  args: IpluginInputArgs,
  streams: IworkingStream[],
  operations: IffmpegCommandV2Operation[],
  inputs: Record<string, unknown>,
  singletonInputs: ISingletonOperationInputs,
  overallInputArguments: string[],
}): Promise<boolean> => {
  let shouldProcess = false;
  const targetCodec = String(inputs.outputCodec);
  const ffmpegPresetEnabled = inputs.ffmpegPresetEnabled === true;
  const ffmpegPreset = String(inputs.ffmpegPreset);
  const ffmpegQualityEnabled = inputs.ffmpegQualityEnabled === true;
  const ffmpegQuality = String(inputs.ffmpegQuality);
  const hardwareEncoding = inputs.hardwareEncoding === true;
  const hardwareType = String(inputs.hardwareType);
  const hardwareDecoding = inputs.hardwareDecoding === true;
  const forceEncoding = inputs.forceEncoding === true;
  let encoderProperties: IgetEncoder | undefined;
  const resolutionInputs = singletonInputs.setVideoResolution;
  const frameRateInputs = singletonInputs.setVideoFramerate;
  const videoBitrateInputs = singletonInputs.setVideoBitrate;
  const has10BitOperation = hasOperation(operations, 'set10BitVideo');
  const hasHdrToSdrOperation = hasOperation(operations, 'hdrToSdr');
  const videoStreams = streams.filter((stream) => (
    !stream.removed
    && stream.codec_type === 'video'
    && stream.codec_name !== 'mjpeg'
  ));

  for (let i = 0; i < videoStreams.length; i += 1) {
    const stream = videoStreams[i];
    const videoOperationRequiresEncoding = (
      shouldScaleVideoStream(args, stream, resolutionInputs)
      || Boolean(frameRateInputs)
      || Boolean(videoBitrateInputs)
      || Boolean(stream.cropFilter)
      || has10BitOperation
      || hasHdrToSdrOperation
    );

    if (
      forceEncoding
      || stream.codec_name !== targetCodec
      || videoOperationRequiresEncoding
    ) {
      shouldProcess = true;

      if (!encoderProperties) {
        // eslint-disable-next-line no-await-in-loop
        encoderProperties = await getEncoder({
          targetCodec,
          hardwareEncoding,
          hardwareType,
          args,
        });
      }

      stream.encoder = encoderProperties;
      stream.hardwareDecoding = hardwareDecoding;
      stream.outputArgs.push('-c:{outputIndex}', encoderProperties.encoder);

      if (ffmpegQualityEnabled) {
        if (encoderProperties.isGpu) {
          if (encoderProperties.encoder === 'hevc_qsv') {
            stream.outputArgs.push('-global_quality', ffmpegQuality);
          } else {
            stream.outputArgs.push('-qp', ffmpegQuality);
          }
        } else {
          stream.outputArgs.push('-crf', ffmpegQuality);
        }
      }

      if (ffmpegPresetEnabled) {
        const presetToUse = getPresetToUse({
          encoder: encoderProperties,
          ffmpegPreset,
          targetCodec,
        });

        if (presetToUse) {
          stream.outputArgs.push('-preset', presetToUse);
        }
      }

      if (encoderProperties.encoder.includes('vaapi')) {
        appendArgsOnce(overallInputArguments, getVaapiDeviceArgs(encoderProperties.inputArgs));
      }

      if (hardwareDecoding) {
        appendArgsOnce(overallInputArguments, encoderProperties.inputArgs);
      }

      if (encoderProperties.outputArgs) {
        appendArgs(stream.outputArgs, encoderProperties.outputArgs);
      }
    }
  }

  return shouldProcess;
};

const applyVideoBitrate = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
): boolean => {
  const useInputBitrate = inputs.useInputBitrate === true;
  const targetBitratePercent = String(inputs.targetBitratePercent);
  const fallbackBitrate = String(inputs.fallbackBitrate);
  const bitrate = String(inputs.bitrate);
  let shouldProcess = false;

  streams.forEach((stream) => {
    if (!stream.removed && stream.codec_type === 'video') {
      const ffType = getFfType(stream.codec_type);
      shouldProcess = true;

      if (useInputBitrate) {
        args.jobLog('Attempting to use % of input bitrate as output bitrate');
        const tracks = args?.inputFileObj?.mediaInfo?.track;
        const inputBitrate = tracks?.find((x) => x.StreamOrder === stream.index.toString())?.BitRate;
        const parsedInputBitrate = parseInt(String(inputBitrate), 10);

        if (inputBitrate && !Number.isNaN(parsedInputBitrate)) {
          args.jobLog(`Found input bitrate: ${inputBitrate}`);
          const inputBitrateKbps = parsedInputBitrate / 1000;
          const targetBitrate = (inputBitrateKbps * (parseInt(targetBitratePercent, 10) / 100));
          args.jobLog(`Setting video bitrate as ${targetBitrate}k`);
          stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${targetBitrate}k`);
        } else {
          args.jobLog(`Unable to find input bitrate, setting fallback bitrate as ${fallbackBitrate}k`);
          stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${fallbackBitrate}k`);
        }
      } else {
        args.jobLog(`Using fixed bitrate. Setting video bitrate as ${bitrate}k`);
        stream.outputArgs.push(`-b:${ffType}:{outputTypeIndex}`, `${bitrate}k`);
      }
    }
  });

  return shouldProcess;
};

const applyVideoFilters = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  operations: IffmpegCommandV2Operation[],
  singletonInputs: ISingletonOperationInputs,
): boolean => {
  const resolutionInputs = singletonInputs.setVideoResolution;
  const frameRateInputs = singletonInputs.setVideoFramerate;
  const has10BitOperation = hasOperation(operations, 'set10BitVideo');
  const hasHdrToSdrOperation = hasOperation(operations, 'hdrToSdr');
  let shouldProcess = false;

  streams.forEach((stream) => {
    if (stream.removed || stream.codec_type !== 'video') {
      return;
    }

    const filterChain: string[] = [];
    const encoderName = stream.encoder?.encoder || '';
    const usesQsv = encoderName.includes('qsv');
    const usesVaapi = encoderName.includes('vaapi');
    const hardwareDecoding = stream.hardwareDecoding === true;
    const hardwareDecodedQsv = usesQsv && hardwareDecoding;
    const hardwareDecodedVaapi = usesVaapi && hardwareDecoding;
    const hasCropFilter = Boolean(stream.cropFilter);
    const needsSoftwareOnlyFilter = hasCropFilter || hasHdrToSdrOperation || Boolean(frameRateInputs);
    const shouldScale = shouldScaleVideoStream(args, stream, resolutionInputs);
    const targetResolution = resolutionInputs ? String(resolutionInputs.targetResolution) : '';

    if (
      usesQsv
      && hardwareDecodedQsv
      && shouldScale
      && !hasCropFilter
      && !hasHdrToSdrOperation
      && !frameRateInputs
    ) {
      filterChain.push(getQsvScaleFilter(
        targetResolution,
        has10BitOperation ? 'p010le' : undefined,
      ));
    } else if (
      usesQsv
      && hardwareDecodedQsv
      && has10BitOperation
      && !shouldScale
      && !hasCropFilter
      && !hasHdrToSdrOperation
      && !frameRateInputs
    ) {
      filterChain.push('scale_qsv=format=p010le');
    } else if (usesVaapi) {
      const vaapiFormat = has10BitOperation ? 'p010' : undefined;

      if (!needsSoftwareOnlyFilter && (shouldScale || has10BitOperation)) {
        if (!hardwareDecodedVaapi) {
          filterChain.push('format=nv12', 'hwupload');
        }

        filterChain.push(getVaapiScaleFilter(
          shouldScale ? targetResolution : undefined,
          vaapiFormat,
        ));
      } else {
        if (hardwareDecodedVaapi && needsSoftwareOnlyFilter) {
          filterChain.push('hwdownload', 'format=nv12');
        }

        if (stream.cropFilter) {
          filterChain.push(stream.cropFilter);
        }

        if (hasHdrToSdrOperation) {
          filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
        }

        if (shouldScale && resolutionInputs) {
          filterChain.push(getSoftwareScaleFilter(targetResolution));
        }

        if (frameRateInputs) {
          filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
        }

        if (!hardwareDecodedVaapi || filterChain.length > 0) {
          filterChain.push(`format=${has10BitOperation ? 'p010' : 'nv12'}`, 'hwupload');
        }
      }
    } else {
      if (usesQsv && hardwareDecodedQsv && (needsSoftwareOnlyFilter || shouldScale)) {
        filterChain.push('hwdownload', 'format=nv12');
      }

      if (stream.cropFilter) {
        filterChain.push(stream.cropFilter);
      }

      if (hasHdrToSdrOperation) {
        filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
      }

      if (shouldScale && resolutionInputs) {
        filterChain.push(getSoftwareScaleFilter(targetResolution));
      }

      if (frameRateInputs) {
        filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
      }

      if (usesQsv && has10BitOperation) {
        filterChain.push('format=p010le');
      }

      if (usesQsv && hardwareDecodedQsv && (needsSoftwareOnlyFilter || shouldScale)) {
        filterChain.push('hwupload=extra_hw_frames=64', 'format=qsv');
      } else if (usesQsv && has10BitOperation && filterChain.length === 0) {
        filterChain.push('scale_qsv=format=p010le');
      }
    }

    if (filterChain.length > 0) {
      stream.outputArgs.push('-filter:v:{outputTypeIndex}', filterChain.join(','));
      shouldProcess = true;
    }

    if (has10BitOperation) {
      const isLibsvtav1 = stream.encoder?.encoder === 'libsvtav1'
        || stream.outputArgs.some((row) => String(row).includes('libsvtav1'));

      if (!isLibsvtav1) {
        stream.outputArgs.push('-profile:v:{outputTypeIndex}', 'main10');
      }

      if (usesQsv && hardwareDecodedQsv) {
        if (filterChain.length === 0) {
          stream.outputArgs.push('-filter:v:{outputTypeIndex}', 'scale_qsv=format=p010le');
        }
      } else if (usesVaapi) {
        // VAAPI bit depth is handled inside the upload/scale_vaapi filter chain.
      } else if (isLibsvtav1) {
        stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'yuv420p10le');
      } else {
        stream.outputArgs.push('-pix_fmt:v:{outputTypeIndex}', 'p010le');
      }

      shouldProcess = true;
    }

    if (hasHdrToSdrOperation) {
      shouldProcess = true;
    }

    if (shouldScale) {
      shouldProcess = true;
    }

    if (frameRateInputs) {
      shouldProcess = true;
    }
  });

  return shouldProcess;
};

const warnForCustomOutputConflicts = (args: IpluginInputArgs, outputArguments: string[]): void => {
  const conflictArgs = [
    '-vf',
    '-af',
    '-filter',
    '-filter:v',
    '-filter:a',
    '-c',
    '-codec',
    '-map',
  ];
  const hasConflict = outputArguments.some((arg) => conflictArgs.some((conflictArg) => (
    arg === conflictArg || arg.startsWith(`${conflictArg}:`)
  )));

  if (hasConflict) {
    args.jobLog('Custom FFmpeg output arguments include command-shaping options that may conflict with v2 rendering.');
  }
};

export const renderFfmpegCommandV2 = async (
  args: IpluginInputArgs,
): Promise<IffmpegCommandV2RenderResult> => {
  checkFfmpegCommandV2Init(args);

  const commandState = args.variables.ffmpegCommandV2;
  if (commandState?.sourceFileId && commandState.sourceFileId !== args.inputFileObj._id) {
    args.jobLog(
      'FFmpeg command v2 input changed between Begin Command and Execute; rendering from current input file.',
    );
  }

  const operations = commandState?.operations || [];
  const singletonInputs = resolveSingletonOperationInputs(args, operations);
  let streams = createInitialWorkingStreams(args);
  let shouldProcess = false;
  let container = getContainer(args.inputFileObj._id);
  const overallInputArguments: string[] = [];
  const overallOutputArguments: string[] = [];

  getOperations(operations, 'customArguments').forEach((operation) => {
    const inputArguments = splitArgs(args, operation.inputs.inputArguments);
    const outputArguments = splitArgs(args, operation.inputs.outputArguments);

    if (inputArguments.length > 0) {
      appendArgs(overallInputArguments, inputArguments);
      shouldProcess = true;
    }

    if (outputArguments.length > 0) {
      warnForCustomOutputConflicts(args, outputArguments);
      appendArgs(overallOutputArguments, outputArguments);
      shouldProcess = true;
    }
  });

  getOperations(operations, 'removeDataStreams').forEach(() => {
    streams.forEach((stream) => {
      if (stream.codec_type === 'data') {
        shouldProcess = markRemoved(stream) || shouldProcess;
      }
    });
  });

  getOperations(operations, 'removeSubtitles').forEach(() => {
    streams.forEach((stream) => {
      if (stream.codec_type === 'subtitle') {
        shouldProcess = markRemoved(stream) || shouldProcess;
      }
    });
  });

  getOperations(operations, 'removeStreamByProperty').forEach((operation) => {
    shouldProcess = applyRemoveStreamByProperty(args, streams, operation.inputs) || shouldProcess;
  });

  const cropBlackBarsInputs = singletonInputs.cropBlackBars;
  if (cropBlackBarsInputs) {
    shouldProcess = applyCropBlackBars(args, streams, cropBlackBarsInputs) || shouldProcess;
  }

  const containerInputs = singletonInputs.setContainer;
  if (containerInputs) {
    const targetContainer = String(containerInputs.container);
    const currentContainer = getContainer(args.inputFileObj._id);
    container = targetContainer;

    if (currentContainer !== targetContainer) {
      shouldProcess = true;

      if (containerInputs.forceConform === true) {
        shouldProcess = applyContainerConform(streams, targetContainer) || shouldProcess;
      }

      const fileContainer = String(args.inputFileObj.container || '').toLowerCase();
      if (
        [
          'ts',
          'avi',
          'mpg',
          'mpeg',
        ].includes(fileContainer)
      ) {
        appendArgs(overallInputArguments, ['-fflags', '+genpts']);
      }
    }
  }

  getOperations(operations, 'ensureAudioStream').forEach((operation) => {
    shouldProcess = applyEnsureAudioStream(args, streams, operation.inputs) || shouldProcess;
  });

  const reorderInputs = singletonInputs.reorderStreams;
  if (reorderInputs) {
    const originalStreams = JSON.stringify(streams);
    streams = applyReorderStreams(streams, reorderInputs);

    if (JSON.stringify(streams) !== originalStreams) {
      shouldProcess = true;
    }
  }

  const normalizeAudioInputs = singletonInputs.normalizeAudio;
  if (normalizeAudioInputs) {
    shouldProcess = applyNormalizeAudio(args, streams, normalizeAudioInputs) || shouldProcess;
  }

  const encoderInputs = singletonInputs.setVideoEncoder;
  if (encoderInputs) {
    shouldProcess = await applyVideoEncoder({
      args,
      streams,
      operations,
      inputs: encoderInputs,
      singletonInputs,
      overallInputArguments,
    }) || shouldProcess;
  }

  shouldProcess = applyVideoFilters(args, streams, operations, singletonInputs) || shouldProcess;

  const bitrateInputs = singletonInputs.setVideoBitrate;
  if (bitrateInputs) {
    shouldProcess = applyVideoBitrate(args, streams, bitrateInputs) || shouldProcess;
  }

  const filteredStreams = streams.filter((stream) => !stream.removed);

  if (filteredStreams.length === 0) {
    args.jobLog('No streams mapped for new file');
    throw new Error('No streams mapped for new file');
  }

  const spawnArgs: string[] = [
    '-y',
    ...overallInputArguments,
    '-i',
    args.inputFileObj._id,
  ];

  filteredStreams.forEach((stream) => {
    const outputArgs = replaceOutputPlaceholders(stream.outputArgs, filteredStreams, stream);

    spawnArgs.push('-map', `0:${stream.sourceIndex}`);

    if (shouldAddCopyCodec(outputArgs)) {
      spawnArgs.push(`-c:${getOutputStreamIndex(filteredStreams, stream)}`, 'copy');
    }

    appendArgs(spawnArgs, outputArgs);
  });

  appendArgs(spawnArgs, overallOutputArguments);

  return {
    spawnArgs: spawnArgs.map((row) => row.trim()).filter((row) => row !== ''),
    shouldProcess,
    container,
    streams: filteredStreams,
  };
};
