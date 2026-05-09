import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandCropBlackBars/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandCropBlackBars v2 Plugin', () => {
  it('appends a cropBlackBars operation only', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'cropBlackBars', 'ffmpegCommandCropBlackBars', {});
  });
});
