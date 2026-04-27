import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileVariationExists/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the lib module - use real loadDefaultValues by default, tests can override
const realLoadDefaultValues = require('../../../../../../methods/loadDefaultValues');
// eslint-disable-next-line prefer-const
let mockLoadDefaultValues = realLoadDefaultValues;
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: (...libArgs: unknown[]) => mockLoadDefaultValues(...libArgs),
}));

// Mock the fileUtils module
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  fileExists: jest.fn(),
  getContainer: jest.fn((filePath: string) => {
    const parts = filePath.split('.');
    return parts[parts.length - 1];
  }),
  getFileName: jest.fn((filePath: string) => {
    const parts = filePath.split('/');
    const fileNameAndContainer = parts[parts.length - 1];
    const parts2 = fileNameAndContainer.split('.');
    parts2.pop();
    return parts2.join('.');
  }),
  getFileAbsoluteDir: jest.fn((filePath: string) => {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
  }),
}));

const { fileExists } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');

describe('checkFileVariationExists Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    fileExists.mockResolvedValue(false);
    mockLoadDefaultValues = realLoadDefaultValues;

    baseArgs = {
      inputs: {
        propsToCheck: 'codec',
        expectedValues: 'hevc',
        directory: '',
      },
      variables: {
        ffmpegCommand: {
          init: false,
          inputFiles: [],
          streams: [],
          container: '',
          hardwareDecoding: false,
          shouldProcess: false,
          overallInputArguments: [],
          overallOuputArguments: [],
        },
        flowFailed: false,
        user: {},
      },
      inputFileObj: {
        ...JSON.parse(JSON.stringify(sampleH264)),
        _id: 'C:/Transcode/Source Folder/SampleVideo_h264_720p.mp4',
        video_codec_name: 'h264',
        video_resolution: '720p',
        container: 'mp4',
      } as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Codec Replacement', () => {
    it('should output 1 when a file with the replaced codec exists', async () => {
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalled();
      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should output 2 when a file with the replaced codec does not exist', async () => {
      fileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalled();
      expect(result.outputNumber).toBe(2);
    });

    it('should replace codec in filename and check correct path', async () => {
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace h265 synonym with hevc in the file name', async () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h265_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h265';
      baseArgs.inputs.expectedValues = 'hevc';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace hevc synonym with h265 in the file name', async () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_hevc_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'hevc';
      baseArgs.inputs.expectedValues = 'h265';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_h265_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace h264 synonym with avc in the file name', async () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h264_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';
      baseArgs.inputs.expectedValues = 'avc';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_avc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace avc synonym with h264 in the file name', async () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_avc_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'avc';
      baseArgs.inputs.expectedValues = 'h264';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_h264_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace synonym in filename when filename uses different name than codec metadata', async () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h265_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'hevc';
      baseArgs.inputs.expectedValues = 'av1';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_av1_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Container Replacement', () => {
    it('should replace container extension', async () => {
      baseArgs.inputs.propsToCheck = 'container';
      baseArgs.inputs.expectedValues = 'mkv';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo.mp4';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo.mkv',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Resolution Replacement', () => {
    it('should replace resolution in the file name', async () => {
      baseArgs.inputs.propsToCheck = 'resolution';
      baseArgs.inputs.expectedValues = '1080p';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_720p.mp4';
      baseArgs.inputFileObj.video_resolution = '720p';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_1080p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Multiple Properties', () => {
    it('should replace multiple properties at once', async () => {
      baseArgs.inputs.propsToCheck = 'codec,resolution';
      baseArgs.inputs.expectedValues = 'hevc,1080p';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h264_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';
      baseArgs.inputFileObj.video_resolution = '720p';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_1080p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace codec, container and resolution together', async () => {
      baseArgs.inputs.propsToCheck = 'codec,container,resolution';
      baseArgs.inputs.expectedValues = 'hevc,mkv,1080p';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h264_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';
      baseArgs.inputFileObj.video_resolution = '720p';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_1080p.mkv',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Input Validation', () => {
    it('should output 2 when property count does not match expected value count', async () => {
      baseArgs.inputs.propsToCheck = 'codec,resolution';
      baseArgs.inputs.expectedValues = 'hevc';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Amount of properties does not match amount of expected values.',
      );
      expect(result.outputNumber).toBe(2);
      expect(fileExists).not.toHaveBeenCalled();
    });

    it('should output 2 when properties input is empty (bypassing defaults)', async () => {
      mockLoadDefaultValues = (inputs: Record<string, unknown>) => inputs;
      baseArgs.inputs.propsToCheck = '  ';
      baseArgs.inputs.expectedValues = '  ';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('No properties provided.');
      expect(result.outputNumber).toBe(2);
      expect(fileExists).not.toHaveBeenCalled();
    });

    it('should output 2 and log when an unknown property is provided', async () => {
      baseArgs.inputs.propsToCheck = 'bitrate';
      baseArgs.inputs.expectedValues = '5000';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Unknown properties: bitrate'),
      );
      expect(result.outputNumber).toBe(2);
      expect(fileExists).not.toHaveBeenCalled();
    });

    it('should output 2 when one of multiple properties is unknown', async () => {
      baseArgs.inputs.propsToCheck = 'codec,bitrate';
      baseArgs.inputs.expectedValues = 'hevc,5000';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Unknown properties: bitrate'),
      );
      expect(result.outputNumber).toBe(2);
      expect(fileExists).not.toHaveBeenCalled();
    });

    it('should handle trailing commas gracefully', async () => {
      mockLoadDefaultValues = (inputs: Record<string, unknown>) => inputs;
      baseArgs.inputs.propsToCheck = 'codec,';
      baseArgs.inputs.expectedValues = 'hevc,';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Uppercase Handling', () => {
    it('should replace uppercase codec values in the file name', async () => {
      baseArgs.inputs.propsToCheck = 'codec';
      baseArgs.inputs.expectedValues = 'hevc';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_H264_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Directory input', () => {
    it('should use custom directory when provided', async () => {
      baseArgs.inputs.directory = 'D:/Media/Movies';
      baseArgs.inputs.propsToCheck = 'codec';
      baseArgs.inputs.expectedValues = 'hevc';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h264_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'D:/Media/Movies/SampleVideo_hevc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should use source file directory when directory input is empty', async () => {
      baseArgs.inputs.directory = '';
      baseArgs.inputs.propsToCheck = 'codec';
      baseArgs.inputs.expectedValues = 'hevc';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source Folder/SampleVideo_hevc_720p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Path safety', () => {
    it('should only replace in filename, not in directory path', async () => {
      baseArgs.inputs.propsToCheck = 'resolution';
      baseArgs.inputs.expectedValues = '1080p';
      baseArgs.inputFileObj._id = 'C:/Transcode/720p/SampleVideo_720p.mp4';
      baseArgs.inputFileObj.video_resolution = '720p';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/720p/SampleVideo_1080p.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should replace all occurrences in filename', async () => {
      baseArgs.inputs.propsToCheck = 'codec';
      baseArgs.inputs.expectedValues = 'hevc';
      baseArgs.inputFileObj._id = 'C:/Transcode/Source/h264_video_h264.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h264';
      fileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(fileExists).toHaveBeenCalledWith(
        'C:/Transcode/Source/hevc_video_hevc.mp4',
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Job Logging', () => {
    it('should log when similar file exists', async () => {
      fileExists.mockResolvedValue(true);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Similar file exists:'),
      );
    });

    it('should log when similar file does not exist', async () => {
      fileExists.mockResolvedValue(false);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Similar file does not exist:'),
      );
    });
  });
});
