import { existsSync } from 'fs';
import { plugin } from
  '../../../../../../FlowPluginsTs/CommunityFlowPlugins/tools/getSrtSubtitles/1.0.0/index';

import { IpluginInputArgs } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/interfaces';
import { IFileObject, Itags } from '../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/interfaces/synced/IFileObject';

const sampleH264_1 = require('../../../../../sampleData/media/sampleH264_1.json');

// Mocks
jest.mock('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils', () => ({
  CLI: jest.fn().mockImplementation(() => ({
    runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
  })),
}));

// This is ESM package that jest is configured to ignore so we need to mock it
jest.mock('iso-639-2', () => ({
  iso6392BTo1: { eng: 'en', ind: 'id', fre: 'fr', },
  iso6392TTo1: { eng: 'en', ind: 'id', fra: 'fr', },
}));

describe('getSrtSubtitles Plugin', () => {
  let baseArgs: IpluginInputArgs;

  const createStream = (index: number, codec_name: string, codec_type: string, tags?: Itags) => ({
    index,
    codec_name,
    codec_type,
    tags,
  });

  beforeEach(() => {
    // Reset CLI mock to success for each test
    const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
    CLI.mockImplementation(() => ({
      runCli: jest.fn().mockResolvedValue({ cliExitCode: 0 }),
    }));

    baseArgs = {
      inputs: {
        inputCodec: 'ass,srt,subrip',
        languages: 'eng,ind',
        overwriteFile: false,
        useISO6391: true,
      },
      variables: {} as IpluginInputArgs['variables'],
      inputFileObj: JSON.parse(JSON.stringify(sampleH264_1)) as IFileObject,
      jobLog: jest.fn(),
      updateWorker: jest.fn(),
      logOutcome: jest.fn(),
    } as Partial<IpluginInputArgs> as IpluginInputArgs;
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
        expect.stringMatching('No subtitle stream found, there\'s nothing to do')
      );
    });

    it('should ignore when the only subtitle stream is commentary', async () => {
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'eng', title: 'English Commentary', }))
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'ind', title: 'Indonesian Commentary', }))

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(2);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringMatching('No processing needed. Exiting...')
      );
    });

    it.each([
      { languages: 'fra', expectedArgs: '-y -i /a/file.mkv -map 0:s:0 -c:s srt /a/file.fr.srt',},
      { languages: 'fre', expectedArgs: '-y -i /a/file.mkv -map 0:s:1 -c:s srt /a/file.fr.srt',},
    ])('should handle both ISO 639-2B and 639-2T', async ({ languages, expectedArgs }) => {
      baseArgs.inputs.languages = languages;

      baseArgs.inputFileObj._id = '/a/file.mkv';
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'fra' }))
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'fre' }))

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(1);
      expect(baseArgs.updateWorker).toHaveBeenCalledWith(
        expect.objectContaining({
          CLIType: baseArgs.ffmpegPath,
          preset: expectedArgs,
        })
      )
    });

    it.each([
      { inputCodec: 'subrip', languages: 'eng,ind', useISO6391: true, outputNumber: 1, expectedArgs: '-y -i /a/file.mkv -map 0:s:1 -c:s srt /a/file.en.srt -map 0:s:2 -c:s srt /a/file.en.srt',},
      { inputCodec: 'ass,ssa', languages: 'eng,ind', useISO6391: false, outputNumber: 1, expectedArgs: '-y -i /a/file.mkv -map 0:s:4 -c:s srt /a/file.ind.srt',},
      { inputCodec: 'ass,ssa', languages: 'fre', useISO6391: false, outputNumber: 2, expectedArgs: '-y -i /a/file.mkv',},
    ])('should handle according to inputs', async ({ inputCodec, languages, useISO6391, outputNumber, expectedArgs }) => {
      baseArgs.inputs.inputCodec = inputCodec;
      baseArgs.inputs.languages = languages;
      baseArgs.inputs.useISO6391 = useISO6391;

      baseArgs.inputFileObj._id = '/a/file.mkv';
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'ass', 'subtitle', { language: 'eng', title: 'English Commentary', }))
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'eng' }))
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle',))
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'hdmv_pgs_subtitle', 'subtitle', { language: 'eng' }))
      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'ass', 'subtitle', { language: 'ind' }))

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(outputNumber);
      if (outputNumber === 1) {
        expect(baseArgs.updateWorker).toHaveBeenCalledWith(
          expect.objectContaining({
            CLIType: baseArgs.ffmpegPath,
            preset: expectedArgs,
          })
        )
      }
    });

    it.each([
      { overwriteFile: true, outputNumber: 1, expectedLog: 'Will be overwritten because overwrite is set to true',},
      { overwriteFile: false, outputNumber: 2, expectedLog: 'Skipping because overwrite is set to false'},
    ])('should handle existing file according to overwriteFile inputs', async ({ overwriteFile, outputNumber, expectedLog }) => {
      const FS = require('fs');
      jest.spyOn(FS, 'existsSync').mockReturnValue(true);

      baseArgs.inputs.overwriteFile = overwriteFile;

      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'eng' }))

      const result = await plugin(baseArgs);

      expect(result.outputNumber).toBe(outputNumber);
      expect(baseArgs.jobLog).toHaveBeenCalledWith(
        expect.stringContaining(expectedLog)
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when inputCodec is not supported', async () => {
      baseArgs.inputs.inputCodec = 'hdmv_pgs_subtitle,subrip,webvtt';

      await expect(plugin(baseArgs)).rejects.toThrow(`Unsupported inputCodec: hdmv_pgs_subtitle,webvtt. Supported values are 'subrip', 'srt', 'ass', 'ssa'`);
    });

    it('should throw error when CLI fails', async () => {
      const { CLI } = require('../../../../../../FlowPluginsTs/FlowHelpers/1.0.0/cliUtils');
      CLI.mockImplementation(() => ({
        runCli: jest.fn().mockResolvedValue({ cliExitCode: 1 }),
      }));

      baseArgs.inputFileObj.ffProbeData.streams?.push(createStream((baseArgs.inputFileObj.ffProbeData.streams.length - 1), 'subrip', 'subtitle', { language: 'eng' }))

      await expect(plugin(baseArgs)).rejects.toThrow('FFmpeg failed');
      expect(baseArgs.jobLog).toHaveBeenCalledWith('FFmpeg command failed')
    });
  });
});
