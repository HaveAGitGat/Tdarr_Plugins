import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/compareFileDurationRatio/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('compareFileDurationRatio Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        greaterThan: '99.5',
        lessThan: '100.5',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Duration Ratio Within Range', () => {
    it('should pass when durations are identical', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has duration 5.312 which is 100% of original file duration:  5.312',
      );
    });

    it('should pass when new file duration is within acceptable range (99.6%)', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.288'; // 99.6% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.288');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has duration 5.288 which is 99.54819277108433% of original file duration:  5.312',
      );
    });

    it('should pass when new file duration is within acceptable range (100.4%)', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.333'; // 100.4% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.333');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has duration 5.333 which is 100.39533132530121% of original file duration:  5.312',
      );
    });
  });

  describe('Duration Ratio Below Lower Bound', () => {
    it('should fail when new file duration is below lower bound', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.200'; // 97.89% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.2');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file duration not within limits. New file has duration 5.200 which is 97.89156626506023% '
        + 'of original file duration:  5.312. lowerBound is 99.5%',
      );
    });

    it('should fail with custom lower bound', () => {
      baseArgs.inputs.greaterThan = '95';
      baseArgs.inputs.lessThan = '105';

      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '4.900'; // 92.25% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file duration not within limits. New file has duration 4.900 which is 92.24397590361446% '
        + 'of original file duration:  5.312. lowerBound is 95%',
      );
    });
  });

  describe('Duration Ratio Above Upper Bound', () => {
    it('should fail when new file duration is above upper bound', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.400'; // 101.66% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.4');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file duration not within limits. New file has duration 5.400 which is 101.6566265060241% '
        + 'of original file duration:  5.312. upperBound is 100.5%',
      );
    });

    it('should fail with custom upper bound', () => {
      baseArgs.inputs.greaterThan = '98';
      baseArgs.inputs.lessThan = '102';

      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.450'; // 102.6% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file duration not within limits. New file has duration 5.450 which is 102.59789156626506% '
        + 'of original file duration:  5.312. upperBound is 102%',
      );
    });
  });

  describe('Different Media Types', () => {
    it('should work with MP3 files', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.originalLibraryFile = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 30.023');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 30.023');
    });

    it('should work when comparing different file types with similar durations', () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject; // 5.312s
      baseArgs.originalLibraryFile = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject; // 30.023s

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2); // Should fail as 5.312 is much shorter than 30.023
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 30.023');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing duration in new file', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        delete (modifiedFileObj.ffProbeData.format as Record<string, unknown>).duration;
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 0');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
    });

    it('should handle missing duration in original file', () => {
      const modifiedOriginalFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedOriginalFile.ffProbeData?.format) {
        delete (modifiedOriginalFile.ffProbeData.format as Record<string, unknown>).duration;
      }
      baseArgs.originalLibraryFile = modifiedOriginalFile;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3); // Division by zero results in Infinity which is > upper bound
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 0');
    });

    it('should handle zero duration in new file', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '0';
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 0');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
    });

    it('should handle zero duration in original file', () => {
      const modifiedOriginalFile = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedOriginalFile.ffProbeData?.format) {
        modifiedOriginalFile.ffProbeData.format.duration = '0';
      }
      baseArgs.originalLibraryFile = modifiedOriginalFile;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 5.312');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 0');
    });

    it('should handle missing ffProbeData', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      (modifiedFileObj as Record<string, unknown>).ffProbeData = undefined;
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 0');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
    });

    it('should handle missing format data', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData) {
        (modifiedFileObj.ffProbeData as Record<string, unknown>).format = undefined;
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 0');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
    });

    it('should handle negative duration values', () => {
      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '-5.312';
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('newFileDuration: 0');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('origFileDuration: 5.312');
    });
  });

  describe('Custom Bounds', () => {
    it('should work with wide bounds', () => {
      baseArgs.inputs.greaterThan = '50';
      baseArgs.inputs.lessThan = '150';

      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '6.000'; // 112.95% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has duration 6.000 which is 112.95180722891564% of original file duration:  5.312',
      );
    });

    it('should work with narrow bounds', () => {
      baseArgs.inputs.greaterThan = '99.9';
      baseArgs.inputs.lessThan = '100.1';

      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.315'; // 100.06% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file has duration 5.315 which is 100.05647590361446% of original file duration:  5.312',
      );
    });

    it('should fail with narrow bounds when slightly outside', () => {
      baseArgs.inputs.greaterThan = '99.9';
      baseArgs.inputs.lessThan = '100.1';

      const modifiedFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
      if (modifiedFileObj.ffProbeData?.format) {
        modifiedFileObj.ffProbeData.format.duration = '5.320'; // 100.15% of 5.312
      }
      baseArgs.inputFileObj = modifiedFileObj;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(3);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'New file duration not within limits. New file has duration 5.320 which is 100.15060240963855% '
        + 'of original file duration:  5.312. upperBound is 100.1%',
      );
    });
  });
});
