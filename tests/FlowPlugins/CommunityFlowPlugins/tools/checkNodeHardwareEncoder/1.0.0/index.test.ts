import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/checkNodeHardwareEncoder/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the getEncoder function from hardwareUtils
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/hardwareUtils', () => ({
  getEncoder: jest.fn(),
}));

describe('checkNodeHardwareEncoder Plugin', () => {
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

    baseArgs = {
      inputs: {
        hardwareEncoder: 'hevc_nvenc',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HEVC Hardware Encoder Detection', () => {
    it('should detect available NVIDIA HEVC encoder', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_nvenc',
        inputArgs: ['-hwaccel', 'cuda'],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_nvenc',
            enabled: true,
            inputArgs: ['-hwaccel', 'cuda'],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_nvenc: true');
      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: 'hevc',
        hardwareEncoding: true,
        hardwareType: 'auto',
        args: baseArgs,
      });
    });

    it('should detect unavailable NVIDIA HEVC encoder', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_nvenc',
        inputArgs: ['-hwaccel', 'cuda'],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_amf',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_nvenc: false');
    });

    it('should detect available AMD HEVC encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'hevc_amf';
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_amf',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_amf',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_amf: true');
    });

    it('should detect available Intel QSV HEVC encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'hevc_qsv';
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_qsv',
        inputArgs: ['-hwaccel', 'qsv'],
        outputArgs: ['-load_plugin', 'hevc_hw'],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_qsv',
            enabled: true,
            inputArgs: ['-hwaccel', 'qsv'],
            outputArgs: ['-load_plugin', 'hevc_hw'],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_qsv: true');
    });

    it('should detect available Intel VAAPI HEVC encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'hevc_vaapi';
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_vaapi',
        inputArgs: [
          '-hwaccel',
          'vaapi',
          '-hwaccel_device',
          '/dev/dri/renderD128',
          '-hwaccel_output_format',
          'vaapi',
        ],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_vaapi',
            enabled: true,
            inputArgs: [
              '-hwaccel',
              'vaapi',
              '-hwaccel_device',
              '/dev/dri/renderD128',
              '-hwaccel_output_format',
              'vaapi',
            ],
            outputArgs: [],
            filter: '-vf format=nv12,hwupload',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_vaapi: true');
    });

    it('should detect available Apple VideoToolbox HEVC encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'hevc_videotoolbox';
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_videotoolbox',
        inputArgs: ['-hwaccel', 'videotoolbox'],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_videotoolbox',
            enabled: true,
            inputArgs: ['-hwaccel', 'videotoolbox'],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_videotoolbox: true');
    });
  });

  describe('AV1 Hardware Encoder Detection', () => {
    it('should detect available NVIDIA AV1 encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'av1_nvenc';
      mockGetEncoder.mockResolvedValue({
        encoder: 'av1_nvenc',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'av1_nvenc',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder av1_nvenc: true');
      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: 'av1',
        hardwareEncoding: true,
        hardwareType: 'auto',
        args: baseArgs,
      });
    });

    it('should detect unavailable AMD AV1 encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'av1_amf';
      mockGetEncoder.mockResolvedValue({
        encoder: 'av1_amf',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'av1_nvenc',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder av1_amf: false');
    });

    it('should detect available Intel QSV AV1 encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'av1_qsv';
      mockGetEncoder.mockResolvedValue({
        encoder: 'av1_qsv',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'av1_qsv',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder av1_qsv: true');
    });

    it('should detect available Intel VAAPI AV1 encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'av1_vaapi';
      mockGetEncoder.mockResolvedValue({
        encoder: 'av1_vaapi',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'av1_vaapi',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder av1_vaapi: true');
    });

    it('should detect available Apple VideoToolbox AV1 encoder', async () => {
      baseArgs.inputs.hardwareEncoder = 'av1_videotoolbox';
      mockGetEncoder.mockResolvedValue({
        encoder: 'av1_videotoolbox',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'av1_videotoolbox',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder av1_videotoolbox: true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty enabled devices array', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_nvenc',
        inputArgs: ['-hwaccel', 'cuda'],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_nvenc: false');
    });

    it('should handle multiple enabled devices with different encoders', async () => {
      mockGetEncoder.mockResolvedValue({
        encoder: 'hevc_nvenc',
        inputArgs: ['-hwaccel', 'cuda'],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: 'hevc_amf',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
          {
            encoder: 'hevc_nvenc',
            enabled: true,
            inputArgs: ['-hwaccel', 'cuda'],
            outputArgs: [],
            filter: '',
          },
          {
            encoder: 'hevc_qsv',
            enabled: false,
            inputArgs: ['-hwaccel', 'qsv'],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder hevc_nvenc: true');
    });

    it('should handle string input conversion correctly', async () => {
      baseArgs.inputs.hardwareEncoder = 123 as unknown as string; // Simulate non-string input
      mockGetEncoder.mockResolvedValue({
        encoder: '123',
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder: '123',
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Node has hardwareEncoder 123: true');
    });
  });

  describe('Codec Detection Logic', () => {
    it.each([
      ['hevc_nvenc', 'hevc'],
      ['hevc_amf', 'hevc'],
      ['hevc_qsv', 'hevc'],
      ['hevc_vaapi', 'hevc'],
      ['hevc_videotoolbox', 'hevc'],
      ['av1_nvenc', 'av1'],
      ['av1_amf', 'av1'],
      ['av1_qsv', 'av1'],
      ['av1_vaapi', 'av1'],
      ['av1_videotoolbox', 'av1'],
    ])('should detect correct codec for encoder %s', async (encoder, expectedCodec) => {
      baseArgs.inputs.hardwareEncoder = encoder;
      mockGetEncoder.mockResolvedValue({
        encoder,
        inputArgs: [],
        outputArgs: [],
        isGpu: true,
        enabledDevices: [
          {
            encoder,
            enabled: true,
            inputArgs: [],
            outputArgs: [],
            filter: '',
          },
        ],
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockGetEncoder).toHaveBeenCalledWith({
        targetCodec: expectedCodec,
        hardwareEncoding: true,
        hardwareType: 'auto',
        args: baseArgs,
      });
    });
  });
});
