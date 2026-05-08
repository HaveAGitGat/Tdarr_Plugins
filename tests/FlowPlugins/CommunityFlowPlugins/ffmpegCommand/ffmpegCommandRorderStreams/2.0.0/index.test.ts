import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandRorderStreams/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandRorderStreams v2 Plugin', () => {
  it('appends a reorderStreams request only', () => {
    const args = createV2Args({
      inputs: {
        processOrder: 'streamTypes,languages',
        languages: 'eng,fre',
        channels: '5.1,2',
        codecs: 'ac3,aac',
        streamTypes: 'audio,video',
      },
    });
    const streamsBefore = JSON.stringify(args.variables.ffmpegCommandV2?.streams);

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expect(JSON.stringify(args.variables.ffmpegCommandV2?.streams)).toBe(streamsBefore);
    expectV2Request(args, 'reorderStreams', 'ffmpegCommandRorderStreams', {
      processOrder: 'streamTypes,languages',
      languages: 'eng,fre',
      channels: '5.1,2',
      codecs: 'ac3,aac',
      streamTypes: 'audio,video',
    });
  });
});
