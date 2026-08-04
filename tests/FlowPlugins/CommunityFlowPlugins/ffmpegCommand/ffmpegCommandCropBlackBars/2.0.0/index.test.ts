import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandCropBlackBars/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandCropBlackBars v2 Plugin', () => {
  it('appends a cropBlackBars operation with detection inputs', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'cropBlackBars', 'ffmpegCommandCropBlackBars', {
      cropMode: 'mostCommon',
      cropThreshold: '24',
      sampleCount: '5',
      framesPerSample: '30',
      minCropPercent: '2',
    });
  });

  it('passes custom detection inputs to the operation', () => {
    const args = createV2Args({
      inputs: {
        cropMode: 'minimum',
        cropThreshold: '16',
        sampleCount: '3',
        framesPerSample: '60',
        minCropPercent: '0',
      },
    });

    plugin(args);

    expectV2Operation(args, 'cropBlackBars', 'ffmpegCommandCropBlackBars', {
      cropMode: 'minimum',
      cropThreshold: '16',
      sampleCount: '3',
      framesPerSample: '60',
      minCropPercent: '0',
    });
  });
});
