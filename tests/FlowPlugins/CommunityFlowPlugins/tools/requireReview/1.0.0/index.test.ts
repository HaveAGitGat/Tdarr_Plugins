import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/requireReview/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('requireReview Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
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
  });

  describe('Basic Functionality', () => {
    it('should always return output number 1 and pass through input file object unchanged', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should work with any file type', () => {
      // Test with different sample files to ensure file type doesn't matter
      const sampleFiles = [
        require('../../../../../sampleData/media/sampleAAC_1.json'),
        require('../../../../../sampleData/media/sampleMP3_1.json'),
        require('../../../../../sampleData/media/sampleH265_1.json'),
      ];

      sampleFiles.forEach((sampleFile) => {
        baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleFile)) as IFileObject;
        const result = plugin(baseArgs);

        expect(result.outputNumber).toBe(1);
        expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
        expect(result.variables).toBe(baseArgs.variables);
      });
    });

    it('should preserve user variables', () => {
      baseArgs.variables.user = {
        testVar: 'testValue',
        anotherVar: '123',
      };

      const result = plugin(baseArgs);

      expect(result.variables.user.testVar).toBe('testValue');
      expect(result.variables.user.anotherVar).toBe('123');
    });
  });
});
