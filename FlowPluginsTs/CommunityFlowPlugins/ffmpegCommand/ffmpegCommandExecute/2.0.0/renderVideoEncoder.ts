import {
  IffmpegCommandV2Operation,
  IpluginInputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFfType } from '../../../../FlowHelpers/1.0.0/fileUtils';
import { getEncoder, IgetEncoder } from '../../../../FlowHelpers/1.0.0/hardwareUtils';
import {
  ISingletonOperationInputs,
  IworkingStream,
} from './renderTypes';
import {
  appendArgs,
  appendArgsOnce,
  getVaapiDeviceArgs,
  hasOperation,
} from './renderUtils';
import {
  isHdrVideoStream,
  shouldScaleVideoStream,
} from './renderVideoFilters';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

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

export const applyVideoEncoder = async ({
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
      || (hasHdrToSdrOperation && isHdrVideoStream(stream))
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

export const applyVideoBitrate = (
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
