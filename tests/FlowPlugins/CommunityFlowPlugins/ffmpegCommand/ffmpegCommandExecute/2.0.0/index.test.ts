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

const createConflictMessage = (operationType: string): string => (
  `Conflicting FFmpeg command v2 ${operationType} operations found.`
  + ` Use one ${operationType} operation.`
);

type SingletonConflictCase = [string, IffmpegCommandV2Operation, IffmpegCommandV2Operation];

const singletonConflictCases: SingletonConflictCase[] = [
  [
    'setVideoEncoder',
    createEncoderOperation({ outputCodec: 'hevc' }),
    createEncoderOperation({ outputCodec: 'h264' }),
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

  const mockVaapiEncoder = () => {
    mockGetEncoder.mockResolvedValue({
      encoder: 'hevc_vaapi',
      inputArgs: vaapiInputArgs,
      outputArgs: [],
      isGpu: true,
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

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [resolutionOperation, resolutionOperation],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
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

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      operations: [hdrOperation, createResolutionOperation()],
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
      ],
    });
    args.inputFileObj.video_resolution = '1080p';

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
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

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        createResolutionOperation(),
      ],
    }));

    expect(renderResult.spawnArgs).toEqual([
      '-y',
      '-i',
      '/tmp/source.mp4',
      '-map',
      '0:0',
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

  it('consumes currently no-op operations explicitly without processing', async () => {
    const args = createV2Args({
      operations: [
        {
          pluginName: 'ffmpegCommandCropBlackBars',
          pluginVersion: '2.0.0',
          operationType: 'cropBlackBars',
          inputs: {},
        },
        {
          pluginName: 'ffmpegCommandNormalizeAudio',
          pluginVersion: '2.0.0',
          operationType: 'normalizeAudio',
          inputs: {},
        },
      ],
    });

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(false);
    expect(args.jobLog).toHaveBeenCalledWith(
      'Crop Black Bars v2 operation has no render action yet; leaving streams unchanged.',
    );
    expect(args.jobLog).toHaveBeenCalledWith(
      'Normalize Audio v2 operation has no render action yet; leaving streams unchanged.',
    );
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
