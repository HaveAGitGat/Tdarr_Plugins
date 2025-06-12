import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/processedAdd/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

// Mock the fileUtils module
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils', () => ({
  ...jest.requireActual('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils'),
  hashFile: jest.fn(),
}));

describe('processedAdd Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockCrudTransDBN: jest.Mock;

  beforeEach(() => {
    mockCrudTransDBN = jest.fn().mockResolvedValue(undefined);

    baseArgs = {
      inputs: {
        checkType: 'filePath',
        fileToAdd: 'originalFile',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)) as IFileObject,
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
        crudTransDBN: mockCrudTransDBN,
        configVars: {
          config: {
            serverIP: 'localhost',
            serverPort: '8000',
          },
        },
      },
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  describe('File Path Check Type', () => {
    it('should add original file path to skiplist', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        baseArgs.originalLibraryFile._id,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        baseArgs.originalLibraryFile._id,
        {
          _id: baseArgs.originalLibraryFile._id,
          DB: baseArgs.originalLibraryFile.DB,
          file: baseArgs.originalLibraryFile.file,
          date: expect.any(Number),
        },
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Added ${baseArgs.originalLibraryFile._id} to skiplist`,
      );
    });

    it('should add working file path to skiplist when fileToAdd is workingFile', async () => {
      baseArgs.inputs.fileToAdd = 'workingFile';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        baseArgs.inputFileObj._id,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        baseArgs.inputFileObj._id,
        {
          _id: baseArgs.inputFileObj._id,
          DB: baseArgs.inputFileObj.DB,
          file: baseArgs.inputFileObj.file,
          date: expect.any(Number),
        },
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Added ${baseArgs.inputFileObj._id} to skiplist`,
      );
    });
  });

  describe('File Name Check Type', () => {
    it('should add original file name to skiplist', async () => {
      baseArgs.inputs.checkType = 'fileName';
      const expectedFileName = `${baseArgs.originalLibraryFile.fileNameWithoutExtension}.${
        baseArgs.originalLibraryFile.container
      }`;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        expectedFileName,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        expectedFileName,
        {
          _id: expectedFileName,
          DB: baseArgs.originalLibraryFile.DB,
          file: baseArgs.originalLibraryFile.file,
          date: expect.any(Number),
        },
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Added ${expectedFileName} to skiplist`,
      );
    });

    it('should add working file name to skiplist when fileToAdd is workingFile', async () => {
      baseArgs.inputs.checkType = 'fileName';
      baseArgs.inputs.fileToAdd = 'workingFile';
      const expectedFileName = `${baseArgs.inputFileObj.fileNameWithoutExtension}.${
        baseArgs.inputFileObj.container
      }`;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        expectedFileName,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        expectedFileName,
        {
          _id: expectedFileName,
          DB: baseArgs.inputFileObj.DB,
          file: baseArgs.inputFileObj.file,
          date: expect.any(Number),
        },
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Added ${expectedFileName} to skiplist`,
      );
    });
  });

  describe('File Hash Check Type', () => {
    it('should add original file hash to skiplist', async () => {
      const { hashFile } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
      baseArgs.inputs.checkType = 'fileHash';
      const mockHash = 'mock-hash-value-123';

      (hashFile as jest.Mock).mockResolvedValue(mockHash);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(hashFile).toHaveBeenCalledWith(
        baseArgs.originalLibraryFile._id,
        'sha256',
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        mockHash,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        mockHash,
        {
          _id: mockHash,
          DB: baseArgs.originalLibraryFile.DB,
          file: baseArgs.originalLibraryFile.file,
          date: expect.any(Number),
        },
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Added ${mockHash} to skiplist`,
      );
    });

    it('should add working file hash to skiplist when fileToAdd is workingFile', async () => {
      const { hashFile } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/fileUtils');
      baseArgs.inputs.checkType = 'fileHash';
      baseArgs.inputs.fileToAdd = 'workingFile';
      const mockHash = 'mock-hash-value-456';

      (hashFile as jest.Mock).mockResolvedValue(mockHash);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(hashFile).toHaveBeenCalledWith(baseArgs.inputFileObj._id, 'sha256');
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        mockHash,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        mockHash,
        {
          _id: mockHash,
          DB: baseArgs.inputFileObj.DB,
          file: baseArgs.inputFileObj.file,
          date: expect.any(Number),
        },
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        `Added ${mockHash} to skiplist`,
      );
    });
  });

  describe('Different File Types', () => {
    it('should work with MP3 files', async () => {
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;
      baseArgs.originalLibraryFile = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        baseArgs.originalLibraryFile._id,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'insert',
        baseArgs.originalLibraryFile._id,
        {
          _id: baseArgs.originalLibraryFile._id,
          DB: baseArgs.originalLibraryFile.DB,
          file: baseArgs.originalLibraryFile.file,
          date: expect.any(Number),
        },
      );
    });

    it('should work with video files', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(mockCrudTransDBN).toHaveBeenCalledWith(
        'F2FOutputJSONDB',
        'removeOne',
        baseArgs.originalLibraryFile._id,
        {},
      );
    });
  });

  describe('Database Operations', () => {
    it('should call removeOne before insert to avoid duplicates', async () => {
      await plugin(baseArgs);

      expect(mockCrudTransDBN).toHaveBeenCalledTimes(2);
      expect(mockCrudTransDBN).toHaveBeenNthCalledWith(
        1,
        'F2FOutputJSONDB',
        'removeOne',
        baseArgs.originalLibraryFile._id,
        {},
      );
      expect(mockCrudTransDBN).toHaveBeenNthCalledWith(
        2,
        'F2FOutputJSONDB',
        'insert',
        baseArgs.originalLibraryFile._id,
        {
          _id: baseArgs.originalLibraryFile._id,
          DB: baseArgs.originalLibraryFile.DB,
          file: baseArgs.originalLibraryFile.file,
          date: expect.any(Number),
        },
      );
    });

    it('should handle database errors gracefully', async () => {
      mockCrudTransDBN.mockRejectedValue(new Error('Database error'));

      await expect(plugin(baseArgs)).rejects.toThrow('Database error');
    });
  });

  describe('Input Validation', () => {
    it('should handle filePath checkType', async () => {
      baseArgs.inputs.checkType = 'filePath';

      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledTimes(2);
    });

    it('should handle fileName checkType', async () => {
      baseArgs.inputs.checkType = 'fileName';

      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledTimes(2);
    });

    it('should handle fileHash checkType', async () => {
      baseArgs.inputs.checkType = 'fileHash';

      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledTimes(2);
    });

    it('should handle originalFile fileToAdd option', async () => {
      baseArgs.inputs.fileToAdd = 'originalFile';

      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledTimes(2);
    });

    it('should handle workingFile fileToAdd option', async () => {
      baseArgs.inputs.fileToAdd = 'workingFile';

      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
      expect(mockCrudTransDBN).toHaveBeenCalledTimes(2);
    });
  });

  describe('Return Values', () => {
    it('should return correct output structure', async () => {
      const result = await plugin(baseArgs);

      expect(result).toHaveProperty('outputFileObj');
      expect(result).toHaveProperty('outputNumber');
      expect(result).toHaveProperty('variables');
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(result.outputNumber).toBe(1);
      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should always return outputNumber 1 with filePath config', async () => {
      baseArgs.inputs = { ...baseArgs.inputs, checkType: 'filePath', fileToAdd: 'originalFile' };
      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
    });

    it('should always return outputNumber 1 with fileName config', async () => {
      baseArgs.inputs = { ...baseArgs.inputs, checkType: 'fileName', fileToAdd: 'workingFile' };
      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
    });

    it('should always return outputNumber 1 with fileHash config', async () => {
      baseArgs.inputs = { ...baseArgs.inputs, checkType: 'fileHash', fileToAdd: 'originalFile' };
      const result = await plugin(baseArgs);
      expect(result.outputNumber).toBe(1);
    });
  });
});
