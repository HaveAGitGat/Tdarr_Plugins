import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileSize/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');
const sampleH264Small = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleH265Medium = require('../../../../../sampleData/media/sampleH265_1.json');
const sampleH264Large = require('../../../../../sampleData/media/sampleH264_2.json');

describe('checkFileSize Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        unit: 'MB',
        greaterThan: '0',
        lessThan: '10',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264Small)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('File Size Range Checks', () => {
    it('should pass when file size is within range', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '10';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });

    it('should fail when file size is below range', () => {
      baseArgs.inputs.greaterThan = '5';
      baseArgs.inputs.lessThan = '10';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should fail when file size is above range', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '0.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle boundary values correctly', () => {
      baseArgs.inputs.greaterThan = '1.007';
      baseArgs.inputs.lessThan = '1.008';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Unit Conversions', () => {
    it.each([
      ['B', '500000', '2000000'],
      ['KB', '500', '2000'],
      ['MB', '0.5', '2'],
    ])('should work with unit %s', (unit, greaterThan, lessThan) => {
      baseArgs.inputs.unit = unit;
      baseArgs.inputs.greaterThan = greaterThan;
      baseArgs.inputs.lessThan = lessThan;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should work with gigabytes for large files', () => {
      baseArgs.inputs.unit = 'GB';
      baseArgs.inputs.greaterThan = '0.001';
      baseArgs.inputs.lessThan = '0.1';
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264Large)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero file size', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '1';
      baseArgs.inputFileObj.file_size = 0;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle very small thresholds', () => {
      baseArgs.inputs.unit = 'B';
      baseArgs.inputs.greaterThan = '1';
      baseArgs.inputs.lessThan = '100';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
    });

    it('should handle very large thresholds', () => {
      baseArgs.inputs.unit = 'GB';
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '1000';
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264Large)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Multiple File Types', () => {
    it.each([
      ['MP3 audio file', sampleMP3],
      ['H264 video file', sampleH264Small],
      ['H265 video file', sampleH265Medium],
      ['Large H264 file', sampleH264Large],
    ])('should handle %s', (description, sampleData) => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '100';
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleData)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('Input Parsing', () => {
    it('should handle string inputs correctly', () => {
      baseArgs.inputs.greaterThan = '0.5';
      baseArgs.inputs.lessThan = '2.5';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });

    it('should handle integer string inputs', () => {
      baseArgs.inputs.greaterThan = '0';
      baseArgs.inputs.lessThan = '10';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });
});
