import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/extractSrtSubtitles/1.0.0/index';

import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject, Itags } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264_1 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mock the CLI class
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

describe('extractSrtSubtitles Plugin', () => {
  let baseArgs: IpluginInputArgs;

  const createSubStream = (
    index: number,
    codec_name: string,
    tags?: Itags,
    disposition?: Record<string, number>,
  ) => ({
    index, codec_name, codec_type: 'subtitle', tags, disposition,
  });

  beforeEach(() => {
    // Reset CLI mock to success for each test
    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    CLI.mockImplementation(() => ({
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
    }));

    baseArgs = {
      inputs: {
        inputCodec: 'ass,subrip',
        languages: 'eng,ind',
        overWriteFile: false,
        useISO6391: true,
        enableHI: true,
        hiTag: 'hi',
        enableForced: true,
        forcedTag: 'forced',
        enableDefault: false,
        defaultTag: 'default',
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264_1)) as IFileObject,
      jobLog: jest.fn(),
      updateWorker: jest.fn(),
      logOutcome: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Execution', () => {
    it('should not modify the input file object', async () => {
      const result = await plugin(baseArgs);

      expect(result.variables).toBe(baseArgs.variables);
    });

    it('should handle no subtitle stream', async () => {
      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching("No subtitle stream found, there's nothing to do"),
      );
    });

    it('should detect number of subtitle streams', async () => {
      baseArgs.inputFileObj.ffProbeData.streams?.push(
        createSubStream(2, 'subrip', { language: 'eng' }),
        createSubStream(3, 'webvtt', { language: 'eng' }),
        createSubStream(4, 'hdmv_pgs_subtitle', { language: 'eng' }),
      );

      await plugin(baseArgs);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching('Found 3 subtitle stream\\(s\\), processing...'),
      );
    });

    it('should ignore commentary subtitle and non matching inputs', async () => {
      baseArgs.inputFileObj.ffProbeData.streams?.push(
        createSubStream(2, 'subrip', { language: 'eng', title: 'English Commentary' }),
        createSubStream(3, 'ass', { language: 'ind', title: 'Indonesian Description by Director' }),
        createSubStream(4, 'ass', { language: 'eng' }),
        createSubStream(5, 'webvtt', { language: 'eng' }),
        createSubStream(6, 'webvtt', { language: 'kor' }),
      );

      await plugin(baseArgs);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Subtitle stream[0] doesn\'t match'),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Subtitle stream[1] doesn\'t match'),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching('Subtitle stream\\[2\\] will be processed...'),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Subtitle stream[3] doesn\'t match'),
      );
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Subtitle stream[4] doesn\'t match'),
      );
    });

    it.each([
      {
        inputs: {},
        expectedOut: '/a/file.en.hi.forced.srt',
      },
      {
        inputs: { useISO6391: false, enableHI: false, enableDefault: true },
        expectedOut: '/a/file.eng.forced.default.srt',
      },
      {
        inputs: { hiTag: 'sdh', enableForced: false },
        expectedOut: '/a/file.en.sdh.srt',
      },
    ])('should produce correct output file depending on inputs', async ({ inputs, expectedOut }) => {
      const newArgs = {
        ...baseArgs,
        inputs: {
          ...baseArgs.inputs,
          ...inputs,
        },
      };

      newArgs.inputFileObj._id = '/a/file.mkv';
      newArgs.inputFileObj.ffProbeData.streams?.push(
        createSubStream(2, 'subrip', { language: 'eng', title: '[SDH] English' }, { forced: 1, default: 1 }),
      );

      await plugin(newArgs);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching(`Output filename for .+: "${expectedOut}"`),
      );
    });

    it('should not overwrite existing file if told', async () => {
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);

      baseArgs.inputFileObj.ffProbeData.streams?.push(
        createSubStream(2, 'subrip', { language: 'eng' }),
      );

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining('Skipping because "overwriteFile" is set to "false"'),
      );

      // restore mock after use
      jest.spyOn(require('fs'), 'existsSync').mockRestore();
    });

    it.each([
      {
        inputs: {
          inputCodec: 'subrip,ass',
          languages: 'eng,fra',
          useISO6391: true,
        },
        expectedArgs: [
          '-map', '0:s:0', '-c:s', 'srt', '/a/file.en.hi.srt',
          '-map', '0:s:1', '-c:s', 'srt', '/a/file.fr.srt',
        ],
      },
      {
        inputs: {
          inputCodec: 'ass',
          languages: 'eng,ind',
          useISO6391: false,
          forcedTag: 'fc',
        },
        expectedArgs: [
          '-map', '0:s:4', '-c:s', 'srt', '/a/file.ind.hi.fc.srt',
        ],
      },
    ])('should generate command according to inputs', async ({ inputs, expectedArgs }) => {
      baseArgs.inputs = { ...inputs };
      baseArgs.inputFileObj._id = '/a/file.mkv';
      baseArgs.inputFileObj.ffProbeData.streams?.push(
        createSubStream(2, 'subrip', { language: 'eng', title: '[HI] English' }),
        createSubStream(3, 'ass', { language: 'fra' }),
        createSubStream(4, 'hdmv_pgs_subtitle', { language: 'ind' }),
        createSubStream(5, 'ssa', { language: 'eng' }, { forced: 1 }),
        createSubStream(6, 'ass', { language: 'ind', title: '[HI] Indonesian' }, { forced: 1 }),
      );

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.updateWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          CLIType: baseArgs.ffmpegPath,
          preset: `-y -i /a/file.mkv ${expectedArgs.join(' ')}`,
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when using unsupported inputCodec', async () => {
      baseArgs.inputs.inputCodec = 'hdmv_pgs_subtitle,subrip,webvtt';

      await expect(plugin(baseArgs)).rejects.toThrow(
        'Unsupported inputCodec: hdmv_pgs_subtitle,webvtt',
      );
    });

    it('should throw error when CLI fails', async () => {
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      CLI.mockImplementation(() => ({
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 1 }),
      }));

      baseArgs.inputFileObj.ffProbeData.streams?.push(
        createSubStream(2, 'subrip', { language: 'eng' }),
      );

      await expect(plugin(baseArgs)).rejects.toThrow('FFmpeg failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('FFmpeg command failed');
    });
  });
});
