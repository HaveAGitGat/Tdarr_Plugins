import {
  createCropBlackBarsOperation,
  createDefaultV2Streams,
  createImplicitEncoderMessage,
  createOperation,
  createResolutionOperation,
  createSoftwareEncoderOperation,
  createV2Args,
  makeCropdetectOutput,
  makeSpawnOutput,
  makeStdoutSpawnOutput,
  renderFfmpegCommandV2,
  setupFfmpegCommandExecuteMocks,
} from './testFixtures';

describe('ffmpegCommandExecute v2 crop black bars', () => {
  const mocks = setupFfmpegCommandExecuteMocks();

  it('throws when crop black bars detects a crop without Set Video Encoder', async () => {
    const args = createV2Args({
      operations: [
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const message = createImplicitEncoderMessage('video', 0);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('detects crop black bars and emits a scoped crop filter when Set Video Encoder is configured', async () => {
    mocks.mockSoftwareEncoder();

    const args = createV2Args({
      operations: [
        createCropBlackBarsOperation({
          sampleCount: '1',
        }),
        createSoftwareEncoderOperation(),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

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
    expect(mocks.mockSpawnSync).toHaveBeenCalledWith('/usr/bin/ffmpeg', expect.arrayContaining([
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
    mocks.mockSoftwareEncoder();
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

    const cropThenScale = await renderFfmpegCommandV2(createV2Args({
      operations: [cropOperation, resolutionOperation, encoderOperation],
    }));

    mocks.mockSpawnSync.mockClear();
    mocks.mockSoftwareEncoder();
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 600, 0, 60, 30)));

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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(1280, 720, 0, 0, 30)));

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
    mocks.mockSoftwareEncoder();
    mocks.mockSpawnSync.mockImplementation(() => {
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
    mocks.mockSoftwareEncoder();
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeCropdetectOutput(640, 300, 0, 30, 30)));

    const renderResult = await renderFfmpegCommandV2(args);
    const cropdetectArgs = mocks.mockSpawnSync.mock.calls[0][1] as string[];

    expect(cropdetectArgs).toEqual(expect.arrayContaining(['-map', '0:2']));
    expect(renderResult.streams.map((stream) => stream.sourceIndex)).toEqual([1, 2]);
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-map',
      '0:2',
      '-filter:v:0',
      'crop=640:300:0:30',
    ]));
  });
});
