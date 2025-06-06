/* eslint-disable */
// Mock the CLI utilities to avoid actual CLI execution
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

import { details, plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/basic/basicVideoOrAudio/1.0.0/index';
import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264_1 = require('../../../../../sampleData/media/sampleH264_1.json');
const sampleAAC = require('../../../../../sampleData/media/sampleAAC_1.json');
const sampleMP3 = require('../../../../../sampleData/media/sampleMP3_1.json');

describe('basicVideoOrAudio Plugin', () => {
  let baseArgs: IpluginInputArgs;

  beforeEach(() => {
    baseArgs = {
      inputs: {
        basicSettingsType: 'video',
        outputFileContainer: 'mkv',
        cliTool: 'handbrake',
        cliArguments: '-Z "Very Fast 1080p30"',
        codecFilter: 'ignore',
        codecs: '',
        fileSizeRangeMinMB: '0',
        fileSizeRangeMaxMB: '200000',
        videoHeightRangeMin: '0',
        videoHeightRangeMax: '5000',
        videoWidthRangeMin: '0',
        videoWidthRangeMax: '8000',
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
      inputFileObj: JSON.parse(JSON.stringify(sampleH264_1)),
      jobLog: jest.fn(),
      handbrakePath: '/usr/bin/handbrake',
      ffmpegPath: '/usr/bin/ffmpeg',
      mkvpropeditPath: '/usr/bin/mkvpropedit',
      logFullCliOutput: false,
      updateWorker: jest.fn(),
      logOutcome: jest.fn(),
      workDir: '/tmp/work/test_workdir',
      platform: 'linux',
      arch: 'x64',
      originalLibraryFile: JSON.parse(JSON.stringify(sampleH264_1)),
      nodeHardwareType: 'cpu',
      workerType: 'transcode',
      librarySettings: {},
      userVariables: {
        global: {},
        library: {},
      },
      config: {},
      job: {} as any,
      platform_arch_isdocker: 'linux_x64_false',
      lastSuccesfulPlugin: null,
      lastSuccessfulRun: null,
      updateStat: jest.fn(),
      installClassicPluginDeps: jest.fn(),
      deps: {
        fsextra: {
          ensureDirSync: jest.fn(),
        },
        parseArgsStringToArgv: jest.fn().mockImplementation((str) => str.split(' ').filter(Boolean)),
        importFresh: jest.fn(),
        axiosMiddleware: jest.fn(),
        requireFromString: jest.fn(),
        upath: {
          join: (...paths: string[]) => paths.join('/'),
          basename: (path: string) => path.split('/').pop() || '',
          extname: (path: string) => {
            const name = path.split('/').pop() || '';
            const dotIndex = name.lastIndexOf('.');
            return dotIndex > 0 ? name.substring(dotIndex) : '';
          },
        },
        gracefulfs: {},
        mvdir: jest.fn(),
        ncp: jest.fn(),
        axios: {},
        crudTransDBN: jest.fn(),
        configVars: {
          config: {
            serverIP: '127.0.0.1',
            serverPort: '8266',
          },
        },
      },
    } as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('File Size Filtering', () => {
    it.each([
      { size: 1000, min: '500', max: '2000', shouldProcess: true, description: 'within range' },
      { size: 100, min: '500', max: '2000', shouldProcess: false, description: 'below minimum' },
      { size: 3000, min: '500', max: '2000', shouldProcess: false, description: 'above maximum' },
    ])('should handle file size $description ($size MB)', async ({ size, min, max, shouldProcess }) => {
      baseArgs.inputFileObj.file_size = size;
      baseArgs.inputs.fileSizeRangeMinMB = min;
      baseArgs.inputs.fileSizeRangeMaxMB = max;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      if (shouldProcess) {
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          expect.stringContaining(`due to size ${size}MB in range ${min}MB to ${max}MB`)
        );
      } else {
        expect(result.outputFileObj._id).toBe(baseArgs.inputFileObj._id);
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          expect.stringContaining(`due to size ${size}MB not in range ${min}MB to ${max}MB`)
        );
      }
    });
  });

  describe('Video Dimension Filtering', () => {
    beforeEach(() => {
      baseArgs.inputs.basicSettingsType = 'video';
    });

    it.each([
      { dimension: 'height', value: 720, min: '700', max: '1440', shouldProcess: true },
      { dimension: 'height', value: 720, min: '1000', max: '2000', shouldProcess: false },
      { dimension: 'width', value: 1280, min: '1200', max: '2560', shouldProcess: true },
      { dimension: 'width', value: 1280, min: '1500', max: '4000', shouldProcess: false },
    ])('should handle video $dimension filtering ($value in range $min-$max)', async ({ dimension, value, min, max, shouldProcess }) => {
      if (dimension === 'height') {
        baseArgs.inputs.videoHeightRangeMin = min;
        baseArgs.inputs.videoHeightRangeMax = max;
      } else {
        baseArgs.inputs.videoWidthRangeMin = min;
        baseArgs.inputs.videoWidthRangeMax = max;
      }

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      if (shouldProcess) {
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          expect.stringContaining(`due to ${dimension} ${value} in range ${min} to ${max}`)
        );
      } else {
        expect(result.outputFileObj._id).toBe(baseArgs.inputFileObj._id);
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          expect.stringContaining(`due to ${dimension} ${value} not in range ${min} to ${max}`)
        );
      }
    });
  });

  describe('Codec Filtering', () => {
    it.each([
      { filter: 'ignore', codecs: 'mpeg2,mpeg4', shouldProcess: true, expectedLog: 'not in list' },
      { filter: 'ignore', codecs: 'h264,h265', shouldProcess: false, expectedLog: 'in list' },
      { filter: 'allow', codecs: 'h264,h265', shouldProcess: true, expectedLog: 'in list' },
      { filter: 'allow', codecs: 'mpeg2,mpeg4', shouldProcess: false, expectedLog: 'not in list' },
    ])('should handle codec filtering with $filter filter', async ({ filter, codecs, shouldProcess, expectedLog }) => {
      baseArgs.inputs.codecFilter = filter;
      baseArgs.inputs.codecs = codecs;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      if (shouldProcess) {
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          expect.stringContaining(`due to codec h264 ${expectedLog} ${codecs}`)
        );
      } else {
        expect(result.outputFileObj._id).toBe(baseArgs.inputFileObj._id);
        expect(baseArgs.jobLog).toHaveBeenCalledWith(
          expect.stringContaining(`due to codec h264 ${expectedLog} ${codecs}`)
        );
      }
    });
  });

  describe('Audio Processing', () => {
    it('should process audio files', async () => {
      baseArgs.inputs.basicSettingsType = 'audio';
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleAAC)) as IFileObject;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Processing')
      );
    });

    it('should process MP3 audio files', async () => {
      baseArgs.inputs.basicSettingsType = 'audio';
      baseArgs.inputs.codecFilter = 'allow';
      baseArgs.inputs.codecs = 'mp3,aac';
      baseArgs.inputFileObj = JSON.parse(JSON.stringify(sampleMP3)) as IFileObject;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Processing')
      );
    });
  });

  describe('CLI Tool Configuration', () => {
    it.each([
      { 
        tool: 'handbrake', 
        args: '-Z "Very Fast 1080p30" --preset-import-gui', 
        expectedPath: '/usr/bin/handbrake',
        expectedPreset: 'Very Fast 1080p30' 
      },
      { 
        tool: 'ffmpeg', 
        args: '-c:v libx264 -crf 23,-c:a aac -b:a 128k', 
        expectedPath: '/usr/bin/ffmpeg',
        expectedPreset: 'libx264' 
      },
      { 
        tool: 'ffmpeg', 
        args: '-f lavfi -i testsrc=duration=10<io>-c:v libx264 -t 10', 
        expectedPath: '/usr/bin/ffmpeg',
        expectedPreset: 'testsrc' 
      },
    ])('should configure $tool CLI correctly', async ({ tool, args, expectedPath, expectedPreset }) => {
      baseArgs.inputs.cliTool = tool;
      baseArgs.inputs.cliArguments = args;

      await plugin(baseArgs);

      expect(baseArgs.updateWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          CLIType: expectedPath,
          preset: expect.stringContaining(expectedPreset),
        })
      );
    });
  });

  describe('Container Handling', () => {
    it.each([
      { container: 'mp4', expectedExtension: '.mp4' },
      { container: '.mkv', expectedExtension: '.mkv' },
      { container: 'original', expectedExtension: '.mp4' }, // original file is .mp4
    ])('should handle $container container', async ({ container, expectedExtension }) => {
      baseArgs.inputs.outputFileContainer = container;

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain(expectedExtension);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no streams found', async () => {
      delete baseArgs.inputFileObj.ffProbeData.streams;

      await expect(plugin(baseArgs)).rejects.toThrow('No streams found in file FFprobe data');
    });

    it('should throw error when no video stream found for video processing', async () => {
      baseArgs.inputs.basicSettingsType = 'video';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'aac',
          codec_type: 'audio',
        },
      ];

      await expect(plugin(baseArgs)).rejects.toThrow('No video stream found in file FFprobe data');
    });

    it('should throw error when no audio stream found for audio processing', async () => {
      baseArgs.inputs.basicSettingsType = 'audio';
      baseArgs.inputFileObj.ffProbeData.streams = [
        {
          index: 0,
          codec_name: 'h264',
          codec_type: 'video',
        },
      ];

      await expect(plugin(baseArgs)).rejects.toThrow('No audio stream found in file FFprobe data');
    });
  });

  describe('Success Outcomes', () => {
    it('should log successful transcoding outcome', async () => {
      await plugin(baseArgs);

      expect(baseArgs.logOutcome).toHaveBeenCalledWith('tSuc');
    });

    it('should return correct output file path', async () => {
      baseArgs.inputs.outputFileContainer = 'mp4';

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(result.outputFileObj._id).toContain('.mp4');
      expect(result.outputFileObj._id).toContain(baseArgs.workDir);
      expect(result.variables).toBe(baseArgs.variables);
    });
  });
});