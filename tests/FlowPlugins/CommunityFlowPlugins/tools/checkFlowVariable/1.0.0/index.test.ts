import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/checkFlowVariable/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('checkFlowVariable Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        variable: '',
        condition: '==',
        value: '',
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
      jobLog: jest.fn(),
      librarySettings: {
        _id: 'library123',
        name: 'Test Library',
      },
      userVariables: {
        library: {
          test: 'libraryValue',
        },
        global: {
          test: 'globalValue',
        },
      },
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Basic Variable Checking', () => {
    it('should match simple string variable with == condition', () => {
      baseArgs.inputs.variable = 'testString';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'testString';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testString of value testString matches condition == testString',
      );
    });

    it('should not match different string variable with == condition', () => {
      baseArgs.inputs.variable = 'testString';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'differentString';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testString of value testString does not match condition == differentString',
      );
    });

    it('should match different string variable with != condition', () => {
      baseArgs.inputs.variable = 'testString';
      baseArgs.inputs.condition = '!=';
      baseArgs.inputs.value = 'differentString';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testString of value testString matches condition != differentString',
      );
    });

    it('should not match same string variable with != condition', () => {
      baseArgs.inputs.variable = 'testString';
      baseArgs.inputs.condition = '!=';
      baseArgs.inputs.value = 'testString';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testString of value testString does not match condition != testString',
      );
    });
  });

  describe('Args Variable Access', () => {
    it('should access librarySettings._id', () => {
      baseArgs.inputs.variable = 'args.librarySettings._id';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'library123';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.librarySettings._id of value library123 matches condition == library123',
      );
    });

    it('should access inputFileObj._id', () => {
      baseArgs.inputs.variable = 'args.inputFileObj._id';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.inputFileObj._id of value C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4 '
        + 'matches condition == C:/Transcode/Source Folder/SampleVideo_1280x720_1mb.mp4',
      );
    });

    it('should access userVariables.library.test', () => {
      baseArgs.inputs.variable = 'args.userVariables.library.test';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'libraryValue';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.userVariables.library.test of value libraryValue matches condition == libraryValue',
      );
    });

    it('should access userVariables.global.test', () => {
      baseArgs.inputs.variable = 'args.userVariables.global.test';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'globalValue';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.userVariables.global.test of value globalValue matches condition == globalValue',
      );
    });

    it('should access ffProbeData.format.nb_streams', () => {
      baseArgs.inputs.variable = 'args.inputFileObj.ffProbeData.format.nb_streams';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = '2';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.inputFileObj.ffProbeData.format.nb_streams of value 2 matches condition == 2',
      );
    });

    it('should access ffProbeData.format.duration', () => {
      baseArgs.inputs.variable = 'args.inputFileObj.ffProbeData.format.duration';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = '5.312000';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.inputFileObj.ffProbeData.format.duration of value 5.312000 matches condition == 5.312000',
      );
    });
  });

  describe('Multiple Values Support', () => {
    it('should match one of multiple values with == condition', () => {
      baseArgs.inputs.variable = 'testValue';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'value1,testValue,value3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testValue of value testValue matches condition == value1,testValue,value3',
      );
    });

    it('should not match any of multiple values with == condition', () => {
      baseArgs.inputs.variable = 'testValue';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'value1,value2,value3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testValue of value testValue does not match condition == value1,value2,value3',
      );
    });

    it('should not match any of multiple values with != condition', () => {
      baseArgs.inputs.variable = 'testValue';
      baseArgs.inputs.condition = '!=';
      baseArgs.inputs.value = 'value1,value2,value3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testValue of value testValue matches condition != value1,value2,value3',
      );
    });

    it('should match one of multiple values with != condition', () => {
      baseArgs.inputs.variable = 'testValue';
      baseArgs.inputs.condition = '!=';
      baseArgs.inputs.value = 'value1,testValue,value3';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable testValue of value testValue does not match condition != value1,testValue,value3',
      );
    });
  });

  describe('Complex Variable Access', () => {
    it('should access container property', () => {
      baseArgs.inputs.variable = 'args.inputFileObj.container';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'mp4';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.inputFileObj.container of value mp4 matches condition == mp4',
      );
    });

    it('should access video_resolution property', () => {
      baseArgs.inputs.variable = 'args.inputFileObj.video_resolution';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = '720p';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.inputFileObj.video_resolution of value 720p matches condition == 720p',
      );
    });

    it('should access file format property', () => {
      baseArgs.inputs.variable = 'args.inputFileObj.ffProbeData.format.format_long_name';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'QuickTime / MOV';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.inputFileObj.ffProbeData.format.format_long_name of value QuickTime / MOV '
        + 'matches condition == QuickTime / MOV',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values by converting to string', () => {
      baseArgs.inputs.variable = 'args.nonExistentProperty';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'undefined';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable args.nonExistentProperty of value undefined matches condition == undefined',
      );
    });

    it('should handle empty string values', () => {
      baseArgs.inputs.variable = '';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = '';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Variable  of value  matches condition == ');
    });

    it('should handle whitespace in values', () => {
      baseArgs.inputs.variable = 'test with spaces';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'test with spaces';

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        'Variable test with spaces of value test with spaces matches condition == test with spaces',
      );
    });
  });

  describe('Logging', () => {
    it('should log variable and target values for both simple and args variables', () => {
      // Test simple variable logging
      baseArgs.inputs.variable = 'testVar';
      baseArgs.inputs.condition = '==';
      baseArgs.inputs.value = 'testValue';

      plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('variable = "testVar"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('targetValue = testVar');

      // Reset mock and test args variable logging
      (baseArgs.jobLog as jest.Mock).mockClear();

      baseArgs.inputs.variable = 'args.inputFileObj.container';
      baseArgs.inputs.value = 'mp4';

      plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('variable = "args.inputFileObj.container"');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('targetValue = mp4');
    });
  });
});
