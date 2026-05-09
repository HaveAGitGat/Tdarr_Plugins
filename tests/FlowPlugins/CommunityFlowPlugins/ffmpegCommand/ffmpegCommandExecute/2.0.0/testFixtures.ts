import { spawnSync } from 'child_process';
import { plugin, renderFfmpegCommandV2 } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/2.0.0/index';
import { IffmpegCommandV2Operation } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import { createDefaultV2Streams, createV2Args } from '../../v2TestUtils';

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils', () => ({
  getEncoder: jest.fn(),
}));

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

const vaapiInputArgs = [
  '-hwaccel',
  'vaapi',
  '-hwaccel_device',
  '/dev/dri/renderD128',
  '-hwaccel_output_format',
  'vaapi',
];

const defaultLoudnormValues = {
  input_i: '-16.42',
  input_tp: '-0.23',
  input_lra: '11.32',
  input_thresh: '-26.83',
  target_offset: '0.59',
};

const defaultNormalizeInputs = {
  i: '-23.0',
  lra: '7.0',
  tp: '-2.0',
  maxGain: '15',
};

type SpawnOutput = {
  stdout: string,
  stderr: string,
  status: number,
  signal: null,
};

type ExecuteMocks = {
  readonly mockGetEncoder: jest.Mock,
  readonly mockSpawnSync: jest.Mock,
  mockVaapiEncoder: () => void,
  mockSoftwareEncoder: () => void,
};

export const makeCropdetectOutput = (w: number, h: number, x: number, y: number, count: number): string => {
  let output = '';

  for (let i = 0; i < count; i += 1) {
    output += `[Parsed_cropdetect_0 @ 0x0] x1:0 x2:${w - 1} y1:${y} y2:${y + h - 1}`
      + ` w:${w} h:${h} x:${x} y:${y} pts:${i * 40} t:${(i * 40) / 1000} crop=${w}:${h}:${x}:${y}\n`;
  }

  return output;
};

export const makeSpawnOutput = (output: string, status = 0): SpawnOutput => ({
  stdout: '',
  stderr: output,
  status,
  signal: null,
});

export const makeStdoutSpawnOutput = (output: string): SpawnOutput => ({
  stdout: output,
  stderr: '',
  status: 0,
  signal: null,
});

export const makeLoudnormOutput = (overrides: Record<string, string> = {}): string => {
  const values = {
    ...defaultLoudnormValues,
    ...overrides,
  };

  return [
    'Some other output',
    `[Parsed_loudnorm_0 @ 0x123456] ${JSON.stringify(values, null, 2)}`,
    'More output',
  ].join('\n');
};

export const makeExpectedLoudnormFilter = (
  valueOverrides: Record<string, string> = {},
  inputOverrides: Record<string, string> = {},
): string => {
  const values = {
    ...defaultLoudnormValues,
    ...valueOverrides,
  };
  const inputs = {
    ...defaultNormalizeInputs,
    ...inputOverrides,
  };

  return `loudnorm=print_format=summary:linear=true:I=${inputs.i}:LRA=${inputs.lra}:TP=${inputs.tp}:`
    + `measured_i=${values.input_i}:`
    + `measured_lra=${values.input_lra}:`
    + `measured_tp=${values.input_tp}:`
    + `measured_thresh=${values.input_thresh}:offset=${values.target_offset}`;
};

