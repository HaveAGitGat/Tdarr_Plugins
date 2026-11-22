import { getEncoder } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils';
import { IpluginInputArgs } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const makeArgs = (workerType: string): IpluginInputArgs => ({
  workerType,
  ffmpegPath: 'ffmpeg',
  jobLog: jest.fn(),
} as Partial<IpluginInputArgs> as IpluginInputArgs);

describe('hardwareUtils getEncoder', () => {
  describe('hardware decode input args for a specific hardware type', () => {
    it.each([
      ['hevc', 'nvenc', 'hevc_nvenc', ['-hwaccel', 'cuda']],
      ['h264', 'nvenc', 'h264_nvenc', ['-hwaccel', 'cuda']],
      ['av1', 'nvenc', 'av1_nvenc', ['-hwaccel', 'cuda']],
      ['hevc', 'qsv', 'hevc_qsv', ['-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv']],
      ['h264', 'qsv', 'h264_qsv', ['-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv']],
      ['av1', 'qsv', 'av1_qsv', ['-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv']],
    ])('%s with %s uses %s and %j', async (targetCodec, hardwareType, encoder, inputArgs) => {
      const res = await getEncoder({
        targetCodec,
        hardwareEncoding: true,
        hardwareType,
        args: makeArgs('transcodegpu'),
      });

      expect(res.encoder).toBe(encoder);
      expect(res.isGpu).toBe(true);
      expect(res.inputArgs).toEqual(inputArgs);
    });

    it('should not add hardware decode args for av1_amf', async () => {
      const res = await getEncoder({
        targetCodec: 'av1',
        hardwareEncoding: true,
        hardwareType: 'amf',
        args: makeArgs('transcodegpu'),
      });

      expect(res.encoder).toBe('av1_amf');
      expect(res.inputArgs).toEqual([]);
    });
  });

  describe('CPU fallback', () => {
    it('should use libsvtav1 with no input args on a CPU worker', async () => {
      const res = await getEncoder({
        targetCodec: 'av1',
        hardwareEncoding: true,
        hardwareType: 'qsv',
        args: makeArgs('transcodecpu'),
      });

      expect(res.encoder).toBe('libsvtav1');
      expect(res.isGpu).toBe(false);
      expect(res.inputArgs).toEqual([]);
    });
  });
});
