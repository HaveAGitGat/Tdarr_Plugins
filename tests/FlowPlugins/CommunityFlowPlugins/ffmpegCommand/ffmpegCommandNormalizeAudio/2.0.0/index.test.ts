import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandNormalizeAudio/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandNormalizeAudio v2 Plugin', () => {
  it('appends a normalizeAudio operation with default inputs', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'normalizeAudio', 'ffmpegCommandNormalizeAudio', {
      i: '-23.0',
      lra: '7.0',
      tp: '-2.0',
      maxGain: '15',
    });
  });

  it('appends a normalizeAudio operation with custom inputs', () => {
    const args = createV2Args({
      inputs: {
        i: '-16.0',
        lra: '11.0',
        tp: '-1.5',
        maxGain: '20',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'normalizeAudio', 'ffmpegCommandNormalizeAudio', {
      i: '-16.0',
      lra: '11.0',
      tp: '-1.5',
      maxGain: '20',
    });
  });
});
