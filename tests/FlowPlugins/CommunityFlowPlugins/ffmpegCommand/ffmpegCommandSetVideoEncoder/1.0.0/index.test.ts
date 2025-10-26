import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/ffmpegCommand/ffmpegCommandSetVideoEncoder/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the getEncoder function from hardwareUtils
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils', () => ({
  getEncoder: jest.fn(),
}));

describe('ffmpegCommandSetVideoEncoder Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockGetEncoder: jest.MockedFunction<
    typeof import('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils').getEncoder
  >;

  beforeEach(() => {
    // Reset the mock
    const { getEncoder } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils');
    mockGetEncoder = getEncoder as jest.MockedFunction<
      typeof import('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils').getEncoder
    >;
    mockGetEncoder.mockResolvedValue({
      encoder: 'libx265',
      inputArgs: [],
      outputArgs: [],
      isGpu: false,
      enabledDevices: [],
    });

    baseArgs = {
      inputs: {
        outputCodec: 'hevc',
        ffmpegPresetEnabled: true,
        ffmpegPreset: 'fast',
        ffmpegQualityEnabled: true,
        ffmpegQuality: '25',
        hardwareEncoding: true,
        hardwareType: 'auto',
        hardwareDecoding: true,
        forceEncoding: true,
      },
      variables: {
        ffmpegCommand: {
          init: true,
          inputFiles: [],
          streams: [
            {
              index: 0,
              codec_name: 'h264',
              codec_type: 'video',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:0'],
            },
            {
              index: 1,
              codec_name: 'aac',
              codec_type: 'audio',
              removed: false,
              forceEncoding: false,
              inputArgs: [],
              outputArgs: [],
              mapArgs: ['-map', '0:1'],
            },
          ],
          container: 'mp4',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Video Encoder Setting', () => {
    it('should set video encoder for h264 to hevc with force encoding', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.hardwareDecoding).toBe(true);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('-c:{outputIndex}');
      expect(videoStream.outputArgs).toContain('libx265');
      expect(videoStream.outputArgs).toContain('-crf');
      expect(videoStream.outputArgs).toContain('25');
      expect(videoStream.outputArgs).toContain('-preset');
      expect(videoStream.outputArgs).toContain('fast');

      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: 'hevc',
        hardwareEncoding: true,
        hardwareType: 'auto',
        args: baseArgs,
      });
    });

    it('should not process video stream if codec matches and force encoding is false', async () => {
      baseArgs.inputs.forceEncoding = false;
      baseArgs.inputs.outputCodec = 'h264';

      const result = await plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toHaveLength(0);
    });

    it('should process video stream if codec matches but force encoding is true', async () => {
      baseArgs.inputs.forceEncoding = true;
      baseArgs.inputs.outputCodec = 'h264';
      mockGetEncoder.mockResolvedValue({
        encoder: 'libx264',
        inputArgs: [],
        outputArgs: [],
        isGpu: false,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('libx264');
    });
  });

  describe('Codec Types', () => {
    it.each([
      'hevc',
      'h264',
      'av1',
    ])('should handle %s codec', async (codec) => {
      baseArgs.inputs.outputCodec = codec;
      let expectedEncoder: string;
      if (codec === 'hevc') {
        expectedEncoder = 'libx265';
      } else if (codec === 'h264') {
        expectedEncoder = 'libx264';
      } else {
        expectedEncoder = 'libsvtav1';
      }
      mockGetEncoder.mockResolvedValue({
        encoder: expectedEncoder,
        inputArgs: [],
        outputArgs: [],
        isGpu: false,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: codec,
        hardwareEncoding: true,
        hardwareType: 'auto',
        args: baseArgs,
      });

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain(expectedEncoder);
    });
  });

  describe('Hardware Encoding Settings', () => {
    it('should handle GPU encoding with QSV using global_quality', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_qsv',
        inputArgs: ['-hwaccel', 'qsv'],
        outputArgs: ['-load_plugin', 'hevc_hw'],
        isGpu: true,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('hevc_qsv');
      expect(videoStream.outputArgs).toContain('-global_quality');
      expect(videoStream.outputArgs).toContain('25');
      expect(videoStream.inputArgs).toEqual(['-hwaccel', 'qsv']);
    });

    it('should handle GPU encoding with NVENC using qp', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_nvenc',
        inputArgs: ['-hwaccel', 'cuda'],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('hevc_nvenc');
      expect(videoStream.outputArgs).toContain('-qp');
      expect(videoStream.outputArgs).toContain('25');
    });

    it('should handle software encoding with crf', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'libx265',
        inputArgs: [],
        outputArgs: [],
        isGpu: false,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('libx265');
      expect(videoStream.outputArgs).toContain('-crf');
      expect(videoStream.outputArgs).toContain('25');
    });

    it('should not apply hardware decoding when disabled', async () => {
      baseArgs.inputs.hardwareDecoding = false;

      const result = await plugin(baseArgs);

      expect(result.variables.ffmpegCommand.hardwareDecoding).toBe(false);
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.inputArgs).toHaveLength(0);
    });

    it('should handle different hardware types', async () => {
      baseArgs.inputs.hardwareType = 'nvenc';

      await plugin(baseArgs);

      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: 'hevc',
        hardwareEncoding: true,
        hardwareType: 'nvenc',
        args: baseArgs,
      });
    });
  });

  describe('Quality and Preset Settings', () => {
    it('should skip quality setting when disabled', async () => {
      baseArgs.inputs.ffmpegQualityEnabled = false;

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).not.toContain('-crf');
      expect(videoStream.outputArgs).not.toContain('-qp');
      expect(videoStream.outputArgs).not.toContain('-global_quality');
    });

    it('should skip preset setting when disabled', async () => {
      baseArgs.inputs.ffmpegPresetEnabled = false;

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).not.toContain('-preset');
    });

    it('should not apply preset for av1 codec', async () => {
      baseArgs.inputs.outputCodec = 'av1';
      mockGetEncoder.mockResolvedValue({
        encoder: 'libsvtav1',
        inputArgs: [],
        outputArgs: [],
        isGpu: false,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).not.toContain('-preset');
    });

    it('should handle different preset values', async () => {
      const presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];

      await Promise.all(presets.map(async (preset) => {
        baseArgs.inputs.ffmpegPreset = preset;
        baseArgs.variables.ffmpegCommand.streams[0].outputArgs = []; // Reset

        const result = await plugin(baseArgs);

        const videoStream = result.variables.ffmpegCommand.streams[0];
        expect(videoStream.outputArgs).toContain('-preset');
        expect(videoStream.outputArgs).toContain(preset);
      }));
    });

    it('should handle different quality values', async () => {
      const qualityValues = ['18', '23', '28'];

      await Promise.all(qualityValues.map(async (quality) => {
        baseArgs.inputs.ffmpegQuality = quality;
        baseArgs.variables.ffmpegCommand.streams[0].outputArgs = []; // Reset

        const result = await plugin(baseArgs);

        const videoStream = result.variables.ffmpegCommand.streams[0];
        expect(videoStream.outputArgs).toContain('-crf');
        expect(videoStream.outputArgs).toContain(quality);
      }));
    });
  });

  describe('Multiple Streams Handling', () => {
    it('should only process video streams', async () => {
      const result = await plugin(baseArgs);

      // Video stream should be processed
      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs.length).toBeGreaterThan(0);

      // Audio stream should not be processed
      const audioStream = result.variables.ffmpegCommand.streams[1];
      expect(audioStream.outputArgs).toHaveLength(0);
    });

    it('should handle multiple video streams', async () => {
      // Add another video stream
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'hevc',
        codec_type: 'video',
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:2'],
      });

      const result = await plugin(baseArgs);

      // Both video streams should be processed
      const videoStream1 = result.variables.ffmpegCommand.streams[0];
      const videoStream2 = result.variables.ffmpegCommand.streams[2];
      expect(videoStream1.outputArgs.length).toBeGreaterThan(0);
      expect(videoStream2.outputArgs.length).toBeGreaterThan(0);
    });

    it('should not handle video stream with mjpeg codec_name in', async () => {
      baseArgs.variables.ffmpegCommand.streams.push({
        index: 2,
        codec_name: 'mjpeg',
        codec_type: 'video',
        removed: false,
        forceEncoding: false,
        inputArgs: [],
        outputArgs: [],
        mapArgs: ['-map', '0:2'],
      });

      const result = await plugin(baseArgs);

      // Only the first stream should be processed
      const videoStream1 = result.variables.ffmpegCommand.streams[0];
      const videoStream2 = result.variables.ffmpegCommand.streams[2];
      expect(videoStream1.outputArgs.length).toBeGreaterThan(0);
      expect(videoStream2.outputArgs.length).toBe(0);
    });

    it('should handle files with only audio streams', async () => {
      // Remove video stream, keep only audio
      baseArgs.variables.ffmpegCommand.streams = [
        {
          index: 1,
          codec_name: 'aac',
          codec_type: 'audio',
          removed: false,
          forceEncoding: false,
          inputArgs: [],
          outputArgs: [],
          mapArgs: ['-map', '0:1'],
        },
      ];

      const result = await plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(false);
      const audioStream = result.variables.ffmpegCommand.streams[0];
      expect(audioStream.outputArgs).toHaveLength(0);
    });
  });

  describe('Encoder Properties Handling', () => {
    it('should apply encoder output args when provided', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_nvenc',
        inputArgs: ['-hwaccel', 'cuda'],
        outputArgs: ['-rc', 'vbr', '-cq', '23'],
        isGpu: true,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('-rc');
      expect(videoStream.outputArgs).toContain('vbr');
      expect(videoStream.outputArgs).toContain('-cq');
      expect(videoStream.outputArgs).toContain('23');
    });

    it('should not apply encoder output args when not provided', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'libx265',
        inputArgs: [],
        outputArgs: [],
        isGpu: false,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      const videoStream = result.variables.ffmpegCommand.streams[0];
      expect(videoStream.outputArgs).toContain('libx265');
      expect(videoStream.outputArgs).toContain('-crf');
    });
  });

  describe('FFmpeg Command Initialization', () => {
    it('should throw error when ffmpegCommand is not initialized', async () => {
      baseArgs.variables.ffmpegCommand.init = false;

      await expect(plugin(baseArgs)).rejects.toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });

    it('should throw error when ffmpegCommand is undefined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.variables as any).ffmpegCommand = undefined;

      await expect(plugin(baseArgs)).rejects.toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });

    it('should throw error when variables is undefined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs as any).variables = undefined;

      await expect(plugin(baseArgs)).rejects.toThrow(
        'FFmpeg command plugins not used correctly',
      );
    });
  });

  describe('Input Validation and Default Values', () => {
    it('should handle missing input values with defaults', async () => {
      baseArgs.inputs = {};

      const result = await plugin(baseArgs);

      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: 'hevc', // default value
        hardwareEncoding: true, // default value
        hardwareType: 'auto', // default value
        args: baseArgs,
      });

      expect(result.outputNumber).toBe(1);
    });

    it('should convert string inputs correctly', async () => {
      // Test with string inputs (as they come from UI)
      baseArgs.inputs.outputCodec = 'h264';
      baseArgs.inputs.ffmpegPreset = 'slow';
      baseArgs.inputs.ffmpegQuality = '20';
      baseArgs.inputs.hardwareType = 'nvenc';

      await plugin(baseArgs);

      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: 'h264',
        hardwareEncoding: true,
        hardwareType: 'nvenc',
        args: baseArgs,
      });
    });
  });

  describe('Plugin Output Structure', () => {
    it('should return correct output structure and preserve references', async () => {
      const result = await plugin(baseArgs);

      expect(result).toHaveProperty('outputFileObj');
      expect(result).toHaveProperty('outputNumber');
      expect(result).toHaveProperty('variables');
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should preserve other variables properties', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (baseArgs.variables as any).customProperty = 'test';

      const result = await plugin(baseArgs);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.variables as any).customProperty).toBe('test');
    });
  });
});
