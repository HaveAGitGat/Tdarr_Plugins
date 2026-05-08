import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVdeoResolution/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandSetVdeoResolution v2 Plugin', () => {
  it('appends a setVideoResolution request only', () => {
    const args = createV2Args({ inputs: { targetResolution: '4KUHD' } });
    const streamsBefore = JSON.stringify(args.variables.ffmpegCommandV2?.streams);

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expect(JSON.stringify(args.variables.ffmpegCommandV2?.streams)).toBe(streamsBefore);
    expectV2Request(args, 'setVideoResolution', 'ffmpegCommandSetVdeoResolution', {
      targetResolution: '4KUHD',
    });
  });

  it('throws when v2 Begin Command has not run', () => {
    const args = createV2Args();
    delete args.variables.ffmpegCommandV2;

    expect(() => plugin(args)).toThrow('FFmpeg command v2 plugins not used correctly');
  });
});
