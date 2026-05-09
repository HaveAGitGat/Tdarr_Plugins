import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileExists/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import * as fileUtils from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the fileExists function directly
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  ...jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils'),
  fileExists: jest.fn(),
}));

describe('checkFileExists Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockFileExists: jest.MockedFunction<typeof fileUtils.fileExists>;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        // eslint-disable-next-line no-template-curly-in-string
        fileToCheck: '${fileName}_720p.${container}',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    // Get the mocked fileExists function
    mockFileExists = fileUtils.fileExists as jest.MockedFunction<typeof fileUtils.fileExists>;
    jest.clearAllMocks();
  });

  describe('File Existence Checks', () => {
    it('should return output 1 when file exists', async () => {
      // Mock file exists
      mockFileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('File exists: '),
      );
    });

    it('should return output 2 when file does not exist', async () => {
      // Mock file does not exist
      mockFileExists.mockResolvedValue(false);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('File does not exist: '),
      );
    });
  });

  describe('Template Variable Replacement', () => {
    // eslint-disable-next-line no-template-curly-in-string
    it('should replace ${fileName} template variable', async () => {
      mockFileExists.mockResolvedValue(true);

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('SampleVideo_1280x720_1mb_720p.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });

    // eslint-disable-next-line no-template-curly-in-string
    it('should replace ${container} template variable', async () => {
      mockFileExists.mockResolvedValue(true);
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileToCheck = '${fileName}.${container}';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('SampleVideo_1280x720_1mb.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should handle custom file pattern', async () => {
      mockFileExists.mockResolvedValue(true);
      // eslint-disable-next-line no-template-curly-in-string
      baseArgs.inputs.fileToCheck = 'custom_${fileName}_transcoded.${container}';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('custom_SampleVideo_1280x720_1mb_transcoded.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Directory Handling', () => {
    it('should use input file directory when directory is empty', async () => {
      mockFileExists.mockResolvedValue(true);
      baseArgs.inputs.directory = '';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('C:/Transcode/Source Folder/SampleVideo_1280x720_1mb_720p.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should use specified directory when provided', async () => {
      mockFileExists.mockResolvedValue(true);
      baseArgs.inputs.directory = '/custom/directory';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('/custom/directory/SampleVideo_1280x720_1mb_720p.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should handle directory with trailing slash', async () => {
      mockFileExists.mockResolvedValue(true);
      baseArgs.inputs.directory = '/custom/directory/';

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('/custom/directory//SampleVideo_1280x720_1mb_720p.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle files without extension', async () => {
      mockFileExists.mockResolvedValue(true);
      const fileWithoutExt = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      fileWithoutExt._id = '/test/path/filename_no_ext';
      baseArgs.inputFileObj = fileWithoutExt;

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('/test/path/_720p./test/path/filename_no_ext'),
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should handle multiple periods in filename', async () => {
      mockFileExists.mockResolvedValue(true);
      const complexName = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      complexName._id = '/test/path/file.name.with.dots.mp4';
      baseArgs.inputFileObj = complexName;

      const result = await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('file.name.with.dots_720p.mp4'),
      );
      expect(result.outputNumber).toBe(1);
    });

    it('should handle empty fileToCheck input', async () => {
      mockFileExists.mockResolvedValue(false);
      baseArgs.inputs.fileToCheck = '';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('File does not exist: '),
      );
    });
  });

  describe('Variable Propagation', () => {
    it('should preserve variables in output', async () => {
      mockFileExists.mockResolvedValue(true);
      baseArgs.variables = {
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
        user: { testVar: 'testValue' },
      };

      const result = await plugin(baseArgs);

      expect(result.variables.user).toEqual({ testVar: 'testValue' });
    });

    it('should handle user variables', async () => {
      mockFileExists.mockResolvedValue(true);
      baseArgs.variables = {
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
      };

      const result = await plugin(baseArgs);

      expect(result.variables.user).toEqual({});
    });
  });
});