export const createEncoderOperation = (inputs: Record<string, unknown> = {}): IffmpegCommandV2Operation => ({
  pluginName: 'ffmpegCommandSetVideoEncoder',
  pluginVersion: '2.0.0',
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

export const createSoftwareEncoderOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createEncoderOperation({
  outputCodec: 'h264',
  ffmpegPresetEnabled: false,
  ffmpegQualityEnabled: false,
  hardwareEncoding: false,
  hardwareType: 'auto',
  hardwareDecoding: false,
  forceEncoding: false,
  ...inputs,
});

export const createAudioEncoderOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => ({
  pluginName: 'ffmpegCommandSetAudioEncoder',
  pluginVersion: '2.0.0',
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

export const createResolutionOperation = (targetResolution = '1080p'): IffmpegCommandV2Operation => ({
  pluginName: 'ffmpegCommandSetVdeoResolution',
  pluginVersion: '2.0.0',
  operationType: 'setVideoResolution',
  inputs: {
    targetResolution,
  },
});

export const createOperation = (
  pluginName: string,
  operationType: string,
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => ({
  pluginName,
  pluginVersion: '2.0.0',
  operationType,
  inputs,
});

export const createCropBlackBarsOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createOperation('ffmpegCommandCropBlackBars', 'cropBlackBars', {
  cropMode: 'mostCommon',
  cropThreshold: '24',
  sampleCount: '5',
  framesPerSample: '30',
  minCropPercent: '2',
  ...inputs,
});

export const createNormalizeAudioOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createOperation('ffmpegCommandNormalizeAudio', 'normalizeAudio', {
  ...defaultNormalizeInputs,
  ...inputs,
});

export const createEnsureAudioOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createOperation('ffmpegCommandEnsureAudioStream', 'ensureAudioStream', {
  audioEncoder: 'ac3',
  language: 'eng',
  channels: '2',
  enableBitrate: false,
  bitrate: '640k',
  enableSamplerate: false,
  samplerate: '48000',
  ...inputs,
});

export const createDtsAudioStream = (): Istreams => ({
  ...createDefaultV2Streams()[1],
  codec_name: 'dts',
  channels: 6,
});

export const createRemoveDtsAudioOperation = (): IffmpegCommandV2Operation => createOperation(
  'ffmpegCommandRemoveStreamByProperty',
  'removeStreamByProperty',
  {
    codecType: 'audio',
    propertyToCheck: 'codec_name',
    valuesToRemove: 'dts',
    condition: 'equals',
  },
);

export const createConflictMessage = (operationType: string): string => (
  `Conflicting FFmpeg command v2 ${operationType} operations found.`
  + ` Use one ${operationType} operation.`
);

export const createImplicitEncoderMessage = (codecType: string, sourceIndex: number): string => {
  const guidance = codecType === 'audio'
    ? 'Add Set Audio Encoder before audio operations that require encoding.'
    : 'Add Set Video Encoder when using video operations that require encoding.';

  return `FFmpeg command v2 ${codecType} stream ${sourceIndex} requires encoding`
    + ` but does not have an explicit encoder. ${guidance}`;
};

type SingletonConflictCase = [string, IffmpegCommandV2Operation, IffmpegCommandV2Operation];

export const singletonConflictCases: SingletonConflictCase[] = [
  [
    'setVideoEncoder',
    createEncoderOperation({ outputCodec: 'hevc' }),
    createEncoderOperation({ outputCodec: 'h264' }),
  ],
  [
    'setAudioEncoder',
    createAudioEncoderOperation({ audioEncoder: 'aac' }),
    createAudioEncoderOperation({ audioEncoder: 'ac3' }),
  ],
  [
    'setVideoResolution',
    createResolutionOperation('720p'),
    createResolutionOperation('1080p'),
  ],
  [
    'setVideoFramerate',
    createOperation('ffmpegCommandSetVdeoFramerate', 'setVideoFramerate', { framerate: 24 }),
    createOperation('ffmpegCommandSetVdeoFramerate', 'setVideoFramerate', { framerate: 30 }),
  ],
  [
    'setVideoBitrate',
    createOperation('ffmpegCommandSetVideoBitrate', 'setVideoBitrate', {
      useInputBitrate: false,
      targetBitratePercent: '50',
      fallbackBitrate: '5000',
      bitrate: '3000',
    }),
    createOperation('ffmpegCommandSetVideoBitrate', 'setVideoBitrate', {
      useInputBitrate: false,
      targetBitratePercent: '50',
      fallbackBitrate: '5000',
      bitrate: '5000',
    }),
  ],
  [
    'setContainer',
    createOperation('ffmpegCommandSetContainer', 'setContainer', {
      container: 'mkv',
      forceConform: false,
    }),
    createOperation('ffmpegCommandSetContainer', 'setContainer', {
      container: 'mp4',
      forceConform: false,
    }),
  ],
  [
    'reorderStreams',
    createOperation('ffmpegCommandRorderStreams', 'reorderStreams', {
      processOrder: 'streamTypes',
      languages: '',
      channels: '',
      codecs: '',
      streamTypes: 'audio,video',
    }),
    createOperation('ffmpegCommandRorderStreams', 'reorderStreams', {
      processOrder: 'streamTypes',
      languages: '',
      channels: '',
      codecs: '',
      streamTypes: 'video,audio',
    }),
  ],
  [
    'cropBlackBars',
    createCropBlackBarsOperation({ cropMode: 'minimum' }),
    createCropBlackBarsOperation({ cropMode: 'maximum' }),
  ],
  [
    'normalizeAudio',
    createNormalizeAudioOperation({ i: '-23.0' }),
    createNormalizeAudioOperation({ i: '-16.0' }),
  ],
];

export const setupFfmpegCommandExecuteMocks = (): ExecuteMocks => {
  let mockGetEncoder: jest.Mock;
  let mockSpawnSync: jest.Mock;

  const mockVaapiEncoder = () => {
    mockGetEncoder.mockResolvedValue({
      encoder: 'hevc_vaapi',
      inputArgs: vaapiInputArgs,
      outputArgs: [],
      isGpu: true,
      enabledDevices: [],
    });
  };

  const mockSoftwareEncoder = () => {
    mockGetEncoder.mockResolvedValue({
      encoder: 'libx264',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    });
  };

  beforeEach(() => {
    const { getEncoder } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils');
    mockGetEncoder = getEncoder;
    mockGetEncoder.mockResolvedValue({
      encoder: 'hevc_qsv',
      inputArgs: ['-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv'],
      outputArgs: [],
      isGpu: true,
      enabledDevices: [],
    });

    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    CLI.mockImplementation(() => ({
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
    }));

    mockSpawnSync = spawnSync as jest.Mock;
    mockSpawnSync.mockReturnValue(makeSpawnOutput(''));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  return {
    get mockGetEncoder() {
      return mockGetEncoder;
    },
    get mockSpawnSync() {
      return mockSpawnSync;
    },
    mockVaapiEncoder,
    mockSoftwareEncoder,
  };
};

export {
  createDefaultV2Streams,
  createV2Args,
  plugin,
  renderFfmpegCommandV2,
};

export type {
  IffmpegCommandV2Operation,
};
