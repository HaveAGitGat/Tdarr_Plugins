import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/processedCheck/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

describe('processedCheck Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCrudTransDBN: jest.Mock;

  beforeEach(() => {
    mockCrudTransDBN = jest.fn();

    const inputFileObj = {
      ...JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      fileNameWithoutExtension: 'SampleVideo_1280x720_1mb',
    };

    baseArgs = {
      inputs: {
        checkType: 'filePath',
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
      inputFileObj,
      librarySettings: {},
      userVariables: {
        global: {},
        library: {},
      },
      jobLog: jest.fn(),
      workDir: '/tmp',
      platform: 'linux',
      arch: 'x64',
      handbrakePath: '/usr/bin/HandBrakeCLI',
      ffmpegPath: '/usr/bin/ffmpeg',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      originalLibraryFile: inputFileObj,
      nodeHardwareType: 'cpu',
      workerType: 'classic',
      config: {},
      job: {} as IpluginInputArgs['job'],
      platform_arch_isdocker: 'linux_x64_false',
      lastSuccesfulPlugin: {},
      lastSuccessfulRun: {},
      updateWorker: jest.fn(),
      logFullCliOutput: false,
      logOutcome: jest.fn(),
      updateStat: jest.fn(),
      deps: {
        fsextra: {},
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: {},
        gracefulfs: {},
        mvdir: {},
        ncp: {},
        axios: {},
        crudTransDBN: mockCrudTransDBN,
        configVars: {
          config: {
            serverIP: '127.0.0.1',
            serverPort: '8265',
          },
        },
      },
      installClassicPluginDeps: jest.fn(),
    } as IpluginInputArgs;
  });

  describe('Check Type: filePath', () => {
    it('should return output 1 when file is not on library skiplist', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${baseArgs.inputFileObj._id}`,
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is not on library skiplist');
      expect(mockCrudTransDBN).toHaveBeenCalledWith('F2FOutputJSONDB', 'getById', baseArgs.inputFileObj._id, {});
    });

    it('should return output 2 when file is on skiplist', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockResolvedValue({
        _id: baseArgs.inputFileObj._id,
        DB: baseArgs.inputFileObj.DB,
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${baseArgs.inputFileObj._id}`,
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is on library skiplist');
    });

    it('should return output 1 when file is not on library skiplist', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockResolvedValue({
        _id: baseArgs.inputFileObj._id,
        DB: 'DIFFERENT_DB_ID',
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is not on library skiplist');
    });
  });

  describe('Check Type: fileName', () => {
    it('should return output 1 when file is not on library skiplist', async () => {
      baseArgs.inputs.checkType = 'fileName';
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      const expectedProperty = `${baseArgs.inputFileObj.fileNameWithoutExtension}.${baseArgs.inputFileObj.container}`;

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${expectedProperty}`,
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is not on library skiplist');
      expect(mockCrudTransDBN).toHaveBeenCalledWith('F2FOutputJSONDB', 'getById', expectedProperty, {});
    });

    it('should return output 2 when file is on skiplist', async () => {
      baseArgs.inputs.checkType = 'fileName';
      const expectedProperty = `${baseArgs.inputFileObj.fileNameWithoutExtension}.${baseArgs.inputFileObj.container}`;
      mockCrudTransDBN.mockResolvedValue({
        _id: expectedProperty,
        DB: baseArgs.inputFileObj.DB,
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is on library skiplist');
    });
  });

  describe('Check Type: fileHash', () => {
    let originalHashFile: typeof import('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils').hashFile;

    beforeEach(() => {
      // Store the original hashFile function
      const fileUtils = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
      originalHashFile = fileUtils.hashFile;

      // Mock the hashFile function
      fileUtils.hashFile = jest.fn();
    });

    afterEach(() => {
      // Restore the original hashFile function
      const fileUtils = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
      fileUtils.hashFile = originalHashFile;
      jest.clearAllMocks();
    });

    it('should return output 1 when file is not on library skiplist', async () => {
      baseArgs.inputs.checkType = 'fileHash';
      const mockHash = 'abc123def456';
      const fileUtils = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
      (fileUtils.hashFile as jest.Mock).mockResolvedValue(mockHash);
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${mockHash}`,
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is not on library skiplist');
      expect(mockCrudTransDBN).toHaveBeenCalledWith('F2FOutputJSONDB', 'getById', mockHash, {});
    });

    it('should return output 2 when file is on skiplist', async () => {
      baseArgs.inputs.checkType = 'fileHash';
      const mockHash = 'abc123def456';
      const fileUtils = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
      (fileUtils.hashFile as jest.Mock).mockResolvedValue(mockHash);
      mockCrudTransDBN.mockResolvedValue({
        _id: mockHash,
        DB: baseArgs.inputFileObj.DB,
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is on library skiplist');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing fileNameWithoutExtension property', async () => {
      baseArgs.inputs.checkType = 'fileName';
      delete baseArgs.inputFileObj.fileNameWithoutExtension;
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      const expectedProperty = `undefined.${baseArgs.inputFileObj.container}`;
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${expectedProperty}`,
      );
    });

    it('should handle null DB comparison', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockResolvedValue({
        _id: baseArgs.inputFileObj._id,
        DB: null,
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is not on library skiplist');
    });

    it('should handle undefined DB comparison', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockResolvedValue({
        _id: baseArgs.inputFileObj._id,
        // DB property is undefined
      });

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('File is not on library skiplist');
    });

    it('should handle empty string checkType (defaults to filePath)', async () => {
      baseArgs.inputs.checkType = '';
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${baseArgs.inputFileObj._id}`,
      );
    });

    it('should handle invalid checkType (results in empty property)', async () => {
      baseArgs.inputs.checkType = 'invalidType';
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith('Checking if file is on skiplist: ');
    });
  });

  describe('Database Interaction', () => {
    it('should handle database errors gracefully', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockRejectedValue(new Error('Database connection failed'));

      await expect(plugin(baseArgs)).rejects.toThrow('Database connection failed');
    });

    it('should pass correct parameters to crudTransDBN', async () => {
      baseArgs.inputs.checkType = 'filePath';
      mockCrudTransDBN.mockResolvedValue(undefined);

      await plugin(baseArgs);

      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'getById',
        baseArgs.inputFileObj._id,
        {},
      );
    });
  });

  describe('Default Values Loading', () => {
    it('should use default checkType when not provided', async () => {
      delete baseArgs.inputs.checkType;
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      // Default should be 'filePath' according to the plugin definition
      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Checking if file is on skiplist: ${baseArgs.inputFileObj._id}`,
      );
    });
  });

  describe('Return Values', () => {
    it('should preserve input variables in output', async () => {
      const testVariables = {
        ffmpegCommand: {} as IpluginInputArgs['variables']['ffmpegCommand'],
        flowFailed: false,
        user: { customVar: 'testValue' },
      };
      baseArgs.variables = testVariables;
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      expect(result.variables).toBe(testVariables);
    });

    it('should return correct outputFileObj', async () => {
      mockCrudTransDBN.mockResolvedValue(undefined);

      const result = await plugin(baseArgs);

      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    });
  });
});
