import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/checkFileChanged/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

const mockLib = {
  loadDefaultValues: jest.fn((inputs) => inputs),
};

jest.mock('../../../../../../methods/lib', () => () => mockLib);

describe('checkFileChanged Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let originalFileObj: IFileObject;
  let inputFileObj: IFileObject;

  beforeEach(() => {
    jest.clearAllMocks();

    originalFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
    originalFileObj._id = '/original/path/video.mp4';
    originalFileObj.file_size = 100;

    inputFileObj = JSON.parse(JSON.stringify(sampleH264)) as IFileObject;
    inputFileObj._id = '/working/path/video_transcoded.mkv';
    inputFileObj.file_size = 80;

    baseArgs = {
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj,
      originalLibraryFile: originalFileObj,
      jobLog: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  it('should expose changed and unchanged outputs', () => {
    const pluginDetails = details();

    expect(pluginDetails.name).toBe('Check File Changed');
    expect(pluginDetails.outputs).toEqual([
      {
        number: 1,
        tooltip: 'Working file has changed',
      },
      {
        number: 2,
        tooltip: 'Working file has not changed',
      },
    ]);
  });

  it('should output 1 when path and size changed', () => {
    const result = plugin(baseArgs);

    expect(result.outputNumber).toBe(1);
    expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    expect(result.variables).toBe(baseArgs.variables);
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file has changed');
  });

  it('should output 1 when only path changed', () => {
    baseArgs.inputFileObj.file_size = originalFileObj.file_size;

    const result = plugin(baseArgs);

    expect(result.outputNumber).toBe(1);
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file has changed');
  });

  it('should output 1 when only size changed', () => {
    baseArgs.inputFileObj._id = originalFileObj._id;

    const result = plugin(baseArgs);

    expect(result.outputNumber).toBe(1);
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file has changed');
  });

  it('should output 2 when path and size are unchanged', () => {
    baseArgs.inputFileObj._id = originalFileObj._id;
    baseArgs.inputFileObj.file_size = originalFileObj.file_size;

    const result = plugin(baseArgs);

    expect(result.outputNumber).toBe(2);
    expect(result.outputFileObj).toBe(baseArgs.inputFileObj);
    expect(result.variables).toBe(baseArgs.variables);
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Working file has not changed');
  });

  it('should log comparison details', () => {
    plugin(baseArgs);

    expect(baseArgs.jobLog).toHaveBeenCalledWith(JSON.stringify({
      workingFile: '/working/path/video_transcoded.mkv',
      originalFile: '/original/path/video.mp4',
      workingFileSize: 80,
      originalFileSize: 100,
      pathChanged: true,
      sizeChanged: true,
    }));
  });
});
