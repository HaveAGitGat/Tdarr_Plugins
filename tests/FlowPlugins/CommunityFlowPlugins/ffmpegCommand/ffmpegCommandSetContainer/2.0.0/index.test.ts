import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetContainer/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandSetContainer v2 Plugin', () => {
  it('appends a setContainer operation only', () => {
    const args = createV2Args({ inputs: { container: 'mkv', forceConform: true } });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'setContainer', 'ffmpegCommandSetContainer', {
      container: 'mkv',
      forceConform: true,
    });
  });
});
