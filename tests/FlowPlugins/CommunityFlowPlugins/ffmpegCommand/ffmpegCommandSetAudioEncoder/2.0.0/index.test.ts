import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetAudioEncoder/2.0.0/index';
import { createV2Args, expectV2Operation } from '../../v2TestUtils';

describe('ffmpegCommandSetAudioEncoder v2 Plugin', () => {
  it('is tagged as an audio plugin', () => {
    expect(details().tags).toBe('audio');
  });

  it('appends a setAudioEncoder operation with default inputs', () => {
    const args = createV2Args();

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'setAudioEncoder', 'ffmpegCommandSetAudioEncoder', {
      audioEncoder: 'aac',
      forceEncoding: true,
      enableBitrate: false,
      bitrate: '192k',
      enableSamplerate: false,
      samplerate: '48000',
    });
  });

  it('appends a setAudioEncoder operation with custom inputs', () => {
    const args = createV2Args({
      inputs: {
        audioEncoder: 'libopus',
        forceEncoding: false,
        enableBitrate: true,
        bitrate: '128k',
        enableSamplerate: true,
        samplerate: '48000',
      },
    });

    const result = plugin(args);

    expect(result.outputFileObj).toBe(args.inputFileObj);
    expectV2Operation(args, 'setAudioEncoder', 'ffmpegCommandSetAudioEncoder', {
      audioEncoder: 'libopus',
      forceEncoding: false,
      enableBitrate: true,
      bitrate: '128k',
      enableSamplerate: true,
      samplerate: '48000',
    });
  });
});
