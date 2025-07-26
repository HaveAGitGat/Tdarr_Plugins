import { iso6392BTo1, iso6392TTo1 } from 'iso-639-2';
import { existsSync } from 'fs';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';

const details = (): IpluginDetails => ({
  name: 'Get SRT Subtitles',
  description: 'Get SRT subtitles from video file',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Input Codec',
      name: 'inputCodec',
      type: 'string',
      defaultValue: 'srt',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Comma separated list of input subtitle codecs to be processed.
        They should be text based format subtitle.
        Supported values are subrip, srt, ass, ssa.
          \\nExample:\\n
          subrip,srt
        `,
    },
    {
      label: 'Languages',
      name: 'languages',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Comma separated language tag/s to be kept.
        \\nMust follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes.
          \\nExample:\\n
          eng,ind
        `,
    },
    {
      label: 'Overwrite file',
      name: 'overwriteFile',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to overwrite existing subtitle file if found',
    },
    {
      label: 'ISO 639-1 output filename',
      name: 'useISO6391',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip:
        `
        Toggle whether to use ISO 639-1 (2 letter language code) instead for output file.
        This is so that it is compatible with Bazarr default format.
        For instance, you will get <filename>.en.srt instead of <filename>.eng.srt for English subtitle.
        `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Subtitles are extracted',
    },
    {
      number: 2,
      tooltip: 'No subtitle extracted',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const inputCodec = String(args.inputs.inputCodec).trim().split(',').map((item) => item.trim().toLowerCase());
  const langs = String(args.inputs.languages).trim().split(',').map((item) => item.trim().toLowerCase());
  const overwrite = Boolean(args.inputs.overwriteFile);
  const useISO6391 = Boolean(args.inputs.useISO6391);

  const supportedCodecs = ['subrip', 'srt', 'ass', 'ssa'];

  const invalidInputCodec = inputCodec.filter(codec => !supportedCodecs.includes(codec));
  if (invalidInputCodec.length > 0) {
    throw new Error(`Unsupported inputCodec: ${invalidInputCodec.join(',')}. Supported values are 'subrip', 'srt', 'ass', 'ssa'`)
  }

  const inputFileName = args.inputFileObj._id;
  const subsStreams = args.inputFileObj.ffProbeData.streams?.filter(
    (stream) => stream.codec_type.toLowerCase() === 'subtitle',
  );

  if (subsStreams === undefined || subsStreams.length === 0) {
    args.jobLog('No subtitle stream found, there\'s nothing to do');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  const cliArgs: string[] = ['-y', `-i ${inputFileName}`];
  let shouldProcess = false;

  subsStreams.forEach((stream, index) => {
    // default to english when language tag is not defined
    let lang = 'eng';
    let title = '';
    const streamCodec = stream.codec_name.toLowerCase();

    if (stream.tags && stream.tags.language) {
      lang = stream.tags.language.toLowerCase();
    }

    if (stream.tags && stream.tags.title) {
      title = stream.tags.title.toLowerCase();
    }

    const isCommentary = title.includes('commentary') || title.includes('description');

    if (langs.includes(lang) && inputCodec.includes(streamCodec) && !isCommentary) {
      args.jobLog(`Subtitle stream with index s:${index} matches language and input codec, processing...`);

      if (useISO6391) {
        // try to get the 639-1 language code and fallback to the language from ffprobeData
        lang = iso6392BTo1[lang] ?? iso6392TTo1[lang] ?? lang;
      }

      const out = inputFileName.split('.');
      out[out.length - 2] += `.${lang}`;
      out[out.length - 1] = 'srt';
      const outFile = out.join('.');

      args.jobLog(`Output filename for subtitle stream with index s:${index} is ${outFile}`);

      if (existsSync(outFile)) {
        if (overwrite) {
          args.jobLog(`${outFile} already exists. Will be overwritten because overwrite is set to true`);
          cliArgs.push(`-map 0:s:${index} -c:s srt ${outFile}`);
          shouldProcess = true;
        } else {
          args.jobLog(`${outFile} already exists. Skipping because overwrite is set to false`);
        }
      } else {
        cliArgs.push(`-map 0:s:${index} -c:s srt ${outFile}`);
        shouldProcess = true;
      }
    }
  });

  if (!shouldProcess) {
    args.jobLog('No processing needed. Exiting...');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  const spawnArgs = cliArgs.map((row) => row.trim()).filter((row) => row !== '');
  args.jobLog('Sending job to worker node...');
  args.jobLog(JSON.stringify({ spawnArgs }));

  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: spawnArgs.join(' '),
  });

  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: '',
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog('FFmpeg command failed');
    throw new Error('FFmpeg failed');
  }

  args.logOutcome('tSuc');

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
