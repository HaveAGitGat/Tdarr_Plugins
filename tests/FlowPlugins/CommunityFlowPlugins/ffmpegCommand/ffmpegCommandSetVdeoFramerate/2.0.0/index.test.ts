import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVdeoFramerate/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandSetVdeoFramerate v2 Plugin', () => {
  it('appends a setVideoFramerate operation only', () => {
    const args = createV2Args({ inputs: { framerate: '24' } });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'setVideoFramerate', 'ffmpegCommandSetVdeoFramerate', {
      framerate: 24,
    });
  });
});
