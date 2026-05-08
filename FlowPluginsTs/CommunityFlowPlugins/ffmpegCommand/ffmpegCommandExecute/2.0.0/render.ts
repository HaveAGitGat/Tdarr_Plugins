import {
  IffmpegCommandV2Request,
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
}

export type IffmpegCommandV2WorkingStream = IworkingStream;

export interface IffmpegCommandV2RenderResult {
  spawnArgs: string[],
  shouldProcess: boolean,
  container: string,
  streams: IffmpegCommandV2WorkingStream[],
}

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

const getRequests = (
  requests: IffmpegCommandV2Request[],
  requestType: string,
): IffmpegCommandV2Request[] => requests.filter((request) => request.requestType === requestType);

const getLastRequestInputs = (
  requests: IffmpegCommandV2Request[],
  requestType: string,
): Record<string, unknown> | undefined => {
  const matches = getRequests(requests, requestType);
  return matches.length > 0 ? matches[matches.length - 1].inputs : undefined;
};

const hasRequest = (requests: IffmpegCommandV2Request[], requestType: string): boolean => (
  getRequests(requests, requestType).length > 0
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
  inputs,
  overallInputArguments,
}: {
  args: IpluginInputArgs,
  streams: IworkingStream[],
  inputs: Record<string, unknown>,
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

  for (let i = 0; i < streams.length; i += 1) {
    const stream = streams[i];

    if (
      stream.codec_type === 'video'
      && stream.codec_name !== 'mjpeg'
      && (forceEncoding || stream.codec_name !== targetCodec)
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
    if (stream.codec_type === 'video') {
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
  requests: IffmpegCommandV2Request[],
): boolean => {
  const resolutionInputs = getLastRequestInputs(requests, 'setVideoResolution');
  const frameRateInputs = getLastRequestInputs(requests, 'setVideoFramerate');
  const has10BitRequest = hasRequest(requests, 'set10BitVideo');
  const hasHdrToSdrRequest = hasRequest(requests, 'hdrToSdr');
  let shouldProcess = false;

  streams.forEach((stream) => {
    if (stream.codec_type !== 'video') {
      return;
    }

    const filterChain: string[] = [];
    const encoderName = stream.encoder?.encoder || '';
    const usesQsv = encoderName.includes('qsv');
    const usesVaapi = encoderName.includes('vaapi');
    const hardwareDecoding = stream.hardwareDecoding === true;
    const hardwareDecodedQsv = usesQsv && hardwareDecoding;
    const hardwareDecodedVaapi = usesVaapi && hardwareDecoding;
    const needsSoftwareOnlyFilter = hasHdrToSdrRequest || Boolean(frameRateInputs);
    const shouldScale = (
      resolutionInputs
      && String(resolutionInputs.targetResolution) !== args.inputFileObj.video_resolution
    );

    if (
      usesQsv
      && hardwareDecodedQsv
      && shouldScale
      && !hasHdrToSdrRequest
      && !frameRateInputs
    ) {
      filterChain.push(getQsvScaleFilter(
        String(resolutionInputs.targetResolution),
        has10BitRequest ? 'p010le' : undefined,
      ));
    } else if (
      usesQsv
      && hardwareDecodedQsv
      && has10BitRequest
      && !shouldScale
      && !hasHdrToSdrRequest
      && !frameRateInputs
    ) {
      filterChain.push('scale_qsv=format=p010le');
    } else if (usesVaapi) {
      const vaapiFormat = has10BitRequest ? 'p010' : undefined;

      if (!needsSoftwareOnlyFilter && (shouldScale || has10BitRequest)) {
        if (!hardwareDecodedVaapi) {
          filterChain.push('format=nv12', 'hwupload');
        }

        filterChain.push(getVaapiScaleFilter(
          shouldScale && resolutionInputs ? String(resolutionInputs.targetResolution) : undefined,
          vaapiFormat,
        ));
      } else {
        if (hardwareDecodedVaapi && needsSoftwareOnlyFilter) {
          filterChain.push('hwdownload', 'format=nv12');
        }

        if (hasHdrToSdrRequest) {
          filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
        }

        if (shouldScale && resolutionInputs) {
          filterChain.push(getSoftwareScaleFilter(String(resolutionInputs.targetResolution)));
        }

        if (frameRateInputs) {
          filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
        }

        if (!hardwareDecodedVaapi || filterChain.length > 0) {
          filterChain.push(`format=${has10BitRequest ? 'p010' : 'nv12'}`, 'hwupload');
        }
      }
    } else {
      if (usesQsv && hardwareDecodedQsv && (hasHdrToSdrRequest || shouldScale || frameRateInputs)) {
        filterChain.push('hwdownload', 'format=nv12');
      }

      if (hasHdrToSdrRequest) {
        filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
      }

      if (shouldScale && resolutionInputs) {
        filterChain.push(getSoftwareScaleFilter(String(resolutionInputs.targetResolution)));
      }

      if (frameRateInputs) {
        filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
      }

      if (usesQsv && has10BitRequest) {
        filterChain.push('format=p010le');
      }

      if (usesQsv && hardwareDecodedQsv && (hasHdrToSdrRequest || shouldScale || frameRateInputs)) {
        filterChain.push('hwupload=extra_hw_frames=64', 'format=qsv');
      } else if (usesQsv && has10BitRequest && filterChain.length === 0) {
        filterChain.push('scale_qsv=format=p010le');
      }
    }

    if (filterChain.length > 0) {
      stream.outputArgs.push('-filter:v:{outputTypeIndex}', filterChain.join(','));
      shouldProcess = true;
    }

    if (has10BitRequest) {
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

    if (hasHdrToSdrRequest) {
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
    '-filter',
    '-filter:v',
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

const logNoopRequests = (
  args: IpluginInputArgs,
  requests: IffmpegCommandV2Request[],
): void => {
  getRequests(requests, 'cropBlackBars').forEach(() => {
    args.jobLog('Crop Black Bars v2 request has no render action yet; leaving streams unchanged.');
  });

  getRequests(requests, 'normalizeAudio').forEach(() => {
    args.jobLog('Normalize Audio v2 request has no render action yet; leaving streams unchanged.');
  });
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

  const requests = commandState?.requests || [];
  let streams = createInitialWorkingStreams(args);
  let shouldProcess = false;
  let container = getContainer(args.inputFileObj._id);
  const overallInputArguments: string[] = [];
  const overallOutputArguments: string[] = [];

  getRequests(requests, 'customArguments').forEach((request) => {
    const inputArguments = splitArgs(args, request.inputs.inputArguments);
    const outputArguments = splitArgs(args, request.inputs.outputArguments);

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

  getRequests(requests, 'removeDataStreams').forEach(() => {
    streams.forEach((stream) => {
      if (stream.codec_type === 'data') {
        shouldProcess = markRemoved(stream) || shouldProcess;
      }
    });
  });

  getRequests(requests, 'removeSubtitles').forEach(() => {
    streams.forEach((stream) => {
      if (stream.codec_type === 'subtitle') {
        shouldProcess = markRemoved(stream) || shouldProcess;
      }
    });
  });

  getRequests(requests, 'removeStreamByProperty').forEach((request) => {
    shouldProcess = applyRemoveStreamByProperty(args, streams, request.inputs) || shouldProcess;
  });

  logNoopRequests(args, requests);

  const containerInputs = getLastRequestInputs(requests, 'setContainer');
  if (containerInputs) {
    const requestedContainer = String(containerInputs.container);
    const currentContainer = getContainer(args.inputFileObj._id);
    container = requestedContainer;

    if (currentContainer !== requestedContainer) {
      shouldProcess = true;

      if (containerInputs.forceConform === true) {
        shouldProcess = applyContainerConform(streams, requestedContainer) || shouldProcess;
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

  getRequests(requests, 'ensureAudioStream').forEach((request) => {
    shouldProcess = applyEnsureAudioStream(args, streams, request.inputs) || shouldProcess;
  });

  const reorderInputs = getLastRequestInputs(requests, 'reorderStreams');
  if (reorderInputs) {
    const originalStreams = JSON.stringify(streams);
    streams = applyReorderStreams(streams, reorderInputs);

    if (JSON.stringify(streams) !== originalStreams) {
      shouldProcess = true;
    }
  }

  const encoderInputs = getLastRequestInputs(requests, 'setVideoEncoder');
  if (encoderInputs) {
    shouldProcess = await applyVideoEncoder({
      args,
      streams,
      inputs: encoderInputs,
      overallInputArguments,
    }) || shouldProcess;
  }

  shouldProcess = applyVideoFilters(args, streams, requests) || shouldProcess;

  const bitrateInputs = getLastRequestInputs(requests, 'setVideoBitrate');
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
