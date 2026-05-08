import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommand10BitVideo/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommand10BitVideo v2 Plugin', () => {
  it('appends a set10BitVideo request only', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Request(args, 'set10BitVideo', 'ffmpegCommand10BitVideo', {});
  });
});
