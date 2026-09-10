import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVideoEncoder/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandSetVideoEncoder v2 Plugin', () => {
  it('appends a setVideoEncoder operation without mutating streams', () => {
    const args = createV2Args({
      inputs: {
        outputCodec: 'h264',
        ffmpegPresetEnabled: true,
        ffmpegPreset: 'slow',
        ffmpegQualityEnabled: true,
        ffmpegQuality: 22,
        hardwareEncoding: true,
        hardwareType: 'qsv',
        hardwareDecoding: false,
        forceEncoding: true,
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'setVideoEncoder', 'ffmpegCommandSetVideoEncoder', {
      outputCodec: 'h264',
      ffmpegPresetEnabled: true,
      ffmpegPreset: 'slow',
      ffmpegQualityEnabled: true,
      ffmpegQuality: '22',
      hardwareEncoding: true,
      hardwareType: 'qsv',
      hardwareDecoding: false,
      forceEncoding: true,
    });
  });

  it('throws when v2 Begin Command has not run', () => {
    const args = createV2Args();
    delete args.variables.ffmpegCommandV2;

    expect(() => plugin(args)).toThrow('FFmpeg command v2 plugins not used correctly');
  });
});
