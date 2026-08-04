import {
  createAudioEncoderOperation,
  createConflictMessage,
  createDefaultV2Streams,
  createHdrToSdrOperation,
  createHdrVideoStream,
  createImplicitEncoderMessage,
  createOperation,
  createResolutionOperation,
  createSoftwareEncoderOperation,
  createV2Args,
  setupFfmpegCommandExecuteMocks,
  singletonConflictCases,
} from './testFixtures';
import { plugin, renderFfmpegCommandV2 } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandExecute/2.0.0/index';

describe('ffmpegCommandExecute v2 Plugin', () => {
  const mocks = setupFfmpegCommandExecuteMocks();

  it('allows duplicate singleton operations when their inputs are identical', async () => {
    const resolutionOperation = createResolutionOperation();
    mocks.mockSoftwareEncoder();

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
  ])('rejects %s without an explicit video encoder', async (_name, operations) => {
    const args = createV2Args({
      operations,
    });
    const message = createImplicitEncoderMessage('video', 0);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(args.jobLog).toHaveBeenCalledWith(message);
  });

  it('rejects HDR to SDR without an explicit video encoder when a stream is HDR-tagged', async () => {
    const args = createV2Args({
      streams: [
        createHdrVideoStream(),
        createDefaultV2Streams()[1],
      ],
      operations: [
        createHdrToSdrOperation(),
      ],
    });
    const message = createImplicitEncoderMessage('video', 0);

    await expect(renderFfmpegCommandV2(args)).rejects.toThrow(message);
    expect(args.jobLog).toHaveBeenCalledWith(message);
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
