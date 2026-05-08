import type { IffmpegCommandV2Request, IpluginInputArgs } from
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
  requests: IffmpegCommandV2Request[],
  requestVariants?: IffmpegCommandV2Request[][],
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

const createV2Request = ({
  pluginName,
  requestType,
  inputs = {},
}: {
  pluginName: string,
  requestType: string,
  inputs?: Record<string, unknown>,
}): IffmpegCommandV2Request => ({
  pluginName,
  pluginVersion: '2.0.0',
  requestType,
  inputs,
});

export const createV2VideoEncoderRequest = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandSetVideoEncoder',
  requestType: 'setVideoEncoder',
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

export const createV2VideoResolutionRequest = (
  targetResolution = '1080p',
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandSetVdeoResolution',
  requestType: 'setVideoResolution',
  inputs: {
    targetResolution,
  },
});

export const createV2VideoFramerateRequest = (
  framerate = '24',
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandSetVdeoFramerate',
  requestType: 'setVideoFramerate',
  inputs: {
    framerate,
  },
});

export const createV2VideoBitrateRequest = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandSetVideoBitrate',
  requestType: 'setVideoBitrate',
  inputs: {
    useInputBitrate: false,
    bitrate: '5000',
    targetBitratePercent: '50',
    fallbackBitrate: '5000',
    ...inputs,
  },
});

export const createV2Set10BitRequest = (): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommand10BitVideo',
  requestType: 'set10BitVideo',
});

export const createV2HdrToSdrRequest = (): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandHdrToSdr',
  requestType: 'hdrToSdr',
});

export const createV2CropBlackBarsRequest = (): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandCropBlackBars',
  requestType: 'cropBlackBars',
});

export const createV2NormalizeAudioRequest = (): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandNormalizeAudio',
  requestType: 'normalizeAudio',
});

export const createV2RemoveDataStreamsRequest = (): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandRemoveDataStreams',
  requestType: 'removeDataStreams',
});

export const createV2RemoveSubtitlesRequest = (): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandRemoveSubtitles',
  requestType: 'removeSubtitles',
});

export const createV2RemoveStreamByPropertyRequest = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandRemoveStreamByProperty',
  requestType: 'removeStreamByProperty',
  inputs,
});

export const createV2SetContainerRequest = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandSetContainer',
  requestType: 'setContainer',
  inputs,
});

export const createV2EnsureAudioStreamRequest = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandEnsureAudioStream',
  requestType: 'ensureAudioStream',
  inputs,
});

export const createV2ReorderStreamsRequest = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandRorderStreams',
  requestType: 'reorderStreams',
  inputs,
});

export const createV2CustomArgumentsRequest = (
  inputs: Record<string, unknown>,
): IffmpegCommandV2Request => createV2Request({
  pluginName: 'ffmpegCommandCustomArguments',
  requestType: 'customArguments',
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
  requests: IffmpegCommandV2Request[] = scenario.requests,
): IpluginInputArgs => {
  const args = createV2Args({
    streams: scenario.streams,
    requests,
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
