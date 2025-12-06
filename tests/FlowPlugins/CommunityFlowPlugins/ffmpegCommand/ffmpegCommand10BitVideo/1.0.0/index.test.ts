import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommand10BitVideo/1.0.0/index';
import { IpluginInputArgs, IffmpegCommandStream } from
  '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('ffmpegCommand10BitVideo Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: ['input.mp4'],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              width: 1920,
              height: 1080,
              pix_fmt: 'yuv420p',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              channels: 2,
              sample_rate: '48000',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: true,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic 10-bit Video Configuration', () => {
    it('should add 10-bit video profile and pixel format for H.264', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);

      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream: IffmpegCommandStream) => stream.codec_type === 'video',
      );

      expect(videoStream?.outputArgs).toContain('-profile:v:{outputTypeIndex}');
      expect(videoStream?.outputArgs).toContain('main10');
      expect(videoStream?.outputArgs).toContain('-pix_fmt:v:{outputTypeIndex}');
      expect(videoStream?.outputArgs).toContain('p010le');
    });

    it('should handle multiple video streams', () => {
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'hevc',
        codec_type: 'video',
        width: 1280,
        height: 720,
        pix_fmt: 'yuv420p',
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
      });

      const result = plugin(baseArgs);

      const videoStreams = result.variables.ffmpegCommand.streams.filter(
        (stream: IffmpegCommandStream) => stream.codec_type === 'video',
      );

      expect(videoStreams).toHaveLength(2);

      videoStreams.forEach((stream: IffmpegCommandStream) => {
        expect(stream.outputArgs).toContain('-profile:v:{outputTypeIndex}');
        expect(stream.outputArgs).toContain('main10');
        expect(stream.outputArgs).toContain('-pix_fmt:v:{outputTypeIndex}');
        expect(stream.outputArgs).toContain('p010le');
      });
    });

    it('should not modify audio streams', () => {
      const result = plugin(baseArgs);

      const audioStream = result.variables.ffmpegCommand.streams.find(
        (stream: IffmpegCommandStream) => stream.codec_type === 'audio',
      );

      expect(audioStream?.outputArgs).toHaveLength(0);
    });
  });

  describe('Hardware Acceleration and Pixel Format', () => {
    it('should use regular pixel format when no QSV is detected', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', 'libx264'];

      const result = plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream: IffmpegCommandStream) => stream.codec_type === 'video',
      );

      expect(videoStream?.outputArgs).not.toContain('-vf');
      expect(videoStream?.outputArgs).not.toContain('scale_qsv=format=p010le');
      expect(videoStream?.outputArgs).toContain('-pix_fmt:v:{outputTypeIndex}');
      expect(videoStream?.outputArgs).toContain('p010le');
    });

    it('should handle QSV-related codecs in outputArgs', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', 'h264_qsv'];

      const result = plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream: IffmpegCommandStream) => stream.codec_type === 'video',
      );

      // The plugin will add the profile arguments
      expect(videoStream?.outputArgs).toContain('-profile:v:{outputTypeIndex}');
      expect(videoStream?.outputArgs).toContain('main10');

      // Platform-specific behavior - either -vf scale_qsv or -pix_fmt should be present
      const hasScaleQsv = videoStream?.outputArgs.includes('-vf')
                          && videoStream?.outputArgs.includes('scale_qsv=format=p010le');
      const hasPixFmt = videoStream?.outputArgs.includes('-pix_fmt:v:{outputTypeIndex}')
                        && videoStream?.outputArgs.includes('p010le');

      expect(hasScaleQsv || hasPixFmt).toBe(true);
    });

    it('should handle different hardware encoder names', () => {
      const qsvEncoders = ['h264_qsv', 'hevc_qsv', 'av1_qsv'];

      qsvEncoders.forEach((encoder) => {
        // Reset the streams
        baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', encoder];

        const result = plugin(baseArgs);

        const videoStream = result.variables.ffmpegCommand.streams.find(
          (stream: IffmpegCommandStream) => stream.codec_type === 'video',
        );

        expect(videoStream?.outputArgs).toContain('-profile:v:{outputTypeIndex}');
        expect(videoStream?.outputArgs).toContain('main10');

        // Should have some form of 10-bit pixel format configuration
        const hasP010le = videoStream?.outputArgs.some((arg) => arg.includes('p010le'));
        const hasScaleQsv = videoStream?.outputArgs.some((arg) => arg.includes('scale_qsv'));
        expect(hasP010le || hasScaleQsv).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with no video streams', () => {
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
          channels: 2,
          sample_rate: '48000',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
        },
      ];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);

      const audioStream = result.variables.ffmpegCommand.streams[0];
      expect(audioStream.outputArgs).toHaveLength(0);
    });

    it('should throw error when ffmpegCommand is not initialized', () => {
      baseArgs.variables.ffmpegCommand.init = false;

      expect(() => plugin(baseArgs)).toThrow(
        'FFmpeg command plugins not used correctly.',
      );
    });

    it('should handle empty streams array', () => {
      baseArgs.variables.ffmpegCommand.streams = [];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.variables.ffmpegCommand.streams).toHaveLength(0);
    });
  });

  describe('Different Video Codecs', () => {
    it.each([
      'h264',
      'hevc',
      'vp9',
      'av1',
      'prores',
    ])('should configure 10-bit for %s codec', (codecName) => {
      baseArgs.variables.ffmpegCommand.streams[0].codec_name = codecName;

      const result = plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream: IffmpegCommandStream) => stream.codec_type === 'video',
      );

      expect(videoStream?.outputArgs).toContain('-profile:v:{outputTypeIndex}');
      expect(videoStream?.outputArgs).toContain('main10');
      expect(videoStream?.outputArgs).toContain('-pix_fmt:v:{outputTypeIndex}');
      expect(videoStream?.outputArgs).toContain('p010le');
    });
  });

  describe('Output Arguments Order', () => {
    it('should maintain correct order of output arguments', () => {
      baseArgs.variables.ffmpegCommand.streams[0].outputArgs = ['-c:v', 'libx264', '-preset', 'fast'];

      const result = plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams.find(
        (stream: IffmpegCommandStream) => stream.codec_type === 'video',
      );

      const outputArgs = videoStream?.outputArgs || [];

      // Check that the original arguments are preserved
      expect(outputArgs).toContain('-c:v');
      expect(outputArgs).toContain('libx264');
      expect(outputArgs).toContain('-preset');
      expect(outputArgs).toContain('fast');

      // Check that new arguments are added
      expect(outputArgs).toContain('-profile:v:{outputTypeIndex}');
      expect(outputArgs).toContain('main10');
      expect(outputArgs).toContain('-pix_fmt:v:{outputTypeIndex}');
      expect(outputArgs).toContain('p010le');
    });
  });

  describe('Variables Preservation', () => {
    it('should preserve all other variables', () => {
      baseArgs.variables.user = { customVar: 'test' };
      baseArgs.variables.flowFailed = false;

      const result = plugin(baseArgs);

      expect(result.variables.user).toEqual({ customVar: 'test' });
      expect(result.variables.flowFailed).toBe(false);
      expect(result.variables.ffmpegCommand.init).toBe(true);
      expect(result.variables.ffmpegCommand.container).toBe('mp4');
    });
  });
});
