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
  it.each(['hevc', 'h264', 'av1'])('should use hardware decode input args for %s', async (targetCodec) => {
    expect(await getInputArgs(targetCodec, 'nvenc')).toEqual(['-hwaccel', 'cuda']);
    expect(await getInputArgs(targetCodec, 'qsv')).toEqual(['-hwaccel', 'qsv', '-hwaccel_output_format', 'qsv']);
  });
});
