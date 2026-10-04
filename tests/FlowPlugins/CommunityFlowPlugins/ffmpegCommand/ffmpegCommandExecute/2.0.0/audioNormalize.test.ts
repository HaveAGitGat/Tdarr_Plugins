import {
  createAudioEncoderOperation,
  createDefaultV2Streams,
  createDtsAudioStream,
  createEnsureAudioOperation,
  createImplicitEncoderMessage,
  createNormalizeAudioOperation,
  createRemoveDtsAudioOperation,
  createV2Args,
  makeExpectedLoudnormFilter,
  makeLoudnormOutput,
  makeSpawnOutput,
  renderFfmpegCommandV2,
  setupFfmpegCommandExecuteMocks,
} from './testFixtures';

describe('ffmpegCommandExecute v2 normalize audio', () => {
  const mocks = setupFfmpegCommandExecuteMocks();

  it('throws when normalize audio has no explicit audio encoder', async () => {
    const args = createV2Args({
      operations: [
        createNormalizeAudioOperation(),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));
    const message = createImplicitEncoderMessage('audio', 1);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(mocks.mockSpawnSync).not.toHaveBeenCalled();
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));
    const message = createImplicitEncoderMessage('audio', 1);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(mocks.mockSpawnSync).not.toHaveBeenCalled();
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(mocks.mockSpawnSync).toHaveBeenCalledWith('/usr/bin/ffmpeg', [
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput(values)));

    const renderResult = await renderFfmpegCommandV2(args);
    const loudnormFirstPassArgs = mocks.mockSpawnSync.mock.calls[0][1] as string[];

    expect(loudnormFirstPassArgs).toContain('loudnorm=I=-16.0:LRA=11.0:TP=-1.5:print_format=json');
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-c:1',
      'libopus',
      '-filter:a:0',
      makeExpectedLoudnormFilter(values, inputs),
    ]));
  });

  it('clamps out-of-range loudnorm values before rendering the second pass', async () => {
    const values = {
      input_i: '14.35',
      input_tp: '123.45',
      input_lra: '-2.00',
      input_thresh: '4.35',
      target_offset: '-123.45',
    };
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
        createNormalizeAudioOperation(),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput(values)));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(renderResult.shouldProcess).toBe(true);
    expect(renderResult.spawnArgs).toEqual(expect.arrayContaining([
      '-filter:a:0',
      makeExpectedLoudnormFilter({
        ...values,
        input_i: '0',
        input_tp: '99',
        input_lra: '0',
        input_thresh: '0',
        target_offset: '-99',
      }),
    ]));
    expect(args.jobLog).toHaveBeenCalledWith(
      'Adjusted loudnorm values for stream 1 to FFmpeg second-pass ranges: '
      + 'input_i 14.35 -> 0, input_tp 123.45 -> 99, input_lra -2.00 -> 0, '
      + 'input_thresh 4.35 -> 0, target_offset -123.45 -> -99.',
    );
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput({
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

  it('skips normalize audio when loudnorm returns non-finite values', async () => {
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
        createNormalizeAudioOperation(),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput({
      input_i: '-inf',
      input_tp: '-inf',
      input_thresh: '-inf',
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
      'Skipping normalization for stream 1: loudnorm returned non-finite input_i value -inf.',
    );
  });

  it('skips normalize audio when a non-input_i second-pass value is non-finite', async () => {
    const args = createV2Args({
      operations: [
        createAudioEncoderOperation({
          forceEncoding: false,
        }),
        createNormalizeAudioOperation(),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput({
      input_i: '-20.00',
      input_tp: '-inf',
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
      'Skipping normalization for stream 1: loudnorm returned non-finite input_tp value -inf.',
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

    expect(mocks.mockSpawnSync).not.toHaveBeenCalled();
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput('FFmpeg error occurred', 1));

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
    mocks.mockSpawnSync
      .mockReturnValueOnce(makeSpawnOutput(makeLoudnormOutput(firstValues)))
      .mockReturnValueOnce(makeSpawnOutput(makeLoudnormOutput(secondValues)));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(mocks.mockSpawnSync).toHaveBeenCalledTimes(2);
    expect(mocks.mockSpawnSync.mock.calls[0][1]).toEqual(expect.arrayContaining(['-map', '0:1']));
    expect(mocks.mockSpawnSync.mock.calls[1][1]).toEqual(expect.arrayContaining(['-map', '0:2']));
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
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(mocks.mockSpawnSync).toHaveBeenCalledTimes(1);
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

  it('normalizes a replacement audio stream that already has an explicit encoder', async () => {
    const streams = [
      createDefaultV2Streams()[0],
      createDtsAudioStream(),
    ];
    const args = createV2Args({
      streams,
      operations: [
        createRemoveDtsAudioOperation(),
        createEnsureAudioOperation(),
        createNormalizeAudioOperation(),
      ],
    });
    mocks.mockSpawnSync.mockReturnValue(makeSpawnOutput(makeLoudnormOutput()));

    const renderResult = await renderFfmpegCommandV2(args);

    expect(mocks.mockSpawnSync).toHaveBeenCalledTimes(1);
    expect(mocks.mockSpawnSync.mock.calls[0][1]).toEqual(expect.arrayContaining(['-map', '0:1']));
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
      'ac3',
      '-ac:a:0',
      '2',
      '-filter:a:0',
      makeExpectedLoudnormFilter(),
    ]);
  });
});
