import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileNameIncludes/2.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('checkFileNameIncludes Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        fileToCheck: 'workingFile',
        terms: '',
        pattern: '',
        includeFileDirectory: 'false',
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
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Term Matching', () => {
    it('should match when filename contains one of the terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p_x264.mp4';
      baseArgs.inputs.terms = '_720p,_1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_720p_x264.mp4' includes '_720p'");
    });

    it('should match when filename contains different term from list', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080p_BluRay.mkv';
      baseArgs.inputs.terms = '_720p,_1080p,_4K';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_1080p_BluRay.mkv' includes '_1080p'");
    });

    it('should not match when filename contains none of the terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_480p_DVDRip.avi';
      baseArgs.inputs.terms = '_720p,_1080p,_4K';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        "'Movie_480p_DVDRip.avi' does not include any of the terms or patterns",
      );
    });

    it('should handle single term input', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Sample_BluRay.mkv';
      baseArgs.inputs.terms = 'BluRay';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Sample_BluRay.mkv' includes 'BluRay'");
    });

    it('should use default terms when empty string provided', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p.mp4';
      baseArgs.inputs.terms = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_720p.mp4' includes '_720p'");
    });
  });

  describe('Pattern Matching (Regex)', () => {
    it('should match using regex pattern', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_2023_480p.mkv';
      baseArgs.inputs.terms = 'nomatch';
      baseArgs.inputs.pattern = '.*_\\d{4}_.*';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_2023_480p.mkv' includes '.*_\\d{4}_.*'");
    });

    it('should match file extension pattern', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Sample.mkv';
      baseArgs.inputs.terms = 'nomatch';
      baseArgs.inputs.pattern = '.*\\.mkv$';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Sample.mkv' includes '.*\\.mkv$'");
    });

    it('should not match invalid regex pattern', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Sample.mp4';
      baseArgs.inputs.terms = 'nomatch';
      baseArgs.inputs.pattern = '.*\\.mkv$';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Sample.mp4' does not include any of the terms or patterns");
    });

    it('should find terms before patterns when both match', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p.mp4';
      baseArgs.inputs.terms = '_720p';
      baseArgs.inputs.pattern = '.*Movie.*';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_720p.mp4' includes '_720p'");
    });
  });

  describe('File Selection (workingFile vs originalFile)', () => {
    it('should check workingFile by default', () => {
      baseArgs.inputFileObj._id = 'C:/Working/Movie_720p.mp4';
      baseArgs.originalLibraryFile._id = 'C:/Original/Movie_1080p.mkv';
      baseArgs.inputs.fileToCheck = 'workingFile';
      baseArgs.inputs.terms = '_720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_720p.mp4' includes '_720p'");
    });

    it('should check originalFile when specified', () => {
      baseArgs.inputFileObj._id = 'C:/Working/Movie_720p.mp4';
      baseArgs.originalLibraryFile._id = 'C:/Original/Movie_1080p.mkv';
      baseArgs.inputs.fileToCheck = 'originalFile';
      baseArgs.inputs.terms = '_1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_1080p.mkv' includes '_1080p'");
    });

    it('should not match originalFile with wrong term', () => {
      baseArgs.inputFileObj._id = 'C:/Working/Movie_720p.mp4';
      baseArgs.originalLibraryFile._id = 'C:/Original/Movie_1080p.mkv';
      baseArgs.inputs.fileToCheck = 'originalFile';
      baseArgs.inputs.terms = '_720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_1080p.mkv' does not include any of the terms or patterns");
    });
  });

  describe('Directory Path Inclusion', () => {
    it('should check only filename when includeFileDirectory is false', () => {
      baseArgs.inputFileObj._id = 'C:/Movies/4K_Content/Movie_720p.mp4';
      baseArgs.inputs.terms = '4K_Content';
      baseArgs.inputs.includeFileDirectory = 'false';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_720p.mp4' does not include any of the terms or patterns");
    });

    it('should check full path when includeFileDirectory is true', () => {
      baseArgs.inputFileObj._id = 'C:/Movies/4K_Content/Movie_720p.mp4';
      baseArgs.inputs.terms = '4K_Content';
      baseArgs.inputs.includeFileDirectory = 'true';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'C:/Movies/4K_Content/Movie_720p.mp4' includes '4K_Content'");
    });

    it('should match directory pattern with regex when includeFileDirectory is true', () => {
      baseArgs.inputFileObj._id = 'C:/Movies/Season_01/Episode_480p.mkv';
      baseArgs.inputs.terms = 'nomatch';
      baseArgs.inputs.pattern = '.*/Season_\\d+/.*';
      baseArgs.inputs.includeFileDirectory = 'true';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        "'C:/Movies/Season_01/Episode_480p.mkv' includes '.*/Season_\\d+/.*'",
      );
    });
  });

  describe('Special Characters and Escaping', () => {
    it('should handle special regex characters in terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie[2023].mp4';
      baseArgs.inputs.terms = '[2023]';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie[2023].mp4' includes '\\[2023\\]'");
    });

    it('should handle parentheses in terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie(Director Cut).mkv';
      baseArgs.inputs.terms = '(Director Cut)';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie(Director Cut).mkv' includes '\\(Director Cut\\)'");
    });

    it('should handle dots and other special characters', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie.v2.1080p.mkv';
      baseArgs.inputs.terms = '.v2.';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie.v2.1080p.mkv' includes '\\.v2\\.'");
    });
  });

  describe('File Types', () => {
    it('should work with video and audio files', () => {
      // Test video file
      baseArgs.inputFileObj._id = 'C:/Videos/Sample_1080p.mkv';
      baseArgs.inputs.terms = '_1080p';

      let result = plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Sample_1080p.mkv' includes '_1080p'");

      // Test audio file
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.inputFileObj._id = 'C:/Music/Song_192kbps.mp3';
      baseArgs.inputs.terms = '_192kbps';

      result = plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Song_192kbps.mp3' includes '_192kbps'");
    });

    it('should handle files with no extension', () => {
      baseArgs.inputFileObj._id = 'C:/Files/SampleFile';
      baseArgs.inputs.terms = 'SampleFile';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'.C:/Files/SampleFile' includes 'SampleFile'");
    });
  });

  describe('Complex Scenarios', () => {
    it('should match first found term when multiple terms match', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080p_BluRay.mkv';
      baseArgs.inputs.terms = '_1080p,BluRay';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_1080p_BluRay.mkv' includes '_1080p'");
    });

    it('should handle whitespace and case sensitivity', () => {
      // Test whitespace handling
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_480p .mp4';
      baseArgs.inputs.terms = ' _480p , _360p ';

      let result = plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'Movie_480p .mp4' includes '_480p '");

      // Test case sensitivity
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_BLURAY.mkv';
      baseArgs.inputs.terms = 'bluray';

      result = plugin(baseArgs);
      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        "'Movie_BLURAY.mkv' does not include any of the terms or patterns",
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filename', () => {
      baseArgs.inputFileObj._id = '';
      baseArgs.inputs.terms = 'test';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith("'.' does not include any of the terms or patterns");
    });

    it('should handle null/undefined inputs gracefully', () => {
      baseArgs.inputs.terms = 'undefined';
      baseArgs.inputs.pattern = 'undefined';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should maintain variables in output', () => {
      baseArgs.variables.user = { customVar: 'testValue' };
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p.mp4';
      baseArgs.inputs.terms = '_720p';

      const result = plugin(baseArgs);

      expect(result.variables.user).toEqual({ customVar: 'testValue' });
    });
  });
});
