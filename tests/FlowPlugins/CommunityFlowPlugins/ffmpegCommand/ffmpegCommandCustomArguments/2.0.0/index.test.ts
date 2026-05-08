import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandCustomArguments/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandCustomArguments v2 Plugin', () => {
  it('appends a customArguments request only', () => {
    const args = createV2Args({
      inputs: {
        inputArguments: '-threads 2',
        outputArguments: '-movflags +faststart',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Request(args, 'customArguments', 'ffmpegCommandCustomArguments', {
      inputArguments: '-threads 2',
      outputArguments: '-movflags +faststart',
    });
  });
});
