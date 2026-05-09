import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/setWorkingFile/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('setWorkingFile Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        source: 'originalFile',
        customPath: '',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    baseArgs.inputFileObj._id = '/working/transcoded_file.mp4';
    baseArgs.originalLibraryFile._id = '/library/original_movie.mkv';
  });

  describe('Original File Mode', () => {
    it('should set working file to original file by default', () => {
      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/library/original_movie.mkv');
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should set working file to original file when explicitly selected', () => {
      baseArgs.inputs.source = 'originalFile';

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/library/original_movie.mkv');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Setting working file to original file: /library/original_movie.mkv',
      );
    });

    it('should handle when original and working files are the same', () => {
      baseArgs.inputFileObj._id = '/library/original_movie.mkv';
      baseArgs.originalLibraryFile._id = '/library/original_movie.mkv';

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/library/original_movie.mkv');
      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Custom Path Mode', () => {
    it('should set working file to a custom path', () => {
      baseArgs.inputs.source = 'customPath';
      baseArgs.inputs.customPath = '/cache/cached_copy.mkv';

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/cache/cached_copy.mkv');
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Setting working file to custom path: /cache/cached_copy.mkv',
      );
    });

    it('should trim whitespace from custom path', () => {
      baseArgs.inputs.source = 'customPath';
      baseArgs.inputs.customPath = '  /cache/cached_copy.mkv  ';

      const result = plugin(baseArgs);

      expect(result.outputFileObj._id).toBe('/cache/cached_copy.mkv');
    });

    it('should throw when custom path is empty', () => {
      baseArgs.inputs.source = 'customPath';
      baseArgs.inputs.customPath = '';

      expect(() => plugin(baseArgs)).toThrow('Custom path is empty. Please provide a valid file path.');
    });

    it('should throw when custom path is only whitespace', () => {
      baseArgs.inputs.source = 'customPath';
      baseArgs.inputs.customPath = '   ';

      expect(() => plugin(baseArgs)).toThrow('Custom path is empty. Please provide a valid file path.');
    });
  });

  describe('Variables Preservation', () => {
    it('should preserve variables in original file mode', () => {
      baseArgs.variables.user = { stage: '2' };

      const result = plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.user.stage).toBe('2');
    });

    it('should preserve variables in custom path mode', () => {
      baseArgs.inputs.source = 'customPath';
      baseArgs.inputs.customPath = '/cache/file.mkv';
      baseArgs.variables.user = { stage: '2' };

      const result = plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
      expect(result.variables.user.stage).toBe('2');
    });
  });
});
