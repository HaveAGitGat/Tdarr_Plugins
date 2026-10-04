import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVideoBitrate/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandSetVideoBitrate v2 Plugin', () => {
  it('appends a setVideoBitrate operation only', () => {
    const args = createV2Args({
      inputs: {
        useInputBitrate: true,
        targetBitratePercent: '60',
        fallbackBitrate: '2500',
        bitrate: '3000',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'setVideoBitrate', 'ffmpegCommandSetVideoBitrate', {
      useInputBitrate: true,
      targetBitratePercent: '60',
      fallbackBitrate: '2500',
      bitrate: '3000',
    });
  });
});
