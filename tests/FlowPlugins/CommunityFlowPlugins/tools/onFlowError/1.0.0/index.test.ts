import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/onFlowError/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('onFlowError Plugin', () => {
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      jobLog: jest.fn(),
      librarySettings: {},
      userVariables: {
        global: {},
        library: {},
      },
      workDir: '/tmp/test',
      platform: 'linux',
      arch: 'x64',
      handbrakePath: '/usr/bin/HandBrake',
      ffmpegPath: '/usr/bin/ffmpeg',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      nodeHardwareType: 'cpu',
      workerType: 'classic',
      config: {},
      job: {} as IpluginInputArgs['job'],
      platform_arch_isdocker: 'linux_x64_false',
      lastSuccesfulPlugin: null,
      lastSuccessfulRun: null,
      updateWorker: jest.fn(),
      logFullCliOutput: false,
      logOutcome: jest.fn(),
      deps: {
        fsextra: {},
        parseArgsStringToArgv: {},
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: {},
        gracefulfs: {},
        mvdir: {},
        ncp: {},
        axios: {},
        crudTransDBN: jest.fn(),
        configVars: {
          config: {
            serverIP: '127.0.0.1',
            serverPort: '8265',
          },
        },
      },
      installClassicPluginDeps: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('Core Functionality', () => {
    it('should always return output number 1 and preserve input/variables unchanged', () => {
      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should work regardless of flowFailed state', () => {
      // Test with flowFailed = true
      baseArgs.variables.flowFailed = true;
      let result = plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(result.variables.flowFailed).toBe(true);

      // Test with flowFailed = false
      baseArgs.variables.flowFailed = false;
      result = plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(result.variables.flowFailed).toBe(false);
    });

    it('should handle missing or empty variables gracefully', () => {
      baseArgs.variables = {} as IpluginInputArgs['variables'];

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.variables).toEqual({});
    });
  });

  describe('File Object Handling', () => {
    it('should work with different file types and preserve properties', () => {
      const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleAAC)) as IFileObject;
      const originalFileId = baseArgs.inputFileObj._id;
      const originalContainer = baseArgs.inputFileObj.container;

      const result = plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputFileObj._id).toBe(originalFileId);
      expect((result.outputFileObj as IFileObject).container).toBe(originalContainer);
    });
  });

  describe('Variables State Preservation', () => {
    it('should preserve all variable states without modification', () => {
      // Set up various variable states
      baseArgs.variables.ffmpegCommand.shouldProcess = true;
      baseArgs.variables.ffmpegCommand.container = 'mkv';
      baseArgs.variables.user = { customVar: 'testValue' };
      baseArgs.variables.healthCheck = 'Success';
      baseArgs.variables.queueTags = 'test,priority';

      const result = plugin(baseArgs);

      expect(result.variables.ffmpegCommand.shouldProcess).toBe(true);
      expect(result.variables.ffmpegCommand.container).toBe('mkv');
      expect(result.variables.user.customVar).toBe('testValue');
      expect(result.variables.healthCheck).toBe('Success');
      expect(result.variables.queueTags).toBe('test,priority');
    });
  });
});
