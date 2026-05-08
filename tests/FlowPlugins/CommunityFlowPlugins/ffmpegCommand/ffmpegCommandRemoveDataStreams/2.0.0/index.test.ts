import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveDataStreams/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandRemoveDataStreams v2 Plugin', () => {
  it('appends a removeDataStreams request only', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Request(args, 'removeDataStreams', 'ffmpegCommandRemoveDataStreams', {});
  });
});
