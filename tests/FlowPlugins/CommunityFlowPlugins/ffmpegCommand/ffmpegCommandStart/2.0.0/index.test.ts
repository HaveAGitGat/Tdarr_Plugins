import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandStart/2.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommandStart v2 Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ffmpegCommand: { init: true, container: 'v1' } as any,
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  it('initializes isolated v2 state without mutating v1 ffmpegCommand', () => {
    const v1State = baseArgs.variables.ffmpegCommand;

    const result = plugin(baseArgs);

    expect(details().requiresVersion).toBe('2.73.01');
    expect(result.outputNumber).toBe(1);
    expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    expect(result.variables.ffmpegCommand).toBe(v1State);
    expect(result.variables.ffmpegCommandV2).toMatchObject({
      version: 2,
      init: true,
      sourceFileId: baseArgs.inputFileObj._id,
      requests: [],
    });
    expect(result.variables.ffmpegCommandV2).not.toHaveProperty('streams');
    expect(result.variables.ffmpegCommandV2).not.toHaveProperty('container');
  });

  it('resets any previous v2 request context', () => {
    baseArgs.variables.ffmpegCommandV2 = {
      version: 2,
      init: true,
      sourceFileId: '/tmp/old.mp4',
      requests: [
        {
          pluginName: 'ffmpegCommandCustomArguments',
          pluginVersion: '2.0.0',
          requestType: 'customArguments',
          inputs: {
            outputArguments: '-movflags +faststart',
          },
        },
      ],
    };

    const result = plugin(baseArgs);

    expect(result.variables.ffmpegCommandV2).toEqual({
      version: 2,
      init: true,
      sourceFileId: baseArgs.inputFileObj._id,
      requests: [],
    });
  });

  it('does not inspect FFprobe streams', () => {
    delete baseArgs.inputFileObj.ffProbeData.streams;

    expect(() => plugin(baseArgs)).not.toThrow();
    expect(baseArgs.variables.ffmpegCommandV2?.requests).toEqual([]);
  });
});
