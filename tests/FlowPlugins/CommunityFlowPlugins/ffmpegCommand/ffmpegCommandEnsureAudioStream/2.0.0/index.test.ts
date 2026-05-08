import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandEnsureAudioStream/2.0.0/index';
import { createV2Args, expectV2Request } from '../../v2TestUtils';

describe('ffmpegCommandEnsureAudioStream v2 Plugin', () => {
  it('appends an ensureAudioStream request only', () => {
    const args = createV2Args({
      inputs: {
        audioEncoder: 'ac3',
        language: 'EN',
        channels: '6',
        enableBitrate: true,
        bitrate: '384k',
        enableSamplerate: true,
        samplerate: '48k',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Request(args, 'ensureAudioStream', 'ffmpegCommandEnsureAudioStream', {
      audioEncoder: 'ac3',
      language: 'en',
      channels: 6,
      enableBitrate: true,
      bitrate: '384k',
      enableSamplerate: true,
      samplerate: '48k',
    });
  });
});
