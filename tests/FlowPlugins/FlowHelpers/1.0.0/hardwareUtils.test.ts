import { getEncoder } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils';
import { IpluginInputArgs } from '../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const args = {
  workerType: 'transcodegpu',
  jobLog: jest.fn(),
} as unknown as IpluginInputArgs;

const getInputArgs = async (targetCodec: string, hardwareType: string): Promise<string[]> => (
  (await getEncoder({
    targetCodec,
    hardwareEncoding: true,
    hardwareType,
    args,
  })).inputArgs
);

describe('getEncoder', () => {
  it.each(['hevc', 'h264', 'av1'])('should use CUDA hardware decode for %s nvenc', async (targetCodec) => {
    expect(await getInputArgs(targetCodec, 'nvenc')).toEqual(['-hwaccel', 'cuda']);
  });

  // -hwaccel qsv fails on sources the GPU cannot decode and on software filters,
  // so av1_qsv keeps software decoding
  it('should not use QSV hardware decode for av1 qsv', async () => {
    expect(await getInputArgs('av1', 'qsv')).toEqual([]);
  });
});
