import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/file/downloadWorkingFile/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import getConfigVars from '../../../../configVars';

const sampleH264 = require('../../../../../sampleData/media/sampleH264_1.json');

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
  },
  realpathSync: jest.fn((path) => path),
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
  statSync: jest.fn(() => ({ isDirectory: () => false, isFile: () => true })),
}));

describe('downloadWorkingFile Plugin', () => {
  let baseArgs: IpluginInputArgs;
  let mockShouldDownloadWorkingFile: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const configVars = getConfigVars();

    mockShouldDownloadWorkingFile = jest.fn().mockResolvedValue(undefined);

    baseArgs = {
      isAutomation: false,
      inputs: {},
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264)),
      jobLog: jest.fn(),
      workDir: '/tmp/workdir',
      librarySettings: {},
      userVariables: {
        global: {},
        library: {},
      },
      platform: 'linux',
      arch: 'x64',
      handbrakePath: '/usr/bin/handbrake',
      ffmpegPath: '/usr/bin/ffmpeg',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264)),
      nodeHardwareType: 'cpu',
      workerType: 'cpu',
      nodeTags: '',
      config: {},
      job: {} as IpluginInputArgs['job'],
      platform_arch_isdocker: 'linux_x64_false',
      lastSuccesfulPlugin: null,
      lastSuccessfulRun: null,
      updateWorker: jest.fn(),
      logFullCliOutput: false,
      logOutcome: jest.fn(),
      updateStat: jest.fn(),
      shouldDownloadWorkingFile: mockShouldDownloadWorkingFile,
      configVars,
      deps: {
        fsextra: {},
        upath: {
          normalize: (path: string) => path.replace(/\\/g, '/'),
          join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
          joinSafe: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
        },
        parseArgsStringToArgv: jest.fn(),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        gracefulfs: jest.fn(),
        mvdir: jest.fn(),
        ncp: jest.fn(),
        axios: jest.fn(),
        crudTransDBN: jest.fn(),
        configVars,
      },
      installClassicPluginDeps: jest.fn(),
      thisPlugin: {},
    } as IpluginInputArgs;
  });

  it('should call shouldDownloadWorkingFile with the input file path', async () => {
    const result = await plugin(baseArgs);

    expect(mockShouldDownloadWorkingFile).toHaveBeenCalledWith(baseArgs.inputFileObj._id);
    expect(result.outputNumber).toBe(1);
    expect(result.outputFileObj._id).toBe(baseArgs.inputFileObj._id);
  });

  it('should preserve variables in the output', async () => {
    const testVariables = {
      ffmpegCommand: {} as IpluginInputArgs['variables']['ffmpegCommand'],
      flowFailed: false,
      user: { skipAutoDownload: 'true' },
    };
    baseArgs.variables = testVariables;

    const result = await plugin(baseArgs);

    expect(result.variables).toBe(testVariables);
  });

  it('should log download messages', async () => {
    await plugin(baseArgs);

    expect(baseArgs.jobLog).toHaveBeenCalledWith(
      `Downloading working file: ${baseArgs.inputFileObj._id}`,
    );
    expect(baseArgs.jobLog).toHaveBeenCalledWith('Download complete');
  });

  it('should throw if shouldDownloadWorkingFile is not available', async () => {
    baseArgs.shouldDownloadWorkingFile = undefined;

    await expect(plugin(baseArgs)).rejects.toThrow(
      /shouldDownloadWorkingFile not available/,
    );
  });

  it('should propagate download errors', async () => {
    mockShouldDownloadWorkingFile.mockRejectedValue(new Error('404 Not Found'));

    await expect(plugin(baseArgs)).rejects.toThrow('404 Not Found');
  });
});
