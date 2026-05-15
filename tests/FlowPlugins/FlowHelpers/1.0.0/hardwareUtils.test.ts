import { EventEmitter } from 'events';

import { hasEncoder } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils';
import { IpluginInputArgs } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const mockSpawn = jest.fn();

jest.mock('child_process', () => ({
  spawn: mockSpawn,
}));

const makeSuccessfulProcess = () => {
  const process = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter,
    stderr: EventEmitter,
  };

  process.stdout = new EventEmitter();
  process.stderr = new EventEmitter();

  setImmediate(() => {
    process.emit('close', 0);
  });

  return process;
};

describe('hardwareUtils', () => {
  const baseArgs = {
    jobLog: jest.fn(),
  } as Partial<IpluginInputArgs> as IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpawn.mockImplementation(() => makeSuccessfulProcess());
  });

  it('should use the normal 8-bit lavfi probe by default', async () => {
    await hasEncoder({
      ffmpegPath: 'ffmpeg',
      encoder: 'hevc_nvenc',
      inputArgs: ['-hwaccel', 'cuda'],
      outputArgs: [],
      filter: '',
      args: baseArgs,
    });

    const commandArgs = mockSpawn.mock.calls[0][1] as string[];

    expect(commandArgs).toContain('color=c=black:s=512x512:d=1:r=30');
    expect(commandArgs).not.toContain('color=c=black:s=512x512:d=1:r=30,format=yuv420p10le');
    expect(commandArgs).not.toContain('main10');
    expect(commandArgs).not.toContain('p010le');
  });

  it('should add 10-bit HEVC encoder arguments when requested', async () => {
    await hasEncoder({
      ffmpegPath: 'ffmpeg',
      encoder: 'hevc_nvenc',
      inputArgs: ['-hwaccel', 'cuda'],
      outputArgs: [],
      filter: '',
      args: baseArgs,
      probeBitDepth: '10bit',
    });

    const commandArgs = mockSpawn.mock.calls[0][1] as string[];

    expect(commandArgs).toContain('color=c=black:s=512x512:d=1:r=30,format=yuv420p10le');
    expect(commandArgs).toContain('-profile:v');
    expect(commandArgs).toContain('main10');
    expect(commandArgs).toContain('-pix_fmt');
    expect(commandArgs).toContain('p010le');
  });

  it('should use a 10-bit VAAPI upload filter for VAAPI probes', async () => {
    await hasEncoder({
      ffmpegPath: 'ffmpeg',
      encoder: 'hevc_vaapi',
      inputArgs: [
        '-hwaccel',
        'vaapi',
        '-hwaccel_device',
        '/dev/dri/renderD128',
        '-hwaccel_output_format',
        'vaapi',
      ],
      outputArgs: [],
      filter: '-vf format=nv12,hwupload',
      args: baseArgs,
      probeBitDepth: '10bit',
    });

    const commandArgs = mockSpawn.mock.calls[0][1] as string[];

    expect(commandArgs).toContain('-vf');
    expect(commandArgs).toContain('format=p010,hwupload');
    expect(commandArgs).not.toContain('format=nv12,hwupload');
    expect(commandArgs).not.toContain('-pix_fmt');
  });

  it('should not add an HEVC Main10 profile to AV1 10-bit probes', async () => {
    await hasEncoder({
      ffmpegPath: 'ffmpeg',
      encoder: 'av1_qsv',
      inputArgs: [],
      outputArgs: [],
      filter: '',
      args: baseArgs,
      probeBitDepth: '10bit',
    });

    const commandArgs = mockSpawn.mock.calls[0][1] as string[];

    expect(commandArgs).not.toContain('main10');
    expect(commandArgs).toContain('-pix_fmt');
    expect(commandArgs).toContain('p010le');
  });
});
