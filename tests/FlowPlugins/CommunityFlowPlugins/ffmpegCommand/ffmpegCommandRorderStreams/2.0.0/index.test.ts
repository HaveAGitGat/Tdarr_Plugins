import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRorderStreams/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandRorderStreams v2 Plugin', () => {
  it('appends a reorderStreams operation only', () => {
    const args = createV2Args({
      inputs: {
        processOrder: 'streamTypes,languages',
        languages: 'eng,fre',
        channels: '5.1,2',
        codecs: 'ac3,aac',
        streamTypes: 'audio,video',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'reorderStreams', 'ffmpegCommandRorderStreams', {
      processOrder: 'streamTypes,languages',
      languages: 'eng,fre',
      channels: '5.1,2',
      codecs: 'ac3,aac',
      streamTypes: 'audio,video',
    });
  });
});
