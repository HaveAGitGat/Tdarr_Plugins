import { getEncoder } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils';
import { IpluginInputArgs } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

describe('hardwareUtils QSV encoder selection', () => {
  const baseArgs = {
    workerType: 'transcodegpu',
    ffmpegPath: 'ffmpeg',
    jobLog: jest.fn(),
  } as Partial<IpluginInputArgs> as IpluginInputArgs;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return full QSV decode args for explicit HEVC QSV selection', async () => {
    const result = await getEncoder({
      targetCodec: 'hevc',
      hardwareEncoding: true,
      hardwareType: 'qsv',
      args: baseArgs,
    });

    expect(result.encoder).toBe('hevc_qsv');
    expect(result.isGpu).toBe(true);
    expect(result.inputArgs).toEqual([
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
    ]);
  });

  it('should return full QSV decode args for explicit H264 QSV selection', async () => {
    const result = await getEncoder({
      targetCodec: 'h264',
      hardwareEncoding: true,
      hardwareType: 'qsv',
      args: baseArgs,
    });

    expect(result.encoder).toBe('h264_qsv');
    expect(result.isGpu).toBe(true);
    expect(result.inputArgs).toEqual([
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
    ]);
  });

  it('should return QSV AV1 without extra output args', async () => {
    const result = await getEncoder({
      targetCodec: 'av1',
      hardwareEncoding: true,
      hardwareType: 'qsv',
      args: baseArgs,
    });

    expect(result.encoder).toBe('av1_qsv');
    expect(result.isGpu).toBe(true);
    expect(result.inputArgs).toEqual([
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
    ]);
    expect(result.outputArgs).toEqual([]);
  });
});
