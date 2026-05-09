import type { IffmpegCommandV2Operation, IpluginInputArgs } from
  '../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import type { IgetEncoder } from '../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils';
import type { Istreams } from '../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import type {
  IffmpegCommandV2RenderResult,
} from '../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/2.0.0/render';
import { createDefaultV2Streams, createV2Args } from '../v2TestUtils';

export { createDefaultV2Streams };

interface IffmpegCommandV2ScenarioExpected {
  spawnArgs?: string[],
  shouldProcess?: boolean,
  container?: string,
  sourceIndexes?: number[],
  codecTypes?: string[],
  jobLogs?: string[],
  errorMessage?: string,
}

export interface IffmpegCommandV2Scenario {
  id: string,
  description: string,
  streams?: Istreams[],
  operations: IffmpegCommandV2Operation[],
  operationVariants?: IffmpegCommandV2Operation[][],
  encoder?: IgetEncoder,
  inputFile?: {
    id?: string,
    container?: string,
  },
  sourceFileId?: string,
  expected: IffmpegCommandV2ScenarioExpected,
}

export interface IffmpegCommandV2ScenarioRun {
  args: IpluginInputArgs,
  result: IffmpegCommandV2RenderResult,
}

export const createV2VideoStream = (overrides: Partial<Istreams> = {}): Istreams => ({
  index: 0,
  codec_name: 'h264',
  codec_type: 'video',
  width: 1280,
  height: 720,
  avg_frame_rate: '30000/1001',
  ...overrides,
});

export const createV2AudioStream = (overrides: Partial<Istreams> = {}): Istreams => ({
  index: 1,
  codec_name: 'aac',
  codec_type: 'audio',
  channels: 2,
  tags: {
    language: 'eng',
  },
  ...overrides,
});

export const createV2SubtitleStream = (overrides: Partial<Istreams> = {}): Istreams => ({
  index: 2,
  codec_name: 'subrip',
  codec_type: 'subtitle',
  tags: {
    language: 'eng',
  },
  ...overrides,
});

export const createV2DataStream = (overrides: Partial<Istreams> = {}): Istreams => ({
  index: 3,
  codec_name: 'bin_data',
  codec_type: 'data',
  ...overrides,
});

export const createV2AttachmentStream = (overrides: Partial<Istreams> = {}): Istreams => ({
  index: 4,
  codec_name: 'mjpeg',
  codec_type: 'video',
  disposition: {
    attached_pic: 1,
  },
  ...overrides,
});

const createV2Operation = ({
  pluginName,
  operationType,
  inputs = {},
}: {
  pluginName: string,
  operationType: string,
  inputs?: Record<string, unknown>,
}): IffmpegCommandV2Operation => ({
  pluginName,
  pluginVersion: '2.0.0',
  operationType,
  inputs,
});

export const createV2VideoEncoderOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandSetVideoEncoder',
  operationType: 'setVideoEncoder',
  inputs: {
    outputCodec: 'hevc',
    ffmpegPresetEnabled: true,
    ffmpegPreset: 'fast',
    ffmpegQualityEnabled: true,
    ffmpegQuality: '25',
    hardwareEncoding: true,
    hardwareType: 'qsv',
    hardwareDecoding: true,
    forceEncoding: true,
    ...inputs,
  },
});

export const createV2AudioEncoderOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandSetAudioEncoder',
  operationType: 'setAudioEncoder',
  inputs: {
    audioEncoder: 'aac',
    forceEncoding: true,
    enableBitrate: false,
    bitrate: '192k',
    enableSamplerate: false,
    samplerate: '48000',
    ...inputs,
  },
});

export const createV2VideoResolutionOperation = (
  targetResolution = '1080p',
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandSetVdeoResolution',
  operationType: 'setVideoResolution',
  inputs: {
    targetResolution,
  },
});

export const createV2VideoFramerateOperation = (
  framerate = '24',
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandSetVdeoFramerate',
  operationType: 'setVideoFramerate',
  inputs: {
    framerate,
  },
});

export const createV2VideoBitrateOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandSetVideoBitrate',
  operationType: 'setVideoBitrate',
  inputs: {
    useInputBitrate: false,
    bitrate: '5000',
    targetBitratePercent: '50',
    fallbackBitrate: '5000',
    ...inputs,
  },
});

export const createV2Set10BitOperation = (): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommand10BitVideo',
  operationType: 'set10BitVideo',
});

export const createV2HdrToSdrOperation = (): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandHdrToSdr',
  operationType: 'hdrToSdr',
});

export const createV2NormalizeAudioOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandNormalizeAudio',
  operationType: 'normalizeAudio',
  inputs: {
    i: '-23.0',
    lra: '7.0',
    tp: '-2.0',
    maxGain: '15',
    ...inputs,
  },
});

export const createV2RemoveDataStreamsOperation = (): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandRemoveDataStreams',
  operationType: 'removeDataStreams',
});

export const createV2RemoveSubtitlesOperation = (): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandRemoveSubtitles',
  operationType: 'removeSubtitles',
});

export const createV2RemoveStreamByPropertyOperation = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandRemoveStreamByProperty',
  operationType: 'removeStreamByProperty',
  inputs,
});

export const createV2SetContainerOperation = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandSetContainer',
  operationType: 'setContainer',
  inputs,
});

export const createV2EnsureAudioStreamOperation = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandEnsureAudioStream',
  operationType: 'ensureAudioStream',
  inputs,
});

export const createV2ReorderStreamsOperation = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandRorderStreams',
  operationType: 'reorderStreams',
  inputs,
});

export const createV2CustomArgumentsOperation = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => createV2Operation({
  pluginName: 'ffmpegCommandCustomArguments',
  operationType: 'customArguments',
  inputs,
});

export const createV2MockEncoder = (overrides: Partial<IgetEncoder> = {}): IgetEncoder => ({
  encoder: 'hevc_qsv',
  inputArgs: ['-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv'],
  outputArgs: [],
  isGpu: true,
  enabledDevices: [],
  ...overrides,
});

export const createV2ScenarioArgs = (
  scenario: IffmpegCommandV2Scenario,
  operations: IffmpegCommandV2Operation[] = scenario.operations,
): IpluginInputArgs => {
  const args = createV2Args({
    streams: scenario.streams,
    operations,
  });

  if (scenario.inputFile?.id) {
    args.inputFileObj._id = scenario.inputFile.id;
  }

  if (scenario.inputFile?.container) {
    args.inputFileObj.container = scenario.inputFile.container;
  }

  if (args.variables.ffmpegCommandV2) {
    args.variables.ffmpegCommandV2.sourceFileId = scenario.sourceFileId || args.inputFileObj._id;
  }

  return args;
};
