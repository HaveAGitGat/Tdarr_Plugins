import {
  IffmpegCommandV2Operation,
  IpluginInputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import {
  IresolutionBoundary,
  ISingletonOperationInputs,
  IworkingStream,
} from './renderTypes';
import { hasOperation } from './renderUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

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

export const shouldScaleVideoStream = (
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

const includesAny = (value: unknown, matches: string[]): boolean => {
  const normalizedValue = String(value || '').toLowerCase();
  return matches.some((match) => normalizedValue.includes(match));
};

export const isHdrVideoStream = (stream: IworkingStream): boolean => {
  if (stream.codec_type !== 'video') {
    return false;
  }

  const colorTransfer = String(stream.color_transfer || '').toLowerCase();
  const colorPrimaries = String(stream.color_primaries || '').toLowerCase();
  const colorSpace = String(stream.color_space || '').toLowerCase();
  const codecTag = stream.codec_tag_string;
  const hasHdrTransfer = colorTransfer === 'smpte2084' || colorTransfer === 'arib-std-b67';
  const hasBt2020Color = colorPrimaries === 'bt2020' || colorSpace.includes('bt2020');
  const hasDolbyVisionTag = includesAny(codecTag, ['dvhe', 'dvh1', 'dvh11', 'dvav', 'dav1']);

  return (hasHdrTransfer && hasBt2020Color) || hasDolbyVisionTag;
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

const appendSoftwareVideoFilters = ({
  args,
  stream,
  filterChain,
  shouldApplyHdrToSdr,
  shouldScale,
  resolutionInputs,
  targetResolution,
  frameRateInputs,
}: {
  args: IpluginInputArgs,
  stream: IworkingStream,
  filterChain: string[],
  shouldApplyHdrToSdr: boolean,
  shouldScale: boolean,
  resolutionInputs?: Record<string, unknown>,
  targetResolution: string,
  frameRateInputs?: Record<string, unknown>,
}): void => {
  if (stream.cropFilter) {
    filterChain.push(stream.cropFilter);
  }

  if (shouldApplyHdrToSdr) {
    filterChain.push('zscale=t=linear:npl=100', 'format=yuv420p');
  }

  if (shouldScale && resolutionInputs) {
    filterChain.push(getSoftwareScaleFilter(targetResolution));
  }

  if (frameRateInputs) {
    filterChain.push(getFrameRateFilter(args, stream, Number(frameRateInputs.framerate)));
  }
};

export const applyVideoFilters = (
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
    const shouldApplyHdrToSdr = hasHdrToSdrOperation && isHdrVideoStream(stream);
    const needsSoftwareOnlyFilter = hasCropFilter || shouldApplyHdrToSdr || Boolean(frameRateInputs);
    const shouldScale = shouldScaleVideoStream(args, stream, resolutionInputs);
    const targetResolution = resolutionInputs ? String(resolutionInputs.targetResolution) : '';
    const qsvNeedsSoftwareRoundTrip = hardwareDecodedQsv && (needsSoftwareOnlyFilter || shouldScale);

    if (hasHdrToSdrOperation && !shouldApplyHdrToSdr) {
      args.jobLog(`Skipping HDR to SDR for stream ${stream.sourceIndex}: stream is not HDR-tagged.`);
    }

    if (
      hardwareDecodedQsv
      && shouldScale
      && !hasCropFilter
      && !shouldApplyHdrToSdr
      && !frameRateInputs
    ) {
      filterChain.push(getQsvScaleFilter(
        targetResolution,
        has10BitOperation ? 'p010le' : undefined,
      ));
    } else if (
      hardwareDecodedQsv
      && has10BitOperation
      && !shouldScale
      && !hasCropFilter
      && !shouldApplyHdrToSdr
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

        appendSoftwareVideoFilters({
          args,
          stream,
          filterChain,
          shouldApplyHdrToSdr,
          shouldScale,
          resolutionInputs,
          targetResolution,
          frameRateInputs,
        });

        if (!hardwareDecodedVaapi || filterChain.length > 0) {
          filterChain.push(`format=${has10BitOperation ? 'p010' : 'nv12'}`, 'hwupload');
        }
      }
    } else {
      if (qsvNeedsSoftwareRoundTrip) {
        filterChain.push('hwdownload', 'format=nv12');
      }

      appendSoftwareVideoFilters({
        args,
        stream,
        filterChain,
        shouldApplyHdrToSdr,
        shouldScale,
        resolutionInputs,
        targetResolution,
        frameRateInputs,
      });

      if (usesQsv && has10BitOperation) {
        filterChain.push('format=p010le');
      }

      if (qsvNeedsSoftwareRoundTrip) {
        filterChain.push('hwupload=extra_hw_frames=64', 'format=qsv');
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

      const hardwareBitDepthHandledByFilterChain = usesVaapi || hardwareDecodedQsv;
      if (!hardwareBitDepthHandledByFilterChain) {
        stream.outputArgs.push(
          '-pix_fmt:v:{outputTypeIndex}',
          isLibsvtav1 ? 'yuv420p10le' : 'p010le',
        );
      }

      shouldProcess = true;
    }

    if (shouldApplyHdrToSdr) {
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
