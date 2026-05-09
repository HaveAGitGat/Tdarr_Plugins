import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileMedium/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('checkFileMedium Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('File Medium Detection', () => {
    it.each([
      ['video', 1, sampleH264, 'H264 video file'],
      ['video', 1, sampleAAC, 'AAC video file'],
      ['audio', 2, sampleMP3, 'MP3 audio file'],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ])('should return output %d for %s medium (%s)', (medium, expectedOutput, sampleFile, _description) => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleFile)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(expectedOutput);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
      expect((result.outputFileObj as IFileObject).fileMedium).toBe(medium);
    });

    it('should detect other file medium', () => {
      const otherFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      otherFile.fileMedium = 'other';
      baseArgs.inputFileObj = otherFile;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });
  });

  describe('Error Handling', () => {
    it.each([
      [undefined, 'missing fileMedium'],
      ['invalid', 'invalid fileMedium'],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ])('should throw error when fileMedium is %s', (fileMediumValue, _description) => {
      const fileWithInvalidMedium = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fileWithInvalidMedium as any).fileMedium = fileMediumValue;
      baseArgs.inputFileObj = fileWithInvalidMedium;

      expect(() => plugin(baseArgs)).toThrow('File has no fileMedium!');
    });
  });

  describe('Plugin Configuration', () => {
    it('should preserve variables through execution', () => {
      baseArgs.variables.user = { testVar: 'testValue' };
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.variables.user).toEqual({ testVar: 'testValue' });
    });
  });
});
