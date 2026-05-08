import { plugin, renderFfmpegCommandV2 } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/2.0.0/index';
import { IffmpegCommandV2Request } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { createDefaultV2Streams, createV2Args } from '../../v2TestUtils';

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils', () => ({
  getEncoder: jest.fn(),
}));

const createEncoderRequest = (inputs: Record<string, unknown> = {}): IffmpegCommandV2Request => ({
  pluginName: 'ffmpegCommandSetVideoEncoder',
  pluginVersion: '2.0.0',
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

const createResolutionRequest = (targetResolution = '1080p'): IffmpegCommandV2Request => ({
  pluginName: 'ffmpegCommandSetVdeoResolution',
  pluginVersion: '2.0.0',
  requestType: 'setVideoResolution',
  inputs: {
    targetResolution,
  },
});

describe('ffmpegCommandExecute v2 Plugin', () => {
  let mockGetEncoder: jest.Mock;

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

  it('renders identical QSV args when encoder and resolution request order changes', async () => {
    const encoderRequest = createEncoderRequest();
    const resolutionRequest = createResolutionRequest();

    const encoderThenResolution = await renderFfmpegCommandV2(createV2Args({
      requests: [encoderRequest, resolutionRequest],
    }));
    const resolutionThenEncoder = await renderFfmpegCommandV2(createV2Args({
      requests: [resolutionRequest, encoderRequest],
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

  it('uses software scale for QSV encoding when hardware decoding is disabled', async () => {
    const renderResult = await renderFfmpegCommandV2(createV2Args({
      requests: [
        createEncoderRequest({
          hardwareDecoding: false,
        }),
        createResolutionRequest(),
      ],
    }));

    expect(renderResult.spawnArgs).not.toContain('-hwaccel');
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:v:0',
      'scale=1920:-2',
    ]));
    expect(renderResult.spawnArgs).not.toContain('vpp_qsv=w=1920:h=1080');
  });

  it('renders stable 10-bit args regardless of request order', async () => {
    mockGetEncoder.mockResolvedValue({
      encoder: 'libsvtav1',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    });
    const encoderRequest = createEncoderRequest({
      outputCodec: 'av1',
      hardwareEncoding: false,
      hardwareType: 'auto',
      hardwareDecoding: false,
    });
    const tenBitRequest: IffmpegCommandV2Request = {
      pluginName: 'ffmpegCommand10BitVideo',
      pluginVersion: '2.0.0',
      requestType: 'set10BitVideo',
      inputs: {},
    };

    const tenBitThenEncoder = await renderFfmpegCommandV2(createV2Args({
      requests: [tenBitRequest, encoderRequest],
    }));
    const encoderThenTenBit = await renderFfmpegCommandV2(createV2Args({
      requests: [encoderRequest, tenBitRequest],
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
    const hdrRequest: IffmpegCommandV2Request = {
      pluginName: 'ffmpegCommandHdrToSdr',
      pluginVersion: '2.0.0',
      requestType: 'hdrToSdr',
      inputs: {},
    };

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      requests: [hdrRequest, createResolutionRequest()],
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
      requests: [
        createEncoderRequest({
          hardwareDecoding: false,
        }),
        createResolutionRequest(),
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
      requests: [
        {
          pluginName: 'ffmpegCommandRemoveSubtitles',
          pluginVersion: '2.0.0',
          requestType: 'removeSubtitles',
          inputs: {},
        },
        {
          pluginName: 'ffmpegCommandRorderStreams',
          pluginVersion: '2.0.0',
          requestType: 'reorderStreams',
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
      requests: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          requestType: 'customArguments',
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
      requests: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          requestType: 'customArguments',
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

  it('consumes currently no-op requests explicitly without processing', async () => {
    const args = createV2Args({
      requests: [
        {
          pluginName: 'ffmpegCommandCropBlackBars',
          pluginVersion: '2.0.0',
          requestType: 'cropBlackBars',
          inputs: {},
        },
        {
          pluginName: 'ffmpegCommandNormalizeAudio',
          pluginVersion: '2.0.0',
          requestType: 'normalizeAudio',
          inputs: {},
        },
      ],
    });

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(false);
    expect(args.jobLog).toHaveBeenCalledWith(
      'Crop Black Bars v2 request has no render action yet; leaving streams unchanged.',
    );
    expect(args.jobLog).toHaveBeenCalledWith(
      'Normalize Audio v2 request has no render action yet; leaving streams unchanged.',
    );
  });

  it('executes rendered args through CLI and closes v2 state after success', async () => {
    const args = createV2Args({
      requests: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          requestType: 'customArguments',
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
