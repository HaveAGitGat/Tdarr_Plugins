import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVideoBitrate/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandSetVideoBitrate v2 Plugin', () => {
  it('appends a setVideoBitrate request only', () => {
    const args = createV2Args({
      inputs: {
        useInputBitrate: true,
        targetBitratePercent: '60',
        fallbackBitrate: '2500',
        bitrate: '3000',
      },
    });
    const streamsBefore = JSON.stringify(args.variables.ffmpegCommandV2?.streams);

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expect(JSON.stringify(args.variables.ffmpegCommandV2?.streams)).toBe(streamsBefore);
    expectV2Request(args, 'setVideoBitrate', 'ffmpegCommandSetVideoBitrate', {
      useInputBitrate: true,
      targetBitratePercent: '60',
      fallbackBitrate: '2500',
      bitrate: '3000',
    });
  });
});
