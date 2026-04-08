import { promises as fsp } from 'fs';

import { plugin, details } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkForHardlinks/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      stat: jest.fn(),
    },
  };
});

describe('checkForHardlinks Plugin', () => {
  let baseArgs: IpluginInputArgs;
  const mockStat = fsp.stat as jest.MockedFunction<typeof fsp.stat>;

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
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;

    jest.clearAllMocks();
  });

  describe('details', () => {
    it('should have the correct plugin details', () => {
      const d = details();
      expect(d.name).toBe('Check For Hardlinks');
      expect(d.outputs).toHaveLength(2);
      expect(d.outputs[0].tooltip).toBe('File has hardlinks');
      expect(d.outputs[1].tooltip).toBe('File does not have hardlinks');
    });
  });

  describe('hardlink detection', () => {
    it('should return output 1 when file has hardlinks (nlink > 1)', async () => {
      mockStat.mockResolvedValue({ nlink: 3 } as any);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(mockStat).toHaveBeenCalledWith(baseArgs.inputFileObj._id);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('3 link(s)'),
      );
    });

    it('should return output 2 when file has no hardlinks (nlink === 1)', async () => {
      mockStat.mockResolvedValue({ nlink: 1 } as any);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('1 link(s)'),
      );
    });

    it('should return output 1 when file has exactly 2 links', async () => {
      mockStat.mockResolvedValue({ nlink: 2 } as any);

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
    });
  });

  describe('variable propagation', () => {
    it('should preserve variables in output', async () => {
      mockStat.mockResolvedValue({ nlink: 1 } as any);
      baseArgs.variables.user = { testVar: 'testValue' };

      const result = await plugin(baseArgs);

      expect(result.variables.user).toEqual({ testVar: 'testValue' });
    });
  });

  describe('logging', () => {
    it('should log the file path being checked', async () => {
      mockStat.mockResolvedValue({ nlink: 1 } as any);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining(baseArgs.inputFileObj._id),
      );
    });

    it('should log the routing decision for hardlinked files', async () => {
      mockStat.mockResolvedValue({ nlink: 2 } as any);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('File has hardlinks, routing to output 1');
    });

    it('should log the routing decision for non-hardlinked files', async () => {
      mockStat.mockResolvedValue({ nlink: 1 } as any);

      await plugin(baseArgs);

      expect(baseArgs.jobLog).toHaveBeenCalledWith('File does not have hardlinks, routing to output 2');
    });
  });
});
