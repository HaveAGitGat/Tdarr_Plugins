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
      container: 'mp4',
      requests: [],
    });
    expect(result.variables.ffmpegCommandV2?.streams[0]).toMatchObject({
      index: 0,
      sourceIndex: 0,
      codec_name: 'h264',
      codec_type: 'video',
      removed: false,
    });
  });

  it('treats attached picture video streams as attachments', () => {
    baseArgs.inputFileObj.ffProbeData.streams?.push({
      index: 2,
      codec_name: 'mjpeg',
      codec_type: 'video',
      disposition: {
        attached_pic: 1,
      },
    });

    const result = plugin(baseArgs);

    expect(result.variables.ffmpegCommandV2?.streams[2]).toMatchObject({
      index: 2,
      sourceIndex: 2,
      codec_type: 'attachment',
      removed: false,
    });
  });

  it('throws when FFprobe streams are not available', () => {
    delete baseArgs.inputFileObj.ffProbeData.streams;

    expect(() => plugin(baseArgs)).toThrow('Error parsing FFprobe streams');
  });
});
