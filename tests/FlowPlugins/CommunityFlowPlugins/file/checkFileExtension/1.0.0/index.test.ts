import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileExtension/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleMP4 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMKV = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('checkFileExtension Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        extensions: 'mkv,mp4',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleMP4)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Extension Matching', () => {
    it('should match MP4 extension', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should match MKV extension', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMKV)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should reject non-matching extension', () => {
      baseArgs.inputs.extensions = 'avi,wmv';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should be case insensitive', () => {
      baseArgs.inputs.extensions = 'MKV,MP4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Multiple Extensions', () => {
    it('should handle single extension', () => {
      baseArgs.inputs.extensions = 'mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle multiple extensions', () => {
      baseArgs.inputs.extensions = 'mp4,mkv,avi,wmv,mov,m4v,flv,webm,ogv,3gp';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should match extension anywhere in list', () => {
      baseArgs.inputs.extensions = 'avi,mkv,mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Extension Format Handling', () => {
    it('should handle extensions with dots (should not match)', () => {
      baseArgs.inputs.extensions = '.mp4,.mkv';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2); // Should not match because getContainer returns without dot
    });

    it('should handle mixed format extensions', () => {
      baseArgs.inputs.extensions = 'mp4,.mkv,avi';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1); // Should match mp4
    });

    it('should handle empty extension (loads defaults)', () => {
      baseArgs.inputs.extensions = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1); // Empty string should load default 'mkv,mp4' and match mp4
    });

    it('should handle individual extension spaces (should not match)', () => {
      baseArgs.inputs.extensions = '  mp4  ,  mkv  ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2); // Should fail because individual extensions are not trimmed
    });

    it('should handle whitespace around entire string', () => {
      baseArgs.inputs.extensions = '  mp4,mkv  ';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1); // Should work because whole string is trimmed
    });
  });

  describe('Common Video Extensions', () => {
    it.each([
      'mp4',
      'mkv',
      'avi',
      'wmv',
      'mov',
      'm4v',
      'flv',
      'webm',
      '3gp',
    ])('should handle %s extension', (extension) => {
      baseArgs.inputs.extensions = extension;

      // Create mock file object with the test extension
      const mockFileObj = JSON.parse(JSON.stringify(sampleMP4)) as IFileObject;
      mockFileObj._id = `C:/test/sample.${extension}`;
      mockFileObj.file = `C:/test/sample.${extension}`;
      mockFileObj.container = extension;
      baseArgs.inputFileObj = mockFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Common Audio Extensions', () => {
    it.each([
      'mp3',
      'wav',
      'flac',
      'aac',
      'm4a',
      'ogg',
      'wma',
    ])('should handle %s extension', (extension) => {
      baseArgs.inputs.extensions = extension;

      // Create mock file object with the test extension
      const mockFileObj = JSON.parse(JSON.stringify(sampleMKV)) as IFileObject;
      mockFileObj._id = `C:/test/sample.${extension}`;
      mockFileObj.file = `C:/test/sample.${extension}`;
      mockFileObj.container = extension;
      baseArgs.inputFileObj = mockFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unusual file paths', () => {
      const mockFileObj = JSON.parse(JSON.stringify(sampleMP4)) as IFileObject;
      mockFileObj._id = 'C:/test/file with spaces & symbols!@#$.mp4';
      mockFileObj.file = 'C:/test/file with spaces & symbols!@#$.mp4';
      baseArgs.inputFileObj = mockFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle file with no extension', () => {
      const mockFileObj = JSON.parse(JSON.stringify(sampleMP4)) as IFileObject;
      mockFileObj._id = 'C:/test/filenoextension';
      mockFileObj.file = 'C:/test/filenoextension';
      mockFileObj.container = '';
      baseArgs.inputFileObj = mockFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle file with multiple dots in name', () => {
      const mockFileObj = JSON.parse(JSON.stringify(sampleMP4)) as IFileObject;
      mockFileObj._id = 'C:/test/file.name.with.dots.mp4';
      mockFileObj.file = 'C:/test/file.name.with.dots.mp4';
      baseArgs.inputFileObj = mockFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Default Values', () => {
    it('should use default extensions when input is empty', () => {
      delete baseArgs.inputs.extensions;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1); // MP4 should match default mkv,mp4
    });

    it('should preserve variables', () => {
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

      const result = plugin(baseArgs);

      expect(result.variables).toEqual(baseArgs.variables);
    });

    it('should return same file object', () => {
      const result = plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });
});
