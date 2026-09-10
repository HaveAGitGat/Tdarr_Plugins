import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveSubtitles/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandRemoveSubtitles v2 Plugin', () => {
  it('appends a removeSubtitles operation only', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'removeSubtitles', 'ffmpegCommandRemoveSubtitles', {});
  });
});
