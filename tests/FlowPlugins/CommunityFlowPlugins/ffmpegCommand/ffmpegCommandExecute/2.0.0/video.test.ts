import {
  createCropBlackBarsOperation,
  createDefaultV2Streams,
  createEncoderOperation,
  createOperation,
  createResolutionOperation,
  createSoftwareEncoderOperation,
  createV2Args,
  makeCropdetectOutput,
  makeSpawnOutput,
  renderFfmpegCommandV2,
  setupFfmpegCommandExecuteMocks,
} from './testFixtures';
import type { IffmpegCommandV2Operation } from './testFixtures';

describe('ffmpegCommandExecute v2 video rendering', () => {
  const mocks = setupFfmpegCommandExecuteMocks();

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
    mocks.mockVaapiEncoder();

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
    mocks.mockVaapiEncoder();

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
    mocks.mockVaapiEncoder();
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

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
    mocks.mockVaapiEncoder();
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));
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
    mocks.mockGetEncoder.mockResolvedValue({
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
    mocks.mockSoftwareEncoder();

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
    mocks.mockSoftwareEncoder();

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

    mocks.mockSoftwareEncoder();

    const renderResult = await renderFfmpegCommandV2(createV2Args({
      streams,
      operations: [
        createResolutionOperation(),
        createSoftwareEncoderOperation(),
      ],
    }));

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
        createOperation('ffmpegCommandRemoveStreamByProperty', 'removeStreamByProperty', {
          codecType: 'video',
          propertyToCheck: 'codec_name',
          valuesToRemove: 'h264',
          condition: 'equals',
        }),
        createEncoderOperation(),
      ],
    }));

    expect(mocks.mockGetEncoder).not.toHaveBeenCalled();
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
});
