import { spawnSync } from 'child_process';
import { plugin, renderFfmpegCommandV2 } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/2.0.0/index';
import { IffmpegCommandV2Operation } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
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

const makeCropdetectOutput = (w: number, h: number, x: number, y: number, count: number): string => {
  let output = '';

  for (let i = 0; i < count; i += 1) {
    output += `[Parsed_cropdetect_0 @ 0x0] x1:0 x2:${w - 1} y1:${y} y2:${y + h - 1}`
      + ` w:${w} h:${h} x:${x} y:${y} pts:${i * 40} t:${(i * 40) / 1000} crop=${w}:${h}:${x}:${y}\n`;
  }

  return output;
};

const makeSpawnOutput = (output: string, status = 0) => ({
  stdout: '',
  stderr: output,
  status,
  signal: null,
});

const makeStdoutSpawnOutput = (output: string) => ({
  stdout: output,
  stderr: '',
  status: 0,
  signal: null,
});

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

const makeLoudnormOutput = (overrides: Record<string, string> = {}): string => {
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

const makeExpectedLoudnormFilter = (
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

const createEncoderOperation = (inputs: Record<string, unknown> = {}): IffmpegCommandV2Operation => ({
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

const createSoftwareEncoderOperation = (
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

const createAudioEncoderOperation = (
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

const createResolutionOperation = (targetResolution = '1080p'): IffmpegCommandV2Operation => ({
  pluginName: 'ffmpegCommandSetVdeoResolution',
  pluginVersion: '2.0.0',
  operationType: 'setVideoResolution',
  inputs: {
    targetResolution,
  },
});

const createOperation = (
  pluginName: string,
  operationType: string,
  inputs: Record<string, unknown>,
): IffmpegCommandV2Operation => ({
  pluginName,
  pluginVersion: '2.0.0',
  operationType,
  inputs,
});

const createCropBlackBarsOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createOperation('ffmpegCommandCropBlackBars', 'cropBlackBars', {
  cropMode: 'mostCommon',
  cropThreshold: '24',
  sampleCount: '5',
  framesPerSample: '30',
  minCropPercent: '2',
  ...inputs,
});

const createNormalizeAudioOperation = (
  inputs: Record<string, unknown> = {},
): IffmpegCommandV2Operation => createOperation('ffmpegCommandNormalizeAudio', 'normalizeAudio', {
  ...defaultNormalizeInputs,
  ...inputs,
});

const createEnsureAudioOperation = (
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

const createDtsAudioStream = () => ({
  ...createDefaultV2Streams()[1],
  codec_name: 'dts',
  channels: 6,
});

const createConflictMessage = (operationType: string): string => (
  `Conflicting FFmpeg command v2 ${operationType} operations found.`
  + ` Use one ${operationType} operation.`
);

const createImplicitEncoderMessage = (codecType: string, sourceIndex: number): string => {
  const guidance = codecType === 'audio'
    ? 'Add Set Audio Encoder before audio operations that require encoding.'
    : 'Add Set Video Encoder when using video operations that require encoding.';

  return `FFmpeg command v2 ${codecType} stream ${sourceIndex} requires encoding`
    + ` but does not have an explicit encoder. ${guidance}`;
};

type SingletonConflictCase = [string, IffmpegCommandV2Operation, IffmpegCommandV2Operation];

const singletonConflictCases: SingletonConflictCase[] = [
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

const vaapiInputArgs = [
  '-hwaccel',
  'vaapi',
  '-hwaccel_device',
  '/dev/dri/renderD128',
  '-hwaccel_output_format',
  'vaapi',
];

describe('ffmpegCommandExecute v2 Plugin', () => {
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

  it('renders identical QSV args when encoder and resolution operation order changes', async () => {
    const encoderOperation = createEncoderOperation();
    const resolutionOperation = createResolutionOperation();

    const encoderThenResolution = await renderFfmpegCommandV2(createV2Args({
      operations: [encoderOperation, resolutionOperation],
    }));
    const resolutionThenEncoder = await renderFfmpegCommandV2(createV2Args({
      operations: [resolutionOperation, encoderOperation],
    }));

    expect(encoderThenResolution.spawnArgs).toEqual(resolutionThenEncoder.spawnArgs);
    expect(encoderThenResolution.spawnArgs).toEqual([
      '-y',
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'hevc_qsv',
      '-global_quality',
      '25',
      '-preset',
      'fast',
      '-filter:v:0',
      'vpp_qsv=w=1920:h=1080',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
  });

  it('allows duplicate singleton operations when their inputs are identical', async () => {
    const resolutionOperation = createResolutionOperation();
    mockSoftwareEncoder();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [resolutionOperation, resolutionOperation, createSoftwareEncoderOperation()],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'libx264',
      '-filter:v:0',
      'scale=1920:-2',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
  });

  it.each(singletonConflictCases)('rejects conflicting duplicate %s operations independent of order', async (
    operationType,
    firstOperation,
    secondOperation,
  ) => {
    const message = createConflictMessage(operationType);

    const firstThenSecond = createV2Args({
      operations: [firstOperation, secondOperation],
    });
    await expect(renderFfmpegCommandV2(firstThenSecond)).rejects.toThrow(message);
    expect(firstThenSecond.jobLog).toHaveBeenCalledWith(message);

    const secondThenFirst = createV2Args({
      operations: [secondOperation, firstOperation],
    });
    await expect(renderFfmpegCommandV2(secondThenFirst)).rejects.toThrow(message);
    expect(secondThenFirst.jobLog).toHaveBeenCalledWith(message);
  });

  it.each([
    [
      'resolution',
      [createResolutionOperation()],
    ],
    [
      'framerate',
      [createOperation('ffmpegCommandSetVdeoFramerate', 'setVideoFramerate', { framerate: 24 })],
    ],
    [
      'video bitrate',
      [createOperation('ffmpegCommandSetVideoBitrate', 'setVideoBitrate', {
        useInputBitrate: false,
        targetBitratePercent: '50',
        fallbackBitrate: '5000',
        bitrate: '3000',
      })],
    ],
    [
      '10-bit',
      [createOperation('ffmpegCommand10BitVideo', 'set10BitVideo', {})],
    ],
    [
      'HDR to SDR',
      [createOperation('ffmpegCommandHdrToSdr', 'hdrToSdr', {})],
    ],
  ])('rejects %s without an explicit video encoder', async (_name, operations) => {
    const args = createV2Args({
      operations,
    });
    const message = createImplicitEncoderMessage('video', 0);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('uses software scale for QSV encoding when hardware decoding is disabled', async () => {
    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createEncoderOperation({
          hardwareDecoding: false,
        }),
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).not.toContain('-hwaccel');
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:v:0',
      'scale=1920:-2',
    ]));
    expect(renderResult.spawnArgs).not.toContain('vpp_qsv=w=1920:h=1080');
  });

  it('uses a VAAPI scale filter when VAAPI hardware decoding and a resolution operation are present', async () => {
    mockVaapiEncoder();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createEncoderOperation({
          ffmpegQualityEnabled: false,
          hardwareType: 'vaapi',
          hardwareDecoding: true,
        }),
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-vaapi_device',
      '/dev/dri/renderD128',
      '-hwaccel',
      'vaapi',
      '-hwaccel_device',
      '/dev/dri/renderD128',
      '-hwaccel_output_format',
      'vaapi',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'hevc_vaapi',
      '-filter:v:0',
      'scale_vaapi=w=1920:h=1080',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
    expect(renderResult.spawnArgs).not.toContain('scale=1920:-2');
  });

  it('initializes VAAPI and uploads frames when VAAPI hardware decoding is disabled', async () => {
    mockVaapiEncoder();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createEncoderOperation({
          ffmpegQualityEnabled: false,
          hardwareType: 'vaapi',
          hardwareDecoding: false,
        }),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-vaapi_device',
      '/dev/dri/renderD128',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'hevc_vaapi',
      '-filter:v:0',
      'format=nv12,hwupload',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
    expect(renderResult.spawnArgs).not.toContain('-hwaccel');
  });

  it('downloads and uploads VAAPI frames when software filters are needed', async () => {
    mockVaapiEncoder();
    const hdrOperation: IffmpegCommandV2Operation = {
      pluginName: 'ffmpegCommandHdrToSdr',
      pluginVersion: '2.0.0',
      operationType: 'hdrToSdr',
      inputs: {},
    };

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createEncoderOperation({
          ffmpegQualityEnabled: false,
          hardwareType: 'vaapi',
          hardwareDecoding: true,
        }),
        hdrOperation,
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-vaapi_device',
      '/dev/dri/renderD128',
    ]));
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:v:0',
      'hwdownload,format=nv12,zscale=t=linear:npl=100,format=yuv420p,scale=1920:-2,format=nv12,hwupload',
    ]));
  });

  it('downloads, crops, scales, and reuploads QSV frames when crop is combined with hardware decoding', async () => {
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
        createEncoderOperation(),
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
      '-filter:v:0',
      'hwdownload,format=nv12,crop=1280:600:0:60,scale=1920:-2,hwupload=extra_hw_frames=64,format=qsv',
    ]));
  });

  it('downloads, crops, applies software filters, and reuploads VAAPI frames', async () => {
    mockVaapiEncoder();
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));
    const hdrOperation: IffmpegCommandV2Operation = {
      pluginName: 'ffmpegCommandHdrToSdr',
      pluginVersion: '2.0.0',
      operationType: 'hdrToSdr',
      inputs: {},
    };

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createEncoderOperation({
          ffmpegQualityEnabled: false,
          hardwareType: 'vaapi',
          hardwareDecoding: true,
        }),
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
        hdrOperation,
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:v:0',
      'hwdownload,format=nv12,crop=1280:600:0:60,zscale=t=linear:npl=100,format=yuv420p,'
      + 'scale=1920:-2,format=nv12,hwupload',
    ]));
  });

  it('renders stable 10-bit args regardless of operation order', async () => {
    mockGetEncoder.mockResolvedValue({
      encoder: 'libsvtav1',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    });
    const encoderOperation = createEncoderOperation({
      outputCodec: 'av1',
      hardwareEncoding: false,
      hardwareType: 'auto',
      hardwareDecoding: false,
    });
    const tenBitOperation: IffmpegCommandV2Operation = {
      pluginName: 'ffmpegCommand10BitVideo',
      pluginVersion: '2.0.0',
      operationType: 'set10BitVideo',
      inputs: {},
    };

    const tenBitThenEncoder = await renderFfmpegCommandV2(createV2Args({
      operations: [tenBitOperation, encoderOperation],
    }));
    const encoderThenTenBit = await renderFfmpegCommandV2(createV2Args({
      operations: [encoderOperation, tenBitOperation],
    }));

    expect(tenBitThenEncoder.spawnArgs).toEqual(encoderThenTenBit.spawnArgs);
    expect(tenBitThenEncoder.spawnArgs).toEqual(expect.arrayContaining([
      '-c:0',
      'libsvtav1',
      '-crf',
      '25',
      '-pix_fmt:v:0',
      'yuv420p10le',
    ]));
    expect(tenBitThenEncoder.spawnArgs).not.toContain('-profile:v:0');
  });

  it('combines HDR and resolution into one scoped video filter chain', async () => {
    const hdrOperation: IffmpegCommandV2Operation = {
      pluginName: 'ffmpegCommandHdrToSdr',
      pluginVersion: '2.0.0',
      operationType: 'hdrToSdr',
      inputs: {},
    };
    mockSoftwareEncoder();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [hdrOperation, createResolutionOperation(), createSoftwareEncoderOperation()],
    }));
    const filterOptions = renderResult.spawnArgs.filter((arg) => arg === '-vf' || arg.startsWith('-filter'));

    expect(filterOptions).toEqual(['-filter:v:0']);
    expect(renderResult.spawnArgs).toContain('zscale=t=linear:npl=100,format=yuv420p,scale=1920:-2');
  });

  it('scopes filters and codecs correctly across multiple video streams', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      {
        ...createDefaultV2Streams()[0],
        index: 1,
        codec_name: 'hevc',
      },
      {
        ...createDefaultV2Streams()[1],
        index: 2,
      },
    ];

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        createEncoderOperation({
          hardwareDecoding: false,
        }),
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-map',
      '0:0',
      '-c:0',
      'hevc_qsv',
      '-filter:v:0',
      'scale=1920:-2',
      '-map',
      '0:1',
      '-c:1',
      'hevc_qsv',
      '-filter:v:1',
      'scale=1920:-2',
      '-map',
      '0:2',
      '-c:2',
      'copy',
    ]));
  });

  it('uses the selected encoder when force encoding is disabled but filters require transcoding', async () => {
    const streams = [
      {
        ...createDefaultV2Streams()[0],
        codec_name: 'hevc',
      },
      createDefaultV2Streams()[1],
    ];

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        createEncoderOperation({
          forceEncoding: false,
        }),
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'hevc_qsv',
      '-global_quality',
      '25',
      '-preset',
      'fast',
      '-filter:v:0',
      'vpp_qsv=w=1920:h=1080',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
  });

  it('uses stream dimensions for resolution decisions when file-level resolution is stale', async () => {
    const args = createV2Args({
      operations: [
        createResolutionOperation(),
        createSoftwareEncoderOperation(),
      ],
    });
    args.inputFileObj.video_resolution = '1080p';
    mockSoftwareEncoder();

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'libx264',
      '-filter:v:0',
      'scale=1920:-2',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
  });

  it('does not scale video streams whose own dimensions already match the target', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      {
        ...createDefaultV2Streams()[0],
        index: 1,
        width: 1920,
        height: 1080,
      },
      {
        ...createDefaultV2Streams()[1],
        index: 2,
      },
    ];

    mockSoftwareEncoder();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        createResolutionOperation(),
        createSoftwareEncoderOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'libx264',
      '-filter:v:0',
      'scale=1920:-2',
      '-map',
      '0:1',
      '-c:1',
      'copy',
      '-map',
      '0:2',
      '-c:2',
      'copy',
    ]);
    expect(renderResult.spawnArgs).not.toContain('-filter:v:1');
  });

  it('classifies portrait stream dimensions the same way as Tdarr file scanning', async () => {
    const streams = [
      {
        ...createDefaultV2Streams()[0],
        width: 720,
        height: 1280,
      },
      createDefaultV2Streams()[1],
    ];
    const args = createV2Args({
      streams,
      operations: [
        createResolutionOperation('720p'),
      ],
    });
    args.inputFileObj.video_resolution = '1080p';

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(false);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
  });

  it('skips removed video streams during later encoder and filter phases', async () => {
    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        {
          pluginName: 'ffmpegCommandRemoveStreamByProperty',
          pluginVersion: '2.0.0',
          operationType: 'removeStreamByProperty',
          inputs: {
            codecType: 'video',
            propertyToCheck: 'codec_name',
            valuesToRemove: 'h264',
            condition: 'equals',
          },
        },
        createEncoderOperation(),
      ],
    }));

    expect(mockGetEncoder).not.toHaveBeenCalled();
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:1',
      '-c:0',
      'copy',
    ]);
  });

  it('sets audio encoder args on active audio streams', async () => {
    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createAudioEncoderOperation({
          audioEncoder: 'libopus',
          enableBitrate: true,
          bitrate: '128k',
          enableSamplerate: true,
          samplerate: '48000',
        }),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'libopus',
      '-b:a:0',
      '128k',
      '-ar:a:0',
      '48000',
    ]);
  });

  it('does not encode matching audio when Set Audio Encoder force encoding is disabled', async () => {
    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
      ],
    }));

    expect(renderResult.shouldProcess).toBe(false);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
  });

  it('removes and reorders streams while keeping output indexes deterministic', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDefaultV2Streams()[1],
      {
        index: 2,
        codec_name: 'subrip',
        codec_type: 'subtitle',
      },
      {
        index: 3,
        codec_name: 'ac3',
        codec_type: 'audio',
        channels: 6,
        tags: {
          language: 'fre',
        },
      },
    ];
    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        {
          pluginName: 'ffmpegCommandRemoveSubtitles',
          pluginVersion: '2.0.0',
          operationType: 'removeSubtitles',
          inputs: {},
        },
        {
          pluginName: 'ffmpegCommandRorderStreams',
          pluginVersion: '2.0.0',
          operationType: 'reorderStreams',
          inputs: {
            processOrder: 'streamTypes',
            languages: '',
            channels: '',
            codecs: '',
            streamTypes: 'audio,video',
          },
        },
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:1',
      '-c:0',
      'copy',
      '-map',
      '0:3',
      '-c:1',
      'copy',
      '-map',
      '0:0',
      '-c:2',
      'copy',
    ]);
  });

  it('preserves custom args and logs obvious output conflicts', async () => {
    const args = createV2Args({
      operations: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          operationType: 'customArguments',
          inputs: {
            inputArguments: '-threads 2',
            outputArguments: '-vf scale=1280:-2 -movflags +faststart',
          },
        },
      ],
    });

    const renderResult = await renderFfmpegCommandV2(args);

    expect(args.jobLog).toHaveBeenCalledWith(
      'Custom FFmpeg output arguments include command-shaping options that may conflict with v2 rendering.',
    );
    expect(renderResult.spawnArgs.slice(0, 5)).toEqual(['-y', '-threads', '2', '-i', '/tmp/source.mp4']);
    expect(renderResult.spawnArgs.slice(-4)).toEqual(['-vf', 'scale=1280:-2', '-movflags', '+faststart']);
  });

  it('parses quoted custom args with the injected argument parser', async () => {
    const args = createV2Args({
      operations: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          operationType: 'customArguments',
          inputs: {
            inputArguments: '-threads 2',
            outputArguments: '-metadata title="My Movie"',
          },
        },
      ],
    });
    args.deps.parseArgsStringToArgv = jest.fn((value: string) => {
      if (value.includes('-metadata')) {
        return ['-metadata', 'title=My Movie'];
      }
      return ['-threads', '2'];
    });

    const renderResult = await renderFfmpegCommandV2(args);

    expect(args.deps.parseArgsStringToArgv).toHaveBeenCalledWith('-metadata title="My Movie"', '', '');
    expect(renderResult.spawnArgs.slice(-2)).toEqual(['-metadata', 'title=My Movie']);
  });

  it('derives and normalizes streams from the current input file at render time', async () => {
    const streams = [
      ...createDefaultV2Streams(),
      {
        index: 2,
        codec_name: 'mjpeg',
        codec_type: 'video',
        disposition: {
          attached_pic: 1,
        },
      },
    ];

    const renderResult = await renderFfmpegCommandV2(createV2Args({ streams }));

    expect(renderResult.streams[2]).toMatchObject({
      index: 2,
      sourceIndex: 2,
      codec_type: 'attachment',
      removed: false,
    });
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-map',
      '0:2',
      '-c:2',
      'copy',
    ]));
  });

  it('throws when FFprobe streams are not available during render', async () => {
    const args = createV2Args();
    delete args.inputFileObj.ffProbeData.streams;

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow('Error parsing FFprobe streams');
    expect(args.jobLog).toHaveBeenCalledWith(expect.stringContaining('Error parsing FFprobe streams'));
  });

  it('logs when the input file changed between v2 Begin and Execute', async () => {
    const args = createV2Args();
    if (!args.variables.ffmpegCommandV2) {
      throw new Error('Expected v2 state');
    }
    args.variables.ffmpegCommandV2.sourceFileId = '/tmp/old-source.mp4';

    await renderFfmpegCommandV2(args);

    expect(args.jobLog).toHaveBeenCalledWith(
      'FFmpeg command v2 input changed between Begin Command and Execute; rendering from current input file.',
    );
  });

  it('throws when crop black bars detects a crop without Set Video Encoder', async () => {
    const args = createV2Args({
      operations: [
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const message = createImplicitEncoderMessage('video', 0);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('detects crop black bars and emits a scoped crop filter when Set Video Encoder is configured', async () => {
    mockSoftwareEncoder();

    const args = createV2Args({
      operations: [
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
        createSoftwareEncoderOperation(),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'libx264',
      '-filter:v:0',
      'crop=1280:600:0:60',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
    expect(mockSpawnSync).toHaveBeenCalledWith('/usr/bin/ffmpeg', expect.arrayContaining([
      '-map',
      '0:0',
      '-frames:v',
      '30',
      'cropdetect=24:2:0',
    ]), expect.objectContaining({ shell: false }));
  });

  it('prepends crop before generated video filters independent of operation order', async () => {
    const cropOperation = createCropBlackBarsOperation({
      sampleCount: '1',
    });
    const resolutionOperation = createResolutionOperation('1080p');
    const encoderOperation = createSoftwareEncoderOperation();
    mockSoftwareEncoder();
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const cropThenScale = await renderFfmpegCommandV2(createV2Args({
      operations: [cropOperation, resolutionOperation, encoderOperation],
    }));

    mockSpawnSync.mockClear();
    mockSoftwareEncoder();
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const scaleThenCrop = await renderFfmpegCommandV2(createV2Args({
      operations: [resolutionOperation, cropOperation, encoderOperation],
    }));

    expect(cropThenScale.spawnArgs).toEqual(scaleThenCrop.spawnArgs);
    expect(cropThenScale.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:v:0',
      'crop=1280:600:0:60,scale=1920:-2',
    ]));
  });

  it('does not process when cropdetect returns the full frame', async () => {
    const args = createV2Args({
      operations: [
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 720, 0, 0, 30)));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(false);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
    expect(args.jobLog).toHaveBeenCalledWith('No black bars detected, no cropping needed');
  });

  it('selects the minimum crop when requested', async () => {
    const args = createV2Args({
      operations: [
        createCropBlackBarsOperation({
          cropMode: 'minimum',
          sampleCount: '2',
        }),
        createSoftwareEncoderOperation(),
      ],
    });
    let callCount = 0;
    mockSoftwareEncoder();
    mockSpawnSync.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30));
      }

      return makeStdoutSpawnOutput(makeCropdetectOutput(1280, 680, 0, 20, 30));
    });

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:v:0',
      'crop=1280:680:0:20',
    ]));
  });

  it('detects crop on the next active video stream when an earlier video stream is removed first', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDefaultV2Streams()[1],
      {
        ...createDefaultV2Streams()[0],
        index: 2,
        codec_name: 'hevc',
        width: 640,
        height: 360,
      },
    ];
    const args = createV2Args({
      streams,
      operations: [
        createOperation('ffmpegCommandRemoveStreamByProperty', 'removeStreamByProperty', {
          codecType: 'video',
          propertyToCheck: 'codec_name',
          valuesToRemove: 'h264',
          condition: 'equals',
        }),
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
        createSoftwareEncoderOperation(),
      ],
    });
    mockSoftwareEncoder();
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(640, 300, 0, 30, 30)));

    const renderResult = await renderFfmpegCommandV2(args);
    const cropdetectArgs = mockSpawnSync.mock.calls[0][1] as string[];

    expect(cropdetectArgs).toEqual(expect.arrayContaining(['-map', '0:2']));
    expect(renderResult.streams.map((stream) => stream.sourceIndex)).toEqual([1, 2]);
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-map',
      '0:2',
      '-filter:v:0',
      'crop=640:300:0:30',
    ]));
  });

  it('throws when normalize audio has no explicit audio encoder', async () => {
    const args = createV2Args({
      operations: [
        createNormalizeAudioOperation(),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));
    const message = createImplicitEncoderMessage('audio', 1);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(mockSpawnSync).not.toHaveBeenCalled();
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('throws when normalize audio has an empty audio encoder', async () => {
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          audioEncoder: '',
        }),
        createNormalizeAudioOperation(),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));
    const message = createImplicitEncoderMessage('audio', 1);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(mockSpawnSync).not.toHaveBeenCalled();
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('encodes normalized audio with Set Audio Encoder when force encoding is disabled', async () => {
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
        createNormalizeAudioOperation(),
      ],
    });
    args.platform = 'linux';
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(mockSpawnSync).toHaveBeenCalledWith('/usr/bin/ffmpeg', [
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:1',
      '-af',
      'loudnorm=I=-23.0:LRA=7.0:TP=-2.0:print_format=json',
      '-f',
      'null',
      '/dev/null',
    ], {
      windowsHide: true,
      encoding: 'utf8',
      shell: false,
      maxBuffer: 50 * 1024 * 1024,
    });
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'aac',
      '-filter:a:0',
      makeExpectedLoudnormFilter(),
    ]);
    expect(args.jobLog).toHaveBeenCalledWith(
      'Gain required for stream 1: -6.58 LU (max allowed: 15 LU)',
    );
  });

  it('uses custom normalize audio inputs for loudnorm analysis and output filter', async () => {
    const values = {
      input_i: '-18.42',
      input_tp: '-2.23',
      input_lra: '9.32',
      input_thresh: '-28.83',
      target_offset: '1.59',
    };
    const inputs = {
      i: '-16.0',
      lra: '11.0',
      tp: '-1.5',
      maxGain: '20',
    };
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          audioEncoder: 'libopus',
        }),
        createNormalizeAudioOperation(inputs),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput(values)));

    const renderResult = await renderFfmpegCommandV2(args);
    const loudnormFirstPassArgs = mockSpawnSync.mock.calls[0][1] as string[];

    expect(loudnormFirstPassArgs).toContain('loudnorm=I=-16.0:LRA=11.0:TP=-1.5:print_format=json');
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-c:1',
      'libopus',
      '-filter:a:0',
      makeExpectedLoudnormFilter(values, inputs),
    ]));
  });

  it('skips normalize audio when required gain exceeds maxGain', async () => {
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
        createNormalizeAudioOperation({
          maxGain: '15',
        }),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput({
      input_i: '-60.00',
    })));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(false);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'copy',
    ]);
    expect(args.jobLog).toHaveBeenCalledWith(
      'Skipping normalization for stream 1: required gain of 37.00 LU exceeds max allowed gain of 15 LU.'
      + ' File may be mostly quiet or noise.',
    );
  });

  it('skips normalize audio when there are no active audio streams', async () => {
    const args = createV2Args({
      streams: [
        createDefaultV2Streams()[0],
      ],
      operations: [
        createNormalizeAudioOperation(),
      ],
    });

    const renderResult = await renderFfmpegCommandV2(args);

    expect(mockSpawnSync).not.toHaveBeenCalled();
    expect(renderResult.shouldProcess).toBe(false);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
    ]);
    expect(args.jobLog).toHaveBeenCalledWith('No audio streams found for Normalize Audio; skipping.');
  });

  it('throws when normalize audio first pass fails', async () => {
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
        createNormalizeAudioOperation(),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput('FFmpeg error occurred', 1));

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow('FFmpeg failed');
    expect(args.jobLog).toHaveBeenCalledWith('Running FFmpeg failed');
  });

  it('normalizes each active audio source with its own loudnorm values', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDefaultV2Streams()[1],
      {
        ...createDefaultV2Streams()[1],
        index: 2,
        codec_name: 'ac3',
        channels: 6,
      },
    ];
    const firstValues = {
      input_i: '-18.00',
      target_offset: '1.00',
    };
    const secondValues = {
      input_i: '-20.00',
      input_tp: '-1.11',
      input_lra: '8.00',
      input_thresh: '-30.00',
      target_offset: '2.00',
    };
    const args = createV2Args({
      streams,
      operations: [
        createAudioEncoderOperation(),
        createNormalizeAudioOperation(),
      ],
    });
    mockSpawnSync
      .mockReturnValueOnce(makeSpawnOutput(makeLoudnormOutput(firstValues)))
      .mockReturnValueOnce(makeSpawnOutput(makeLoudnormOutput(secondValues)));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(mockSpawnSync).toHaveBeenCalledTimes(2);
    expect(mockSpawnSync.mock.calls[0][1]).toEqual(expect.arrayContaining(['-map', '0:1']));
    expect(mockSpawnSync.mock.calls[1][1]).toEqual(expect.arrayContaining(['-map', '0:2']));
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:a:0',
      makeExpectedLoudnormFilter(firstValues),
      '-filter:a:1',
      makeExpectedLoudnormFilter(secondValues),
    ]));
  });

  it('reuses loudnorm analysis for derived audio streams without overriding their encoder args', async () => {
    const args = createV2Args({
      operations: [
        createEnsureAudioOperation({
          enableSamplerate: true,
          samplerate: '48000',
        }),
        createAudioEncoderOperation(),
        createNormalizeAudioOperation(),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(mockSpawnSync).toHaveBeenCalledTimes(1);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'aac',
      '-filter:a:0',
      makeExpectedLoudnormFilter(),
      '-map',
      '0:1',
      '-c:2',
      'ac3',
      '-ac:a:1',
      '2',
      '-ar:a:1',
      '48000',
      '-filter:a:1',
      makeExpectedLoudnormFilter(),
    ]);
  });

  it('can derive replacement audio from a stream removed from the output', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDtsAudioStream(),
    ];
    const removeDts = createOperation('ffmpegCommandRemoveStreamByProperty', 'removeStreamByProperty', {
      codecType: 'audio',
      propertyToCheck: 'codec_name',
      valuesToRemove: 'dts',
      condition: 'equals',
    });
    const ensureAc3 = createEnsureAudioOperation();

    const removeThenEnsure = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        removeDts,
        ensureAc3,
      ],
    }));
    const ensureThenRemove = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        ensureAc3,
        removeDts,
      ],
    }));

    expect(removeThenEnsure.spawnArgs).toEqual(ensureThenRemove.spawnArgs);
    expect(removeThenEnsure.streams.map((stream) => stream.codec_name)).toEqual(['h264', 'ac3']);
    expect(removeThenEnsure.streams.map((stream) => stream.channels)).toEqual([undefined, 2]);
    expect(removeThenEnsure.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'ac3',
      '-ac:a:0',
      '2',
    ]);
  });

  it('does not duplicate an ensured derived audio stream', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDtsAudioStream(),
    ];
    const ensureAc3 = createEnsureAudioOperation();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        ensureAc3,
        ensureAc3,
      ],
    }));

    expect(renderResult.streams.map((stream) => stream.codec_name)).toEqual(['h264', 'dts', 'ac3']);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'copy',
      '-map',
      '0:1',
      '-c:2',
      'ac3',
      '-ac:a:1',
      '2',
    ]);
  });

  it('uses derived audio output metadata for later codec reordering', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDtsAudioStream(),
    ];

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        createEnsureAudioOperation(),
        createOperation('ffmpegCommandRorderStreams', 'reorderStreams', {
          processOrder: 'codecs',
          languages: '',
          channels: '',
          codecs: 'ac3,dts,h264',
          streamTypes: '',
        }),
      ],
    }));

    expect(renderResult.streams.map((stream) => stream.codec_name)).toEqual(['ac3', 'dts', 'h264']);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:1',
      '-c:0',
      'ac3',
      '-ac:a:0',
      '2',
      '-map',
      '0:1',
      '-c:1',
      'copy',
      '-map',
      '0:0',
      '-c:2',
      'copy',
    ]);
  });

  it('uses Set Audio Encoder when an existing Ensure Audio match is normalized', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      {
        ...createDefaultV2Streams()[1],
        codec_name: 'ac3',
        channels: 2,
      },
    ];
    const args = createV2Args({
      streams,
      operations: [
        createEnsureAudioOperation(),
        createAudioEncoderOperation(),
        createNormalizeAudioOperation(),
      ],
    });
    mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
      '-c:0',
      'copy',
      '-map',
      '0:1',
      '-c:1',
      'aac',
      '-filter:a:0',
      makeExpectedLoudnormFilter(),
    ]);
  });

  it('executes rendered args through CLI and closes v2 state after success', async () => {
    const args = createV2Args({
      operations: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          operationType: 'customArguments',
          inputs: {
            inputArguments: '',
            outputArguments: '-movflags +faststart',
          },
        },
      ],
    });

    const result = await plugin(args);

    expect(result.outputNumber).toBe(1);
    expect(result.outputFileObj._id).toContain('.mp4');
    expect(args.variables.ffmpegCommandV2?.init).toBe(false);
    expect(args.logOutcome).toHaveBeenCalledWith('tSuc');
  });
});
