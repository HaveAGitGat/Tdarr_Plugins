import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileVariationExists/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the lib module
jest.mock('../../../../../../methods/lib', () => () => ({
  loadDefaultValues: require('../../../../../../methods/loadDefaultValues'),
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
}));

const { fileExists } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');

describe('checkFileVariationExists Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    jest.clearAllMocks();
    fileExists.mockResolvedValue(false);

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
        _id: 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
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

    it('should replace h265 with hevc synonym in the file name', async () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_h265_720p.mp4';
      baseArgs.inputFileObj.video_codec_name = 'h265';
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

  describe('Container Replacement', () => {
    it('should replace container in the file name', async () => {
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
