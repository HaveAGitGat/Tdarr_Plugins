import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRemoveStreamByProperty/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandRemoveStreamByProperty v2 Plugin', () => {
  it('appends a removeStreamByProperty request only', () => {
    const args = createV2Args({
      inputs: {
        codecType: 'audio',
        propertyToCheck: 'tags.language',
        valuesToRemove: 'eng,fre',
        condition: 'includes',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Request(args, 'removeStreamByProperty', 'ffmpegCommandRemoveStreamByProperty', {
      codecType: 'audio',
      propertyToCheck: 'tags.language',
      valuesToRemove: 'eng,fre',
      condition: 'includes',
    });
  });
});
