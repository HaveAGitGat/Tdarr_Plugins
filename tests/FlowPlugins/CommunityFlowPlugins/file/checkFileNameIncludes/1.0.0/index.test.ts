import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileNameIncludes/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('checkFileNameIncludes Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        terms: '_720p,_1080p',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Term Matching', () => {
    it('should match single term in filename (_720p)', () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_720p_1mb.mp4';
      baseArgs.inputs.terms = '_720p,_1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should match single term in filename (_1080p)', () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_1080p_HD.mp4';
      baseArgs.inputs.terms = '_720p,_1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should match first term when multiple terms are present', () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_720p_1080p_test.mp4';
      baseArgs.inputs.terms = '_720p,_1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should not match when filename does not contain any terms', () => {
      baseArgs.inputFileObj._id = 'C:/Transcode/Source Folder/SampleVideo_480p_SD.mp4';
      baseArgs.inputs.terms = '_720p,_1080p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });

  describe('Different File Extensions', () => {
    it('should match term in mkv file', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080p_BluRay.mkv';
      baseArgs.inputs.terms = '_1080p,_720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should match term in avi file', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/OldMovie_720p_DVDRip.avi';
      baseArgs.inputs.terms = '_720p,_480p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should work with file without extension', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/SampleVideo_1080p';
      baseArgs.inputs.terms = '_1080p,_720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Custom Terms', () => {
    it('should match custom quality terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_BluRay_REMUX.mkv';
      baseArgs.inputs.terms = 'BluRay,WEB-DL,HDTV';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should match codec terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_x264_AAC.mp4';
      baseArgs.inputs.terms = 'x264,x265,HEVC';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not match when custom terms are not present', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_Standard.mp4';
      baseArgs.inputs.terms = 'HDR,Dolby,IMAX';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Single Term Input', () => {
    it('should handle single term without comma', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_4K_UHD.mkv';
      baseArgs.inputs.terms = '4K';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not match single term when not present', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_HD.mkv';
      baseArgs.inputs.terms = '4K';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Case Sensitivity', () => {
    it('should match terms with exact case', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080P_HD.mp4';
      baseArgs.inputs.terms = '1080P,720P';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not match terms with different case', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080p_HD.mp4';
      baseArgs.inputs.terms = '1080P,720P';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Complex Filename Patterns', () => {
    it('should match in complex filename with multiple delimiters', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie.Name.2023.1080p.BluRay.x264-GROUP.mkv';
      baseArgs.inputs.terms = '1080p,720p,2160p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should match in filename with brackets', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/[Group] Movie Name (2023) [1080p] [x264].mkv';
      baseArgs.inputs.terms = '[1080p],[720p]';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should match partial string within longer terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_HEVC_1080p_HDR.mkv';
      baseArgs.inputs.terms = 'HEVC,x264';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty terms input by using default values', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p.mkv';
      baseArgs.inputs.terms = '';

      const result = plugin(baseArgs);

      // When empty, loadDefaultValues will set it to default '_720p,_1080p'
      // Filename is 'Movie_720p.mkv' which contains '_720p', so should match
      expect(result.outputNumber).toBe(1);
    });

    it('should handle terms with only commas', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080p.mkv';
      baseArgs.inputs.terms = ',,,';

      const result = plugin(baseArgs);

      // Comma-only string is not empty, so won't trigger default values
      // String(',,,').trim().split(',') results in ['', '', '', '']
      // Every string includes an empty string, so this will match
      expect(result.outputNumber).toBe(1);
    });

    it('should handle terms with spaces', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie1080pBluRay.mkv';
      baseArgs.inputs.terms = ' 1080p , BluRay ';

      const result = plugin(baseArgs);

      // Terms after split: ['1080p ', ' BluRay ']
      // These have spaces, so won't match '1080p' or 'BluRay' exactly
      expect(result.outputNumber).toBe(2);
    });

    it('should handle very long filename', () => {
      const longFilename = 'C:/Videos/Very.Long.Movie.Name.With.Many.Words.And.Details.2023.'
        + '1080p.BluRay.x264.DTS-HD.MA.7.1-GROUP.mkv';
      baseArgs.inputFileObj._id = longFilename;
      baseArgs.inputs.terms = '1080p,720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle filename with special characters', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie & Show [2023] - 1080p @ 60fps.mkv';
      baseArgs.inputs.terms = '1080p,720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Multiple Terms with Various Formats', () => {
    it('should match any of multiple resolution terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_2160p_4K.mkv';
      baseArgs.inputs.terms = '720p,1080p,1440p,2160p,4K';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should match any of multiple source terms', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_WEB-DL_1080p.mkv';
      baseArgs.inputs.terms = 'BluRay,WEB-DL,HDTV,DVD';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should not match when none of multiple terms are present', () => {
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_Standard_Quality.mp4';
      baseArgs.inputs.terms = '720p,1080p,1440p,2160p,4K,HDR,BluRay';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });
  });

  describe('Default Values Integration', () => {
    it('should use default values when inputs are not provided', () => {
      baseArgs.inputs = {};
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p_HD.mkv';

      const result = plugin(baseArgs);

      // Should use default terms '_720p,_1080p' and look for '_720p' in 'Movie_720p_HD.mkv'
      // This should match '_720p'
      expect(result.outputNumber).toBe(1);
    });

    it('should match with default terms when filename contains exact default patterns', () => {
      baseArgs.inputs = {};
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_720p_HD.mkv';

      const result = plugin(baseArgs);

      // Default terms are '_720p,_1080p', filename is 'Movie_720p_HD.mkv'
      // This should match '_720p'
      expect(result.outputNumber).toBe(1);
    });

    it('should match with default terms for _1080p pattern', () => {
      baseArgs.inputs = {};
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_1080p_UHD.mkv';

      const result = plugin(baseArgs);

      // Default terms are '_720p,_1080p', filename is 'Movie_1080p_UHD.mkv'
      // This should match '_1080p'
      expect(result.outputNumber).toBe(1);
    });

    it('should not match with default terms when filename does not contain them', () => {
      baseArgs.inputs = {};
      baseArgs.inputFileObj._id = 'C:/Videos/Movie_480p_DVD.mkv';

      const result = plugin(baseArgs);

      // Default terms are '_720p,_1080p', filename is 'Movie_480p_DVD.mkv'
      // This should not match either '_720p' or '_1080p'
      expect(result.outputNumber).toBe(2);
    });
  });
});
