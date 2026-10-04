import {
  IffmpegCommandV2Operation,
  IpluginInputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import {
  IworkingStream,
  ISingletonOperationInputs,
  SingletonOperationType,
  singletonOperationTypes,
} from './renderTypes';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const createInitialWorkingStreams = (args: IpluginInputArgs): IworkingStream[] => {
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

export const splitArgs = (args: IpluginInputArgs, value: unknown): string[] => {
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

export const parseNumberInput = (value: unknown, defaultValue: number): number => {
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

export const getStringInput = (value: unknown, defaultValue: string): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue === '' ? defaultValue : trimmedValue;
};

export const getAudioCodecName = (audioEncoder: string): string => {
  const codecNameByEncoder: Record<string, string> = {
    dca: 'dts',
    libmp3lame: 'mp3',
    libopus: 'opus',
  };

  return codecNameByEncoder[audioEncoder] || audioEncoder;
};

export const getOperations = (
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

export const resolveSingletonOperationInputs = (
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

export const hasOperation = (operations: IffmpegCommandV2Operation[], operationType: string): boolean => (
  getOperations(operations, operationType).length > 0
);

export const getOutputStreamIndex = (streams: IworkingStream[], stream: IworkingStream): number => {
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

export const hasCodecOutputArg = (outputArgs: string[]): boolean => outputArgs.some((arg) => (
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

export const shouldAddCopyCodec = (outputArgs: string[]): boolean => (
  outputArgs.length === 0
  || (!hasCodecOutputArg(outputArgs) && hasOnlyCopyCompatibleOutputArgs(outputArgs))
);

export const appendArgs = (target: string[], argsToAppend: string[]): void => {
  argsToAppend.forEach((arg) => {
    target.push(arg);
  });
};

export const appendArgsOnce = (target: string[], argsToAppend: string[]): void => {
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

export const replaceOutputPlaceholders = (
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

export const getVaapiDeviceArgs = (inputArgs: string[]): string[] => {
  const deviceArgIndex = inputArgs.indexOf('-hwaccel_device');
  if (deviceArgIndex === -1 || !inputArgs[deviceArgIndex + 1]) {
    return [];
  }

  return ['-vaapi_device', inputArgs[deviceArgIndex + 1]];
};

export const getNestedProperty = (stream: IworkingStream, propertyToCheck: string): unknown => {
  if (propertyToCheck.includes('.')) {
    const parts = propertyToCheck.split('.');
    return stream[parts[0]]?.[parts[1]];
  }

  return stream[propertyToCheck];
};

export const markRemoved = (stream: IworkingStream): boolean => {
  if (!stream.removed) {
    // eslint-disable-next-line no-param-reassign
    stream.removed = true;
    return true;
  }

  return false;
};
