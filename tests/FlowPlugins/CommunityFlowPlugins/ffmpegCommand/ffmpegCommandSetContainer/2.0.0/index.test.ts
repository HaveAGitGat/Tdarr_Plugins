import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetContainer/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandSetContainer v2 Plugin', () => {
  it('appends a setContainer request only', () => {
    const args = createV2Args({ inputs: { container: 'mkv', forceConform: true } });
    const streamsBefore = JSON.stringify(args.variables.ffmpegCommandV2?.streams);

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expect(JSON.stringify(args.variables.ffmpegCommandV2?.streams)).toBe(streamsBefore);
    expectV2Request(args, 'setContainer', 'ffmpegCommandSetContainer', {
      container: 'mkv',
      forceConform: true,
    });
  });
});
