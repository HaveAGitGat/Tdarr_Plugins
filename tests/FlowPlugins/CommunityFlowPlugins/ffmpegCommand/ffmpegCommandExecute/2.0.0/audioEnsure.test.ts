import {
  createAudioEncoderOperation,
  createDefaultV2Streams,
  createDtsAudioStream,
  createEnsureAudioOperation,
  createImplicitEncoderMessage,
  createNormalizeAudioOperation,
  createOperation,
  createRemoveDtsAudioOperation,
  createV2Args,
  makeExpectedLoudnormFilter,
  makeLoudnormOutput,
  makeSpawnOutput,
  renderFfmpegCommandV2,
  setupFfmpegCommandExecuteMocks,
} from './testFixtures';

describe('ffmpegCommandExecute v2 ensure audio', () => {
  const mocks = setupFfmpegCommandExecuteMocks();

  it('still rejects normalize audio when another active audio stream lacks an encoder', async () => {
    const args = createV2Args({
      operations: [
        createEnsureAudioOperation(),
        createNormalizeAudioOperation(),
      ],
    });
    const message = createImplicitEncoderMessage('audio', 1);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(mocks.mockSpawnSync).not.toHaveBeenCalled();
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('can derive replacement audio from a stream removed from the output', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDtsAudioStream(),
    ];
    const removeDts = createRemoveDtsAudioOperation();
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

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
});
