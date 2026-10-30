import { IpluginInputArgs } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { IworkingStream } from './renderTypes';
import {
  getStringInput,
  hasCodecOutputArg,
  shouldAddCopyCodec,
} from './renderUtils';

export const warnForCustomOutputConflicts = (args: IpluginInputArgs, outputArguments: string[]): void => {
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

const getExplicitEncoderGuidance = (codecType: string): string => {
  if (codecType === 'video') {
    return 'Add Set Video Encoder when using video operations that require encoding.';
  }

  if (codecType === 'audio') {
    return 'Add Set Audio Encoder before audio operations that require encoding.';
  }

  return 'Add an explicit encoder before operations that require encoding.';
};

const getImplicitEncoderMessage = (stream: IworkingStream): string => {
  const codecType = String(stream.codec_type || 'unknown');
  return `FFmpeg command v2 ${codecType} stream ${stream.sourceIndex} requires encoding`
    + ` but does not have an explicit encoder. ${getExplicitEncoderGuidance(codecType)}`;
};

const throwImplicitEncoderError = (
  args: IpluginInputArgs,
  stream: IworkingStream,
): never => {
  const message = getImplicitEncoderMessage(stream);
  args.jobLog(message);
  throw new Error(message);
};

export const hasConfiguredAudioEncoder = (
  audioEncoderInputs: Record<string, unknown> | undefined,
): audioEncoderInputs is Record<string, unknown> => (
  audioEncoderInputs !== undefined
  && getStringInput(audioEncoderInputs.audioEncoder, '') !== ''
);

export const assertAudioEncoderConfiguredForNormalize = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
  audioEncoderInputs: Record<string, unknown> | undefined,
): void => {
  if (hasConfiguredAudioEncoder(audioEncoderInputs)) {
    return;
  }

  const audioStream = streams.find((stream) => (
    !stream.removed
    && stream.codec_type === 'audio'
    && !hasCodecOutputArg(stream.outputArgs)
  ));
  if (audioStream) {
    throwImplicitEncoderError(args, audioStream);
  }
};

export const assertNoImplicitEncoder = (
  args: IpluginInputArgs,
  streams: IworkingStream[],
): void => {
  streams.forEach((stream) => {
    if (shouldAddCopyCodec(stream.outputArgs) || hasCodecOutputArg(stream.outputArgs)) {
      return;
    }

    throwImplicitEncoderError(args, stream);
  });
};
