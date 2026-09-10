import { getContainer } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginInputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { checkFfmpegCommandV2Init } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandV2RenderResult,
} from './renderTypes';
import {
  appendArgs,
  createInitialWorkingStreams,
  getOperations,
  getOutputStreamIndex,
  markRemoved,
  replaceOutputPlaceholders,
  resolveSingletonOperationInputs,
  shouldAddCopyCodec,
  splitArgs,
} from './renderUtils';
import applyCropBlackBars from './renderCrop';
import {
  applyContainerConform,
  applyRemoveStreamByProperty,
  applyReorderStreams,
} from './renderStreamOperations';
import {
  applyAudioEncoder,
  applyEnsureAudioStream,
  applyNormalizeAudio,
} from './renderAudio';
import {
  applyVideoBitrate,
  applyVideoEncoder,
} from './renderVideoEncoder';
import { applyVideoFilters } from './renderVideoFilters';
import {
  assertAudioEncoderConfiguredForNormalize,
  assertNoImplicitEncoder,
  hasConfiguredAudioEncoder,
  warnForCustomOutputConflicts,
} from './renderValidation';

export type {
  IffmpegCommandV2RenderResult,
  IffmpegCommandV2WorkingStream,
} from './renderTypes';

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

  const audioEncoderInputs = singletonInputs.setAudioEncoder;
  const normalizeAudioInputs = singletonInputs.normalizeAudio;
  if (normalizeAudioInputs) {
    assertAudioEncoderConfiguredForNormalize(args, streams, audioEncoderInputs);
    shouldProcess = applyNormalizeAudio(args, streams, normalizeAudioInputs) || shouldProcess;
  }

  if (hasConfiguredAudioEncoder(audioEncoderInputs)) {
    shouldProcess = applyAudioEncoder(streams, audioEncoderInputs) || shouldProcess;
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

  assertNoImplicitEncoder(args, filteredStreams);

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
